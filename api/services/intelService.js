/**
 * api/services/intelService.js
 * Manages RAG (Retrieval-Augmented Generation) and vector search logic.
 * Decoupled from direct Supabase calls through the database service layer.
 */

import { matchIntel, mapIntelToSnippet } from "../utils/database.js";
import { CHAT_STATUS } from "../../shared/constants.js";

export class IntelService {
  /**
   * @param {Object} aiClient - The GoogleGenAI client instance.
   * @param {Object} dbClient - The Supabase client instance.
   */
  constructor(aiClient, dbClient) {
    this.ai = aiClient;
    this.db = dbClient;
    this.maxAttempts = 3;
  }

  /**
   * Retrieves relevant intel from Supabase using vector similarity search.
   * @param {string} message - The user query to embed and search for.
   * @param {function} onStatus - Callback for real-time status updates.
   */
  async getRelevantIntel(message, onStatus = () => {}) {
    if (!this.ai) {
      console.warn("AI client missing - skipping RAG.");
      return [];
    }

    let attempts = 0;

    while (attempts < this.maxAttempts) {
      try {
        // Step 1: Embedding
        onStatus(CHAT_STATUS.EMBEDDING);
        
        const result = await this.ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: [message],
          config: {
            outputDimensionality: 768,
            taskType: "RETRIEVAL_QUERY"
          }
        });

        let embedding = result.embeddings[0].values;
        embedding = this._normalizeL2(embedding);

        // Step 2: Matching
        onStatus(CHAT_STATUS.MATCHING);

        const intel = await matchIntel(this.db, embedding, 0.5, 18);

        return (intel || []).map(mapIntelToSnippet);
      } catch (err) {
        attempts++;
        console.warn(`[IntelService] RAG attempt ${attempts}/${this.maxAttempts} failed:`, err.message);

        if (this._isRetryable(err) && attempts < this.maxAttempts) {
          await this._backoff(attempts);
          continue;
        }

        console.warn("[IntelService] RAG Retrieval error (falling back to base knowledge):", err);
        return [];
      }
    }
  }

  /**
   * L2 normalization helper for 768d embeddings with 1e-12 epsilon.
   */
  _normalizeL2(vector) {
    const norm = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0));
    if (norm < 1e-12) return vector;
    return vector.map(val => val / norm);
  }

  /**
   * Checks if an error is worth retrying.
   */
  _isRetryable(err) {
    const msg = (err.message || "").toLowerCase();
    return msg.includes("503") || msg.includes("429") || msg.includes("disconnected") || msg.includes("overloaded");
  }

  /**
   * Exponential backoff.
   */
  async _backoff(attempts) {
    const delay = Math.pow(2, attempts) * 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
