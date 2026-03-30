/**
 * api/services/chatService.js
 * Orchestrates the full chat workflow: Intel retrieval (RAG) and Gemini AI generation.
 */

import { CHAT_STATUS } from "../../shared/constants.js";

export class ChatService {
  /**
   * @param {Object} intelService - Pre-initialized IntelService instance.
   * @param {Object} geminiService - Pre-initialized GeminiService instance.
   */
  constructor(intelService, geminiService) {
    this.intelService = intelService;
    this.geminiService = geminiService;
  }

  /**
   * Main orchestration method.
   * @param {object} params - { message, chatHistory, userProfile }
   * @param {function} onStatus - Callback for real-time status updates (embedding, matching, generating).
   * @returns {Promise<object>} - The final AI response result.
   */
  async processChat({ message, chatHistory, userProfile }, onStatus = () => {}) {
    // Step 1 & 2: RAG (Retrieval-Augmented Generation)
    const intelSnippets = await this.intelService.getRelevantIntel(message, onStatus);

    // Step 3: AI Generation
    onStatus(CHAT_STATUS.GENERATING);

    const result = await this.geminiService.generateChatResponse({
      message,
      chatHistory,
      userProfile,
      intelSnippets
    });

    return result;
  }
}
