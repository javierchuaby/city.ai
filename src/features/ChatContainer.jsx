import React, { useRef, useEffect } from "react";
import AICard from "../components/ui/AICard";
import Input from "../components/ui/Input";

/**
 * ChatContainer Component
 * Orchestrates the main chat flow, message list, and input area.
 * 
 * @param {Object} props
 * @param {Object} props.user - User metadata.
 * @param {Array} props.messages - List of chat messages.
 * @param {boolean} props.loading - Processing state.
 * @param {string} props.input - Current text input.
 * @param {Function} props.setInput - Input update handler.
 * @param {Function} props.sendMessage - Send handler.
 * @param {string} props.categoryLabel - Active category name.
 * @param {Function} props.onRate - Feedback handler.
 * @param {Object} props.feedbackDismissed - State of dismissed ratings.
 * @param {Function} props.onDismissFeedback - Handler to dismiss ratings.
 */
export default function ChatContainer({ 
  user, 
  messages, 
  loading, 
  input, 
  setInput, 
  sendMessage, 
  categoryLabel,
  onRate,
  feedbackDismissed,
  onDismissFeedback
}) {
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  const firstName = user.name?.split(" ")[0] || "traveler";

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
          <div className="welcome-state">
            <div className="welcome-greeting">Hello, <em>{firstName}</em> 👋</div>
            <p className="welcome-hint">Ask about Singapore — food, nightlife, traps, or deals.</p>
            <div className="suggestions-grid">
              {[{ icon: "🍜", title: "Best hawker centres" }, { icon: "🍸", title: "Nightlife this week" }].map(s => (
                <div key={s.title} className="sug-card" onClick={() => sendMessage(s.title)}>
                  <div className="sug-icon">{s.icon}</div>
                  <div className="sug-text"><strong>{s.title}</strong></div>
                </div>
              ))}
            </div>
          </div>
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
            onRate={() => onRate(m.id)} 
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

      <div className="chat-input-area">
        <div className="input-wrap">
          <Input 
            id="chat-input"
            multiline={true}
            placeholder="Ask anything about Singapore..." 
            rows="1" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          />
          <button className="send-btn" disabled={!input.trim() || loading} onClick={() => sendMessage()}>→</button>
        </div>
        <div className="input-hint">Community-sourced · Location-verified · Contradiction-aware</div>
      </div>
    </div>
  );
}
