import { SYSTEM_PROMPT } from "../utils/prompt.js";
import { getGeminiSchema, chatResponseSchema } from "../utils/schema.js";
import { config } from "../config/index.js";

export class GeminiService {
  /**
   * @param {Object} aiClient - Injected generative AI client.
   */
  constructor(aiClient) {
    this.ai = aiClient;
    this.models = config.gemini.models.chat || ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
    this.maxAttempts = config.app.maxRetries || 3;
  }

  /**
   * Generates a structured response based on user input and retrieved intel.
   * @param {Object} params - { message, chatHistory, userProfile, intelSnippets }
   */
  async generateChatResponse({ message, chatHistory, userProfile, intelSnippets }) {
    let lastError = null;
    const profile = userProfile || {};
    const categoryLabel = profile.categoryLabel || "All Intel";

    for (const modelName of this.models) {
      let attempts = 0;

      while (attempts < this.maxAttempts) {
        try {
          const model = this.ai.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_PROMPT(profile, categoryLabel, intelSnippets),
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: getGeminiSchema()
            }
          });

          // Convert history to Gemini format
          const history = (chatHistory || []).map(m => ({
            role: m.role === "ai" ? "model" : "user",
            parts: [{ text: m.content }]
          }));

          const chat = model.startChat({ history });
          const result = await chat.sendMessage(message);
          const response = await result.response;
          const rawText = response.text();

          const parsed = this._parseAndValidate(rawText);

          return {
            raw: rawText,
            parsed: this._postProcess(parsed, intelSnippets),
            success: true,
            model: modelName
          };

        } catch (error) {
          attempts++;
          lastError = error;

          console.warn(`[GeminiService] Model ${modelName} fail (Attempt ${attempts}):`, error.message);

          if (this._isRetryable(error) && attempts < this.maxAttempts) {
            await this._backoff(attempts);
            continue;
          }
          break; // Try next model
        }
      }
    }

    throw lastError || new Error("All AI models and fallbacks failed.");
  }

  /**
   * Robust JSON extraction and validation using Zod.
   */
  _parseAndValidate(raw) {
    try {
      let clean = raw;
      const startIdx = raw.indexOf('{');
      const endIdx = raw.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        clean = raw.substring(startIdx, endIdx + 1);
      }

      const data = JSON.parse(clean);
      return chatResponseSchema.parse(data);
    } catch (err) {
      throw new Error(`AI generated invalid response structure: ${err.message}`);
    }
  }

  /**
   * Final cleanup and 'hallucination' mitigation.
   */
  _postProcess(parsed, intelSnippets) {
    // Ensure Reddit tagging for RAG results
    if (intelSnippets?.length > 0) {
      const hasReddit = parsed.sources.some(s => s.platform === "Reddit");
      if (!hasReddit) {
        parsed.sources.unshift({
          platform: "Reddit",
          label: "Reddit community intel",
          age: "Verified Local Info",
          color: "#ff4500"
        });
      }
    }

    // Fix citation indices hallucinations
    parsed.citations = (parsed.citations || []).map(c => {
      if (typeof c === 'number' && intelSnippets[c]) {
        return { source_id: `Snippet ${c + 1}`, url: intelSnippets[c].url };
      }
      return c;
    }).filter(c => c && typeof c === 'object' && c.source_id && c.url);

    return parsed;
  }

  _isRetryable(err) {
    const msg = (err.message || "").toLowerCase();
    const code = err.status || err.code;
    return code === 503 || code === 429 || msg.includes("503") || msg.includes("429") || msg.includes("overloaded");
  }

  async _backoff(attempts) {
    const delay = Math.pow(2, attempts) * 1000;
    return new Promise(r => setTimeout(r, delay));
  }
}
