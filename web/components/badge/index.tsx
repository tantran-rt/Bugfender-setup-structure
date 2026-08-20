import React from "react";

interface BadgeProps {
  type?: "Pending" | "Negative" | "Positive" | "Inconclusive";
  text?: string;
}

function Badge({ type, text }: BadgeProps) {
  return (
    <div
      className={`badge ${
        type === "Positive"
          ? "badge-positive"
          : type === "Negative"
          ? "badge-negative"
          : type == "Pending"
          ? "badge-pending"
          : "badge-inconclusive"
      }`}
    >
      {text}
    </div>
  );
}

export default Badge;
