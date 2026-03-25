import React, { useRef, useEffect } from "react";
import AICard from "../components/ui/AICard";
import { useAppContext } from "../hooks/useAppContext";
import WelcomeState from "./chat/WelcomeState";
import ChatInput from "./chat/ChatInput";

/**
 * ChatContainer Component
 * Orchestrates the main chat flow, message list, and input area.
 * 
 * @param {Object} props
 * @param {Array} props.messages - List of chat messages.
 * @param {boolean} props.loading - Processing state.
 * @param {string} props.input - Current text input.
 * @param {Function} props.setInput - Input update handler.
 * @param {Function} props.sendMessage - Send handler.
 * @param {string} props.categoryLabel - Active category name.
 * @param {Object} props.feedbackDismissed - State of dismissed ratings.
 * @param {Function} props.onDismissFeedback - Handler to dismiss ratings.
 */
export default function ChatContainer({ 
  messages, 
  loading, 
  input, 
  setInput, 
  sendMessage, 
  categoryLabel,
  feedbackDismissed,
  onDismissFeedback
}) {
  const { addPoints } = useAppContext();
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  return (
    <div className="chat-main">
      <div className="chat-topbar">
        <div className="chat-topbar-left">
          <span className="topbar-city">🇸🇬 Singapore</span>
          <span className="topbar-mode">{categoryLabel}</span>
        </div>
        <div className="topbar-sources">
          <div className="src-dot" style={{ background: "var(--acc)" }}></div>Reddit 
          <div className="src-dot" style={{ background: "var(--cyan)" }}></div>X
        </div>
      </div>

      <div className="messages">
        {messages.length === 0 && !loading && (
          <WelcomeState onSendMessage={sendMessage} />
        )}

        {messages.map(m => m.role === "user" ? (
          <div key={m.id} className="msg msg-user">
            <div className="msg-user-bubble">{m.content}</div>
          </div>
        ) : (
          <AICard 
            key={m.id} 
            data={m.parsed || { answer: m.content }} 
            onAnswer={(opt) => sendMessage(opt)} 
            onRate={() => addPoints(m.id)} 
            onDismiss={() => onDismissFeedback(m.id)} 
            showFeedback={m.showFeedback && !feedbackDismissed[m.id]} 
          />
        ))}

        {loading && (
          <div className="msg loading-msg">
            <div className="msg-ai-header">
              <div className="ai-av">c.</div>
              <span className="ai-av-label">Thinking…</span>
            </div>
            <div className="loading-inner">
              <div className="loading-step active">Scanning sources...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput 
        input={input} 
        setInput={setInput} 
        sendMessage={sendMessage} 
        loading={loading} 
      />
    </div>
  );
}
