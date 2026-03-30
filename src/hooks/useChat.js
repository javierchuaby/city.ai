import { useState, useCallback } from "react";
import { getCityIntel } from "../services/aiService";

/**
 * Custom Hook: useChat
 * Manages the core conversation state and intelligence interaction.
 * 
 * @param {Object} user - User metadata for context.
 * @param {string} categoryLabel - Human-readable category label.
 * @returns {Object} { messages, loading, input, setInput, sendMessage, resetMessages }
 */
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
    setLoadingStep("Analyzing your search query...");

    const userMsg = { role: "user", content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    const statusMap = {
      embedding: "Analyzing your search query...",
      matching: "Searching local intel sources...",
      generating: "Synthesizing response..."
    };

    try {
      const result = await getCityIntel(
        text, 
        { ...user, categoryLabel }, 
        messages, 
        (status) => setLoadingStep(statusMap[status] || status)
      );
      
      if (result.success) {
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: result.raw, 
          parsed: result.parsed, 
          showFeedback: (prev.length + 2) % 6 === 0, 
          id: Date.now() + 1 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: result.error, 
          id: Date.now() + 1 
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: "Sorry, I had trouble connecting. Please check your Singapore connection (and API key).", 
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
