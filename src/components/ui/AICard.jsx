import React, { useState } from "react";

/**
 * Helpers for formatting AI responses.
 */
/**
 * Helpers for formatting AI responses.
 */

function formatInline(text) {
  if (!text) return null;
  // Handle bold (**text**) and code snippets (`code`)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.*)\*\*$/);
    if (boldMatch) return <strong key={i}>{boldMatch[1]}</strong>;

    const codeMatch = part.match(/^`(.*)`$/);
    if (codeMatch) return <code key={i} className="inline-code">{codeMatch[1]}</code>;

    return part;
  });
}

function formatComplexBlock(block) {
  const lines = block.split('\n');
  const result = [];
  let currentList = null;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // Match bullet points like "- item" or "* item"
    const listMatch = line.match(/^[\s]*[-*] (.*)/);
    
    if (listMatch) {
      if (!currentList) {
        currentList = { type: 'ul', items: [] };
        result.push(currentList);
      }
      currentList.items.push(listMatch[1]);
    } else if (trimmed === "") {
      currentList = null;
    } else {
      currentList = null;
      result.push({ type: 'text', content: line });
    }
  });

  return result.map((item, i) => {
    if (item.type === 'ul') {
      return (
        <ul key={i} className="ai-list">
          {item.items.map((li, j) => <li key={j}>{formatInline(li)}</li>)}
        </ul>
      );
    }
    return <p key={i} className="ai-para">{formatInline(item.content)}</p>;
  });
}

function formatAnswer(text) {
  if (!text) return null;
  
  // Split by specific tag blocks while preserving them
  const blocks = text.split(/(\\n\\n|\n\n|\[TIP:[^\]]+\]|\[WARN:[^\]]+\]|\[ALERT:[^\]]+\])/g);

  return blocks.map((block, i) => {
    if (!block || block === "") return null;
    
    if (block === "\\n\\n" || block === "\n\n") {
      return <div key={i} className="p-spacer" />;
    }

    const tip = block.match(/^\[TIP: (.*)\]$/);
    if (tip) return <div key={i} className="inline-tip">💡 {formatInline(tip[1])}</div>;

    const warn = block.match(/^\[WARN: (.*)\]$/);
    if (warn) return <div key={i} className="inline-warn">⚠️ {formatInline(warn[1])}</div>;

    const alert = block.match(/^\[ALERT: (.*)\]$/);
    if (alert) return <div key={i} className="inline-alert">🚨 {formatInline(alert[1])}</div>;

    // For any other blocks, handle lists and standard lines
    return (
      <div key={i} className="answer-segment">
        {formatComplexBlock(block)}
      </div>
    );
  });
}

/**
 * AICard Component
 * Displays city intelligence with Trust Score, Freshness, and Sources.
 * 
 * @param {Object} props
 * @param {Object} props.data - AI response object.
 * @param {Function} props.onAnswer - Handler for quick question options.
 * @param {Function} props.onRate - Handler for giving feedback (rating).
 * @param {Function} props.onDismiss - Handler for dismissing feedback.
 * @param {boolean} props.showFeedback - Whether to show the feedback/rating widget.
 */
export default function AICard({ data, onAnswer, onRate, onDismiss, showFeedback }) {
  const [rated, setRated] = useState(0);
  const [hovered, setHovered] = useState(0);

  return (
    <div className="msg msg-ai">
      <div className="msg-ai-header">
        <div className="ai-av">c.</div>
        <span className="ai-av-label">city.ai · Singapore Intel</span>
      </div>
      <div className="ai-card">
        {data.has_conflict && data.conflict_note && (
          <div className="conflict-banner">
            ⚠️ <span><strong>Conflicting intel:</strong> {data.conflict_note}</span>
          </div>
        )}
        <div className="ai-card-body">{formatAnswer(data.answer)}</div>
        {data.recommendations?.length > 0 && (
          <div className="reco-grid">
            {data.recommendations.map((r, i) => (
              <div key={i} className={`reco-card ${r.type || "food"}`}>
                <div className="reco-name">{r.name}</div>
                <div className="reco-loc">📍 {r.location}</div>
                <div className="reco-snip">{r.snippet}</div>
                <div className="reco-footer">
                  <span className="reco-trust">✓ {r.trust}% validated</span>
                  <span className="reco-fresh">{r.age}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {data.sources?.length > 0 && (
          <div className="src-strip">
            <span className="src-strip-label">Sources</span>
            {data.sources.map((s, i) => (
              <div key={i} className="src-tag">
                <div className="src-tag-dot" style={{ background: s.color }}></div>
                {s.label} · {s.age}
              </div>
            ))}
          </div>
        )}
        <div className="trust-strip">
          <div className="tm-item">
            <span className="tm-label">Trust</span>
            <div className="tm-bar">
              <div className="tm-fill" style={{ width: `${data.trust || 80}%` }}></div>
            </div>
            <span className="tm-val" style={{ color: (data.trust > 80 ? "var(--green)" : data.trust > 60 ? "var(--gold)" : "var(--red)") }}>
              {data.trust || 80}%
            </span>
          </div>
          <div className="tm-item">
            <span className="tm-label">Freshness</span>
            <span className="tm-val" style={{ color: "var(--tm)" }}>{data.freshness || "recent"}</span>
          </div>
          <div className="tm-item">
            <span className="tm-label">Sources</span>
            <span className="tm-val" style={{ color: "var(--tm)" }}>{data.sources?.length || 0} checked</span>
          </div>
        </div>
      </div>

      {data.ask_question && (
        <div className="ai-question-card">
          <div className="aq-label">⚡ Quick question</div>
          <div className="aq-text">{data.ask_question.text}</div>
          <div className="aq-options">
            {data.ask_question.options.map((opt, i) => (
              <div key={i} className="aq-opt" onClick={() => onAnswer(opt)}>{opt}</div>
            ))}
          </div>
        </div>
      )}

      {showFeedback && !rated && (
        <div className="feedback-card">
          <div className="fb-label">📊 Feedback</div>
          <div className="fb-q">Was this intel accurate and useful?</div>
          <div className="fb-rating">
            {[1, 2, 3, 4, 5].map(i => (
              <button 
                key={i} 
                className={`star-btn ${i <= (hovered || rated) ? "lit" : ""}`} 
                onMouseEnter={() => setHovered(i)} 
                onMouseLeave={() => setHovered(0)} 
                onClick={() => { setRated(i); onRate(i); }}
              >
                ⭐
              </button>
            ))}
          </div>
          <button className="fb-dismiss" onClick={onDismiss}>Skip feedback</button>
        </div>
      )}

      {rated > 0 && (
        <div className="feedback-card">
          <div className="fb-label" style={{ color: "var(--green)" }}>✓ Thanks for the feedback</div>
        </div>
      )}
    </div>
  );
}
