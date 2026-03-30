import React from "react";

/**
 * Button Component
 * Polymorphic button that maps variants to predefined CSS classes.
 * 
 * @param {Object} props
 * @param {string} [props.variant="primary"] - primary, ghost, next, back, action
 */
export default function Button({ children, onClick, variant = "primary", disabled, className = "" }) {
  const classes = {
    primary: "btn-primary",
    ghost: "btn-ghost",
    next: "btn-next",
    back: "btn-back-step",
    action: "btn-primary" // Default action
  };
  const cls = classes[variant] || classes.primary;
  return (
    <button className={`${cls} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
