import React from "react";
import Button from "../components/ui/Button";
import PointsWidget from "../components/ui/PointsWidget";

/**
 * Sidebar Component
 * Left-side navigation with profile, categories, and points.
 * 
 * @param {Object} props
 * @param {Object} props.user - Current user object.
 * @param {string} props.category - Current active category ID.
 * @param {Function} props.setCategory - Category update handler.
 * @param {number} props.points - Current points.
 * @param {Function} props.onNewChat - Reset conversation handler.
 * @param {Function} props.onDevToggle - Dev mode toggle handler.
 */
export default function Sidebar({ user, category, setCategory, points, onNewChat, onDevToggle, onReset }) {
  const CATS = [
    { id: "all", icon: "⚡", label: "All Intel", count: "" }, 
    { id: "food", icon: "🍜", label: "Food & Hawkers", count: "1.2k" },
    { id: "night", icon: "🍸", label: "Nightlife", count: "847" }, 
    { id: "tips", icon: "💡", label: "Local Tips", count: "2.1k" },
    { id: "deals", icon: "🔥", label: "Live Deals", count: "34" }, 
    { id: "sports", icon: "🏀", label: "Sports & Fitness", count: "312" },
  ];

  return (
    <div className="sidebar">
      <div className="sb-header">
        <div className="sb-logo">
          <span className="sb-logo-city">city<span className="sb-logo-dot">.</span></span>
          <span className="sb-logo-ai">ai</span>
        </div>
        <div className="sb-city-badge">
          <div className="sb-dot"></div>
          <span>Singapore</span>
        </div>
      </div>
      
      <div className="sb-user">
        <div className="sb-avatar">{(user.name || "?")[0].toUpperCase()}</div>
        <div className="sb-user-info">
          <div className="sb-user-name">{user.name || "Traveler"}</div>
          <div className="sb-user-type">{user.travelStyle || "Explorer"}</div>
        </div>
      </div>
      
      <div className="sb-section">
        <div className="sb-section-label">Categories</div>
        <div className="sb-cats">
          {CATS.map(c => (
            <button key={c.id} className={`sb-cat ${category === c.id ? "active" : ""}`} onClick={() => setCategory(c.id)}>
              <div className="sb-cat-icon">{c.icon}</div> 
              {c.label}
              <span className="sb-cat-count">{c.count || "—"}</span>
            </button>
          ))}
        </div>
      </div>
      
      <PointsWidget points={points} />
      
      <div className="sb-footer">
        <Button variant="primary" className="sb-new-chat" onClick={onNewChat} style={{ marginBottom: "12px", width: "100%" }}>
          + New Conversation
        </Button>
        <div 
          onClick={() => onDevToggle?.()}
          style={{ 
            fontFamily: "var(--fm)", 
            fontSize: "9px", 
            color: "var(--td)", 
            textAlign: "center", 
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            opacity: 0.5,
            marginBottom: "8px"
          }}>
          Open Sandbox 🛠️
        </div>
        <div 
          onClick={onReset}
          style={{ 
            fontFamily: "var(--fm)", 
            fontSize: "9px", 
            color: "var(--red)", 
            textAlign: "center", 
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            opacity: 0.6
          }}>
          End Session & Logout
        </div>
      </div>
    </div>
  );
}
