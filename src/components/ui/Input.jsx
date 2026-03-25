import React from "react";

/**
 * Input Component
 * Standardized input/textarea for city.ai.
 * 
 * @param {Object} props
 * @param {boolean} [props.multiline=false] - If true, render a textarea.
 * @param {string} props.label - Label text for the field wrapper.
 */
export function Input({ id, label, value, onChange, placeholder, type = "text", multiline = false, rows = 1, onKeyDown, className = "" }) {
  const Component = multiline ? "textarea" : "input";
  const fieldClass = label ? "field" : "";

  const renderInput = () => (
    <Component
      id={id}
      type={!multiline ? type : undefined}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      rows={multiline ? rows : undefined}
      className={className}
    />
  );

  if (label) {
    return (
      <div className={fieldClass}>
        <label>{label}</label>
        {renderInput()}
      </div>
    );
  }

  return renderInput();
}

export default Input;
