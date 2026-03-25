import React from "react";

/**
 * PointsWidget Component
 * Visualizing user gamification progress.
 * 
 * @param {Object} props
 * @param {number} props.points - Current points.
 */
export default function PointsWidget({ points }) {
  const goal = 500;
  const progressPercent = Math.min((points / goal) * 100, 100);

  return (
    <div className="points-widget">
      <div className="pw-label">Your Points</div>
      <div className="pw-inner">
        <div className="pw-points">{points} <span>pts</span></div>
        <div className="pw-bar-wrap">
          <div className="pw-bar">
            <div className="pw-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        <div className="pw-sub"><em>{goal} pts</em> to unlock</div>
      </div>
    </div>
  );
}
