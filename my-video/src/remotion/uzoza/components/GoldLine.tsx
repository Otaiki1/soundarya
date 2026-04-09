import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../colors";

interface GoldLineProps {
  width?: number;
  delay?: number;
  duration?: number;
  opacity?: number;
}

export const GoldLine: React.FC<GoldLineProps> = ({
  width = 120,
  delay = 0,
  duration = 60,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  useVideoConfig();

  const progress = interpolate(
    frame,
    [delay, delay + duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        width: width * progress,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
        opacity: opacity * (progress > 0 ? 1 : 0),
      }}
    />
  );
};

// Animated face silhouette path tracing
export const FaceSilhouetteLine: React.FC<{ progress: number }> = ({ progress }) => {
  // Simplified oval face silhouette path
  const totalLength = 600;
  const dashOffset = totalLength * (1 - progress);

  return (
    <svg
      width="300"
      height="380"
      viewBox="0 0 300 380"
      style={{ overflow: "visible" }}
    >
      {/* Face outline */}
      <ellipse
        cx="150"
        cy="180"
        rx="110"
        ry="140"
        fill="none"
        stroke={COLORS.gold}
        strokeWidth="1.5"
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
      {/* Chin detail */}
      <path
        d="M 100 280 Q 150 330 200 280"
        fill="none"
        stroke={COLORS.gold}
        strokeWidth="1"
        strokeDasharray="120"
        strokeDashoffset={120 * (1 - Math.max(0, (progress - 0.6) / 0.4))}
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Brow line */}
      <path
        d="M 90 120 Q 150 105 210 120"
        fill="none"
        stroke={COLORS.gold}
        strokeWidth="1"
        strokeDasharray="130"
        strokeDashoffset={130 * (1 - Math.max(0, (progress - 0.4) / 0.6))}
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Nose bridge */}
      <line
        x1="150" y1="120"
        x2="150" y2="220"
        stroke={COLORS.gold}
        strokeWidth="0.8"
        strokeDasharray="100"
        strokeDashoffset={100 * (1 - Math.max(0, (progress - 0.5) / 0.5))}
        opacity="0.4"
      />
      {/* Eye left */}
      <ellipse
        cx="115" cy="155"
        rx="18" ry="10"
        fill="none"
        stroke={COLORS.gold}
        strokeWidth="1"
        strokeDasharray="90"
        strokeDashoffset={90 * (1 - Math.max(0, (progress - 0.7) / 0.3))}
        opacity="0.5"
      />
      {/* Eye right */}
      <ellipse
        cx="185" cy="155"
        rx="18" ry="10"
        fill="none"
        stroke={COLORS.gold}
        strokeWidth="1"
        strokeDasharray="90"
        strokeDashoffset={90 * (1 - Math.max(0, (progress - 0.75) / 0.25))}
        opacity="0.5"
      />
      {/* Lips */}
      <path
        d="M 120 255 Q 150 265 180 255"
        fill="none"
        stroke={COLORS.gold}
        strokeWidth="1"
        strokeDasharray="70"
        strokeDashoffset={70 * (1 - Math.max(0, (progress - 0.8) / 0.2))}
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
};
