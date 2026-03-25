import React from "react";
import { useAppContext } from "../../context/AppContext";

/**
 * WelcomeState Component
 * Displays the initial greeting and suggested questions.
 * 
 * @param {Object} props
 * @param {Function} props.onSendMessage - Handler to trigger a message from a suggestion.
 */
export default function WelcomeState({ onSendMessage }) {
  const { user } = useAppContext();
  const firstName = user.name?.split(" ")[0] || "traveler";

  const suggestions = [
    { icon: "🍜", title: "Best hawker centres" },
    { icon: "🍸", title: "Nightlife this week" }
  ];

  return (
    <div className="welcome-state">
      <div className="welcome-greeting">Hello, <em>{firstName}</em> 👋</div>
      <p className="welcome-hint">Ask about Singapore — food, nightlife, traps, or deals.</p>
      <div className="suggestions-grid">
        {suggestions.map(s => (
          <div key={s.title} className="sug-card" onClick={() => onSendMessage(s.title)}>
            <div className="sug-icon">{s.icon}</div>
            <div className="sug-text"><strong>{s.title}</strong></div>
          </div>
        ))}
      </div>
    </div>
  );
}
