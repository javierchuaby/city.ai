/**
 * api/chat.js
 * Vercel Serverless Function entry point for the AI orchestration backend.
 * Acts as the 'Composition Root' for the chat service ecosystem.
 * Maintains compatibility with the Node.js/Vercel runtime while sharing logic with Cloudflare.
 */

import { ChatService } from "./_lib/services/chatService.js";
import { IntelService } from "./_lib/services/intelService.js";
import { GeminiService } from "./_lib/services/geminiService.js";
import { IntelRepository } from "./_lib/repositories/intelRepository.js";
import { getConfig } from "./_lib/config/index.js";
import { getGeminiClient } from "./_lib/clients/gemini.js";
import { getSupabaseClient } from "./_lib/clients/supabase.js";
import { chatRequestSchema } from "./_lib/utils/schema.js";
import { RESPONSE_TYPES } from "./_lib/shared/constants.js";

/**
 * Main HTTP Handler.
 * Validates requests, sets up streaming headers, and delegates orchestration.
 */
export default async function handler(req, res) {
  // 1. Composition Root (Initialized with Vercel's process.env)
  const config = getConfig(process.env);
  const supabase = getSupabaseClient(config);
  const ai = getGeminiClient(config);

  const intelRepo = new IntelRepository(supabase);
  const intelService = new IntelService(intelRepo, ai, config);
  const geminiService = new GeminiService(ai, config);
  const chatService = new ChatService(intelService, geminiService);

  // 2. Validate HTTP methods
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 3. Schema Validation
    const validation = chatRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.format()
      });
    }

    const { message, userProfile, chatHistory } = validation.data;

    // 4. Prepare standard JSON streaming headers for real-time status updates.
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendChunk = (data) => {
      res.write(JSON.stringify(data) + '\n');
    };

    const sendStatus = (status) => {
      sendChunk({ type: RESPONSE_TYPES.STATUS, status });
    };

    try {
      // Stage full AI orchestration through the chat service.
      const result = await chatService.processChat(
        { message, userProfile, chatHistory },
        (status) => sendStatus(status)
      );

      // Final output delivery.
      sendChunk({
        type: RESPONSE_TYPES.FINAL,
        raw: result.raw,
        parsed: result.parsed,
        success: true,
        meta: { model: result.model }
      });

      res.end();
    } catch (error) {
      console.error("[Vercel Critical Error]", error.message);

      const fallbackResponse = {
        type: RESPONSE_TYPES.FINAL,
        success: false,
        error: "Vercel execution limit reached. Please retry momentarily.",
        parsed: {
          answer: "I'm having trouble accessing my database right now. Let's try again in a moment, or ask me something simpler!",
          general_knowledge_note: null,
          sources: [],
          trust: 0,
          freshness: "N/A",
          recommendations: [],
          has_conflict: false,
          citations: []
        }
      };

      sendChunk(fallbackResponse);
      res.end();
    }

  } catch (error) {
    console.error("[Request Parsing Error]", error);
    return res.status(500).json({ error: "Server Parse Exception" });
  }
}
