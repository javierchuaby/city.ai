/**
 * api/services/intelService.js
 * Manages RAG (Retrieval-Augmented Generation) and vector search logic.
 * Orchestrates embedding generation and repository similarity search.
 */


import { CHAT_STATUS } from "../../../src/shared/lib/constants.js";
import { config } from "../config/index.js";

export class IntelService {
  /**
   * @param {Object} intelRepository - Injected repository for data access.
   * @param {Object} aiClient - Injected generative AI client.
   */
  constructor(intelRepository, aiClient) {
    this.repo = intelRepository;
    this.ai = aiClient;
    this.maxAttempts = config.app.maxRetries || 3;
  }

  /**
   * Retrieves relevant intel chunks using embedding and repository match.
   * @param {string} message - User query.
   * @param {function} onStatus - Callback for status updates.
   */
  async getRelevantIntel(message, onStatus = () => { }) {
    let attempts = 0;

    while (attempts < this.maxAttempts) {
      try {
        // Step 1: Embedding
        onStatus(CHAT_STATUS.EMBEDDING);

        const model = this.ai.getGenerativeModel({ model: config.gemini.models.embedding });
        const result = await model.embedContent({
          content: { parts: [{ text: message }] },
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: 768
        });

        let embedding = result.embedding.values;
        embedding = this._normalizeL2(embedding);

        // Step 2: Matching
        onStatus(CHAT_STATUS.MATCHING);

        const snippets = await this.repo.findSimilarIntel(embedding, 0.5, 18);

        return snippets;
      } catch (err) {
        attempts++;
        console.warn(`[IntelService] RAG attempt ${attempts}/${this.maxAttempts} failed:`, err.message);

        if (this._isRetryable(err) && attempts < this.maxAttempts) {
          await this._backoff(attempts);
          continue;
        }

        console.error("[IntelService] RAG Retrieval error (base knowledge fallback):", err);
        return [];
      }
    }
  }

  /**
   * L2 normalization helper for 784d embeddings with 1e-12 epsilon.
   */
  _normalizeL2(vector) {
    const norm = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0));
    if (norm < 1e-12) return vector;
    return vector.map(val => val / norm);
  }

  _isRetryable(err) {
    const msg = (err.message || "").toLowerCase();
    return msg.includes("503") || msg.includes("429") || msg.includes("disconnected") || msg.includes("overloaded");
  }

  async _backoff(attempts) {
    const delay = Math.pow(2, attempts) * 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
