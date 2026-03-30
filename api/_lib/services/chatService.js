/**
 * api/services/chatService.js
 * High-level orchestration for the full AI chat life-cycle.
 * Decouples the HTTP layer (handlers) from the business domain logic.
 */

import { CHAT_STATUS } from "../../../src/shared/lib/constants.js";
import { IntelService } from "./intelService.js";
import { GeminiService } from "./geminiService.js";

export class ChatService {
  /**
   * @param {Object} intelService - Injected RAG/Intel service.
   * @param {Object} geminiService - Injected AI/Gemini service.
   */
  constructor(intelService, geminiService) {
    this.intelService = intelService;
    this.geminiService = geminiService;
  }

  /**
   * Orchestrates the chat flow: Retrieval -> Generation.
   * @param {Object} params - { message, chatHistory, userProfile }
   * @param {function} onStatus - Status callback for progress reporting.
   */
  async processChat({ message, chatHistory, userProfile }, onStatus = () => {}) {
    // Stage 1 & 2: Retrieval-Augmented Generation (RAG)
    const intelSnippets = await this.intelService.getRelevantIntel(message, onStatus);

    // Stage 3: AI Generation & Formatting
    onStatus(CHAT_STATUS.GENERATING);

    return await this.geminiService.generateChatResponse({
      message,
      chatHistory,
      userProfile,
      intelSnippets
    });
  }
}
