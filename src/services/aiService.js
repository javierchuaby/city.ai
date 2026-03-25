/**
 * aiService.js
 * Dedicated service layer for handling AI interactions and logic.
 * Migrated to Backend Serverless Function for security.
 */

/**
 * Fetches Singapore-specific intelligence from the internal backend service.
 * 
 * @param {string} userMessage - The current message from the user.
 * @param {Object} userProfile - User metadata (Style, Interests, Budget, Context, Category).
 * @param {Array} chatHistory - Previous messages in the conversation.
 * @returns {Promise<Object>} - Parsed JSON response from the internal API.
 */
export async function getCityIntel(userMessage, userProfile, chatHistory) {
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("aiService Error:", error);
    return {
      success: false,
      error: error.message || "Unable to connect to city.ai intelligence layer.",
      parsed: {
        answer: "Sorry, I'm having trouble connecting to my local sources. Please check your Singapore connection.",
        sources: [],
        trust: 0,
        freshness: "N/A",
        recommendations: [],
        has_conflict: false
      }
    };
  }
}
