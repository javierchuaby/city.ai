import { ChatService } from "./services/chatService.js";
import { IntelService } from "./services/intelService.js";
import { GeminiService } from "./services/geminiService.js";
import { GoogleGenAI } from "@google/genai";
import { createDatabaseClient } from "./utils/database.js";
import { config, validateConfig } from "./config.js";
import { RESPONSE_TYPES } from "../shared/constants.js";

/**
 * api/chat.js
 * Vercel Serverless Function to handle AI orchestration.
 * Decoupled: Acts as the Composition Root for services.
 */

// Initialize Infrastructure (Singletons for the handler instance)
const db = createDatabaseClient(config.supabase);
const aiClient = new GoogleGenAI({ apiKey: config.gemini.apiKey });

// Initialize Services with Dependency Injection
const intelService = new IntelService(aiClient, db);
const geminiService = new GeminiService(aiClient);
const chatService = new ChatService(intelService, geminiService);

export default async function handler(req, res) {
  try {
    validateConfig();
  } catch (err) {
    console.error("[Config Error]", err.message);
    return res.status(500).json({ error: "Server configuration error." });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userProfile, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Missing user message' });
  }

  // Set headers for streaming status updates
  res.setHeader('Content-Type', 'application/json'); 
  res.setHeader('Transfer-Encoding', 'chunked');

  const sendStatus = (status) => {
    res.write(JSON.stringify({ type: RESPONSE_TYPES.STATUS, status }) + '\n');
  };

  try {
    // Delegate full AI orchestration to chatService
    const result = await chatService.processChat(
      { message, userProfile, chatHistory },
      (status) => sendStatus(status)
    );

    // Final response
    res.write(JSON.stringify({
      type: RESPONSE_TYPES.FINAL,
      raw: result.raw,
      parsed: result.parsed,
      success: true,
      meta: { model: result.model }
    }) + '\n');
    
    res.end();

  } catch (error) {
    console.error("[Chat Handler] Critical Error:", error.message);

    // Provide a fail-safe UI response even on total service failure
    const errorResponse = {
      type: RESPONSE_TYPES.FINAL,
      success: false,
      error: "Our local intel sources are currently overloaded. Please try again in 30 seconds.",
      parsed: {
        answer: "I'm having trouble accessing my database right now due to high demand. Let's try again in a moment, or ask me something simpler!",
        general_knowledge_note: null,
        sources: [],
        trust: 0,
        freshness: "N/A",
        recommendations: [],
        has_conflict: false,
        citations: []
      }
    };

    res.write(JSON.stringify(errorResponse) + '\n');
    res.end();
  }
}
