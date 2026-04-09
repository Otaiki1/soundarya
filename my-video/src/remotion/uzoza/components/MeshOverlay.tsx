import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../colors";

interface LandmarkPoint {
  x: number;
  y: number;
  delay: number;
}

// Facial landmark points (normalized 0-1)
const LANDMARKS: LandmarkPoint[] = [
  // Jawline
  { x: 0.22, y: 0.72, delay: 0 },
  { x: 0.28, y: 0.82, delay: 2 },
  { x: 0.38, y: 0.90, delay: 4 },
  { x: 0.50, y: 0.93, delay: 6 },
  { x: 0.62, y: 0.90, delay: 4 },
  { x: 0.72, y: 0.82, delay: 2 },
  { x: 0.78, y: 0.72, delay: 0 },
  // Nose
  { x: 0.50, y: 0.55, delay: 8 },
  { x: 0.44, y: 0.62, delay: 10 },
  { x: 0.56, y: 0.62, delay: 10 },
  // Eyes
  { x: 0.32, y: 0.42, delay: 12 },
  { x: 0.40, y: 0.40, delay: 14 },
  { x: 0.60, y: 0.40, delay: 14 },
  { x: 0.68, y: 0.42, delay: 12 },
  // Brows
  { x: 0.30, y: 0.35, delay: 16 },
  { x: 0.40, y: 0.32, delay: 18 },
  { x: 0.60, y: 0.32, delay: 18 },
  { x: 0.70, y: 0.35, delay: 16 },
  // Lips
  { x: 0.42, y: 0.72, delay: 20 },
  { x: 0.50, y: 0.74, delay: 22 },
  { x: 0.58, y: 0.72, delay: 20 },
  // Cheekbones
  { x: 0.22, y: 0.55, delay: 8 },
  { x: 0.78, y: 0.55, delay: 8 },
  // Forehead
  { x: 0.35, y: 0.20, delay: 24 },
  { x: 0.50, y: 0.17, delay: 26 },
  { x: 0.65, y: 0.20, delay: 24 },
];

interface MeshOverlayProps {
  width: number;
  height: number;
  progress: number; // 0-1
}

export const MeshOverlay: React.FC<MeshOverlayProps> = ({
  width,
  height,
  progress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      {/* Mesh connection lines */}
      {LANDMARKS.slice(0, 7).map((pt, i) => {
        if (i === 0) return null;
        const prev = LANDMARKS[i - 1];
        const lineProgress = interpolate(
          progress,
          [0.1, 0.5],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return (
          <line
            key={`jaw-${i}`}
            x1={prev.x * width}
            y1={prev.y * height}
            x2={pt.x * width}
            y2={pt.y * height}
            stroke={COLORS.gold}
            strokeWidth="0.5"
            opacity={lineProgress * 0.35}
          />
        );
      })}

      {/* Symmetry center line */}
      <line
        x1={width * 0.5}
        y1={height * 0.15}
        x2={width * 0.5}
        y2={height * 0.93}
        stroke={COLORS.gold}
        strokeWidth="0.8"
        strokeDasharray="6 4"
        opacity={interpolate(progress, [0.2, 0.6], [0, 0.5], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      />

      {/* Horizontal thirds lines */}
      {[0.35, 0.58, 0.75].map((y, i) => (
        <line
          key={`thirds-${i}`}
          x1={width * 0.2}
          y1={height * y}
          x2={width * 0.8}
          y2={height * y}
          stroke={COLORS.gold}
          strokeWidth="0.5"
          strokeDasharray="4 8"
          opacity={interpolate(progress, [0.3 + i * 0.1, 0.7 + i * 0.1], [0, 0.3], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      ))}

      {/* Landmark dots */}
      {LANDMARKS.map((pt, i) => {
        const dotProgress = spring({
          frame,
          fps,
          delay: pt.delay + Math.round(progress * 20),
          config: { damping: 200 },
          durationInFrames: 15,
        });

        return (
          <g key={i}>
            <circle
              cx={pt.x * width}
              cy={pt.y * height}
              r={2.5 * dotProgress}
              fill={COLORS.gold}
              opacity={dotProgress * 0.9}
            />
            <circle
              cx={pt.x * width}
              cy={pt.y * height}
              r={5 * dotProgress}
              fill="none"
              stroke={COLORS.gold}
              strokeWidth="0.5"
              opacity={dotProgress * 0.4}
            />
          </g>
        );
      })}

      {/* Golden ratio circle hint */}
      <circle
        cx={width * 0.5}
        cy={height * 0.5}
        r={height * 0.38}
        fill="none"
        stroke={COLORS.gold}
        strokeWidth="0.6"
        strokeDasharray="8 12"
        opacity={interpolate(progress, [0.6, 1.0], [0, 0.2], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      />
    </svg>
  );
};
