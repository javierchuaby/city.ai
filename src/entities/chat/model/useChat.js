/**
 * src/entities/chat/model/useChat.js
 * High-level hook for managing AI chat state.
 * Migrated to FSD Entities layer for better domain separation.
 */

import { useState, useCallback } from "react";
import { apiClient } from "@shared/api/apiClient";
import { CHAT_STATUS, RESPONSE_TYPES } from "@shared/lib/constants";

const STATUS_MAP = {
  [CHAT_STATUS.EMBEDDING]: "Analyzing your search query...",
  [CHAT_STATUS.MATCHING]: "Searching local intel sources...",
  [CHAT_STATUS.GENERATING]: "Synthesizing response..."
};

export default function useChat(user, categoryLabel) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null);
  const [input, setInput] = useState("");

  const sendMessage = useCallback(async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    setLoadingStep("Connecting to Singapore intel...");

    const userMsg = { role: "user", content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    try {
      let finalResult = null;

      await apiClient.stream("/api/chat", {
        message: text,
        userProfile: { ...user, categoryLabel },
        chatHistory: messages
      }, {
        onStatus: (status) => {
          setLoadingStep(STATUS_MAP[status] || status);
        },
        onData: (chunk) => {
          if (chunk.type === RESPONSE_TYPES.FINAL) {
            finalResult = chunk;
          }
        }
      });

      if (finalResult?.success) {
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: finalResult.raw, 
          parsed: finalResult.parsed, 
          showFeedback: (prev.length + 2) % 6 === 0, 
          id: Date.now() + 1 
        }]);
      } else {
        throw new Error(finalResult?.error || "AI synthesis failed");
      }
    } catch (error) {
      console.error("[useChat] Error:", error);
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: `Sorry, I hit a snag: ${error.message}. Please try again!`, 
        id: Date.now() + 1 
      }]);
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  }, [input, loading, messages, user, categoryLabel]);

  const resetMessages = () => setMessages([]);

  return { messages, loading, loadingStep, input, setInput, sendMessage, resetMessages };
}
