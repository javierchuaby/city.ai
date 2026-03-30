/**
 * src/shared/api/apiClient.js
 * Centralized API client for city.ai.
 * Handles standard requests and AI streaming responses.
 */

import { RESPONSE_TYPES } from "@shared/lib/constants.js";

class ApiClient {
  /**
   * Performs a standard POST request.
   */
  async post(url, body) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Performs a streaming POST request for AI responses.
   * @param {string} url - API endpoint.
   * @param {Object} body - Request payload.
   * @param {Object} callbacks - { onStatus, onData }
   */
  async stream(url, body, { onStatus = () => {}, onData = () => {} } = {}) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            if (chunk.type === RESPONSE_TYPES.STATUS) {
              onStatus(chunk.status);
            } else {
              onData(chunk);
            }
          } catch (e) {
            console.error("[ApiClient] Stream parse error:", e, line);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const apiClient = new ApiClient();
