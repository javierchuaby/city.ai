import React from "react";
import Input from "../../components/ui/Input";

/**
 * ChatInput Component
 * Handles user message entry and submission.
 */
export default function ChatInput({ input, setInput, sendMessage, loading }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-input-area">
      <div className="input-wrap">
        <Input 
          id="chat-input"
          multiline={true}
          placeholder="Ask anything about Singapore..." 
          rows="1" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={handleKeyDown}
        />
        <button className="send-btn" disabled={!input.trim() || loading} onClick={() => sendMessage()}>→</button>
      </div>
      <div className="input-hint">Community-sourced · Location-verified · Contradiction-aware</div>
    </div>
  );
}
