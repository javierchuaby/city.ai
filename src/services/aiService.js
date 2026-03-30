import { CHAT_STATUS, RESPONSE_TYPES } from "../../shared/constants.js";

/**
 * Fetches Singapore-specific intelligence from the internal backend service.
 * 
 * @param {string} userMessage - The current message from the user.
 * @param {Object} userProfile - User metadata (Style, Interests, Budget, Context, Category).
 * @param {Array} chatHistory - Previous messages in the conversation.
 * @returns {Promise<Object>} - Parsed JSON response from the internal API.
 */
export async function getCityIntel(userMessage, userProfile, chatHistory, onStatusChange = () => {}) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: userMessage,
        userProfile: userProfile,
        chatHistory: chatHistory
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = null;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line);
          if (chunk.type === RESPONSE_TYPES.STATUS) {
            onStatusChange(chunk.status);
          } else if (chunk.type === RESPONSE_TYPES.FINAL) {
            result = chunk;
          }
        } catch (e) {
          console.warn("Failed to parse stream chunk:", line, e);
        }
      }
    }

    if (!result) throw new Error("Stream ended without final result");
    return result;

  } catch (error) {
    console.error("aiService Error:", error);
    return {
      success: false,
      error: error.message || "Unable to connect to city.ai intelligence layer.",
      parsed: {
        answer: "Sorry, I'm having trouble connecting to my local sources. Please check your Singapore connection.",
        general_knowledge_note: null,
        sources: [],
        trust: 0,
        freshness: "N/A",
        recommendations: [],
        has_conflict: false
      }
    };
  }
}
