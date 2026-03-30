/**
 * api/services/gemini.js
 * Dedicated service for Gemini AI orchestration.
 * Handles retries, model fallback, and response validation.
 */

import { SYSTEM_PROMPT } from "../utils/prompt.js";
import { getGeminiSchema } from "../utils/schema.js";

export class GeminiService {
  constructor(aiClient) {
    this.ai = aiClient;
    this.models = ["gemini-2.5-flash", "gemini-2.0-flash"]; // Fallback strategy: Preview -> Stable
    this.maxAttempts = 3;
  }

  /**
   * Main entry point to generate a structured chat response.
   */
  async generateChatResponse({ message, chatHistory, userProfile, intelSnippets }) {
    let lastError = null;
    const categoryLabel = userProfile?.categoryLabel || "All Intel";

    for (const modelName of this.models) {
      let attempts = 0;
      
      while (attempts < this.maxAttempts) {
        try {
          const result = await this.ai.models.generateContent({
            model: modelName,
            contents: [
              ...(chatHistory || []).map(m => ({
                role: m.role === "ai" ? "model" : "user",
                parts: [{ text: m.content }]
              })),
              { role: "user", parts: [{ text: message }] }
            ],
            config: {
              systemInstruction: SYSTEM_PROMPT(userProfile || {}, categoryLabel, intelSnippets),
              responseMimeType: "application/json",
              responseSchema: getGeminiSchema()
            }
          });

          const rawContent = this._extractRawText(result);
          const parsed = this._parseAndValidate(rawContent);
          
          return {
            raw: rawContent,
            parsed: this._postProcess(parsed, intelSnippets),
            success: true,
            model: modelName
          };

        } catch (error) {
          attempts++;
          lastError = error;
          
          console.warn(`[GeminiService] Model ${modelName} attempt ${attempts}/${this.maxAttempts} failed:`, error.message);

          if (this._isRetryable(error) && attempts < this.maxAttempts) {
            await this._backoff(attempts);
            continue;
          }
          
          // If not retryable or max attempts reached for this model, move to next model
          break;
        }
      }
    }

    // If we get here, all models and attempts failed
    throw lastError || new Error("All AI models failed to respond.");
  }

  /**
   * Extracts text or handles safety blocks.
   */
  _extractRawText(result) {
    if (result.text) {
      return result.text;
    }
    
    if (result.candidates && result.candidates.length > 0) {
      const firstCandidate = result.candidates[0];
      if (firstCandidate.content?.parts?.[0]?.text) {
        return firstCandidate.content.parts[0].text;
      }
    }
    
    throw new Error("AI response was blocked or empty.");
  }

  /**
   * Ensures the response is valid JSON and has basic required fields.
   */
  _parseAndValidate(rawContent) {
    try {
      const parsed = JSON.parse(rawContent);
      
      // Defensive defaults
      if (!Array.isArray(parsed.sources)) parsed.sources = [];
      if (!Array.isArray(parsed.recommendations)) parsed.recommendations = [];
      if (!Array.isArray(parsed.citations)) parsed.citations = [];
      if (parsed.general_knowledge_note === undefined) parsed.general_knowledge_note = null;
      
      return parsed;
    } catch (err) {
      console.error("[GeminiService] Failed to parse JSON:", err.message, rawContent);
      throw new Error("Malformed JSON response from AI service.");
    }
  }

  /**
   * Adds metadata or fixes sources for UI consistency.
   * Also captures and fixes common 'hallucinations' like returning indices instead of objects.
   */
  _postProcess(parsed, intelSnippets) {
    // 1. Fix 'sources' hallucinations (indices or missing Reddit tag)
    if (Array.isArray(parsed.sources)) {
      parsed.sources = parsed.sources.map(s => {
        if (typeof s === 'number' && intelSnippets[s]) {
          return {
            platform: "Reddit",
            label: "Reddit community intel",
            age: "Verified Local Info",
            color: "#ff4500"
          };
        }
        return s;
      }).filter(s => s && typeof s === 'object');
    } else {
      parsed.sources = [];
    }

    // Add Reddit source indicator if we have RAG results but model didn't explicitly tag it
    if (intelSnippets && intelSnippets.length > 0) {
      const hasRedditSource = parsed.sources.some(s => s && s.platform === "Reddit");
      if (!hasRedditSource) {
        parsed.sources.unshift({
          platform: "Reddit",
          label: "Reddit community intel",
          age: "Verified Local Info",
          color: "#ff4500"
        });
      }
    }

    // 2. Fix 'citations' hallucinations (indices)
    if (Array.isArray(parsed.citations)) {
      parsed.citations = parsed.citations.map(c => {
        // If it's a number, map it to the corresponding snippet
        if (typeof c === 'number' && intelSnippets[c]) {
          return {
            source_id: `Snippet ${c + 1}`,
            url: intelSnippets[c].url
          };
        }
        return c;
      }).filter(c => c && typeof c === 'object' && c.source_id && c.url);
    } else {
      parsed.citations = [];
    }

    // 3. Fix 'recommendations' hallucinations (indices)
    if (Array.isArray(parsed.recommendations)) {
      parsed.recommendations = parsed.recommendations.filter(r => r && typeof r === 'object');
    } else {
      parsed.recommendations = [];
    }

    return parsed;
  }

  /**
   * Exponential backoff.
   */
  async _backoff(attempts) {
    const delay = Math.pow(2, attempts) * 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Checks if an error is worth retrying.
   */
  _isRetryable(error) {
    const msg = (error.message || "").toLowerCase();
    const status = error.status;
    
    return (
      status === 503 || 
      status === 429 || 
      msg.includes("503") || 
      msg.includes("429") || 
      msg.includes("overloaded") ||
      msg.includes("deadline exceeded")
    );
  }
}
