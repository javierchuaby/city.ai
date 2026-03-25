import { genAI_Chat, getRelevantIntel } from "./utils/rag.js";
import { SYSTEM_PROMPT } from "./utils/prompt.js";
import { parseAIResponse } from "./utils/json.js";

/**
 * api/chat.js
 * Vercel Serverless Function to handle AI orchestration with Gemini RAG and Supabase.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userProfile, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Missing user message' });
  }

  // Ensure AI_API_KEY is present
  if (!process.env.AI_API_KEY) {
    console.error("Missing AI_API_KEY in environment.");
    return res.status(500).json({ error: 'AI_API_KEY is not configured on the server.' });
  }

  try {
    // Step 1: Fetch relevant intel snippets (RAG)
    const intelSnippets = await getRelevantIntel(message);
    const categoryLabel = userProfile?.categoryLabel || "All Intel";

    // Step 2: Call Gemini with augmented prompt
    const model = genAI_Chat.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT(userProfile || {}, categoryLabel, intelSnippets),
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const chat = model.startChat({
      history: (chatHistory || []).map(m => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.content }]
      }))
    });

    const result = await chat.sendMessage(message);
    const rawContent = result.response.text();

    // Step 3: Handle JSON parsing and structure validation
    const safeParsed = parseAIResponse(rawContent);

    // Post-process sources based on intel retrieval
    if (intelSnippets.length > 0) {
      if (!safeParsed.sources.some(s => s.label.includes("Reddit"))) {
        safeParsed.sources.unshift({
          platform: "Reddit",
          label: "Reddit community intel",
          age: "Verified Local Info",
          color: "#ff4500"
        });
      }
    } else {
      // Fallback: If no intel found, remove accidental Reddit source hallucinations
      safeParsed.sources = safeParsed.sources.filter(s => !s.label.includes("Reddit"));
    }

    return res.status(200).json({
      raw: rawContent,
      parsed: safeParsed,
      success: true
    });
  } catch (error) {
    console.error("Backend AI Error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to connect to AI service.",
      parsed: {
        answer: "Sorry, I'm having trouble connecting to my local sources. How else can I help you explore Singapore?",
        sources: [],
        trust: 0,
        freshness: "N/A",
        recommendations: [],
        has_conflict: false
      }
    });
  }
}
