import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../colors";
import { josefinFamily } from "../fonts";

const DIMENSIONS = [
  { label: "Symmetry", score: 8.4, delay: 0 },
  { label: "Harmony", score: 7.9, delay: 5 },
  { label: "Proportionality", score: 8.7, delay: 10 },
  { label: "Bone Structure", score: 9.1, delay: 15 },
  { label: "Skin", score: 7.6, delay: 20 },
  { label: "Dimorphism", score: 8.2, delay: 25 },
  { label: "Neoteny", score: 7.3, delay: 30 },
];

export const DimensionBars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 900 }}>
      {DIMENSIONS.map((dim) => {
        const barSpring = spring({
          frame,
          fps,
          delay: dim.delay,
          config: { damping: 200 },
          durationInFrames: 30,
        });

        const labelOpacity = interpolate(frame, [dim.delay, dim.delay + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div key={dim.label} style={{ opacity: labelOpacity }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 5,
                fontFamily: josefinFamily,
                fontSize: 11,
                letterSpacing: "0.14em",
                color: COLORS.textSecondary,
                textTransform: "uppercase",
              }}
            >
              <span>{dim.label}</span>
              <span style={{ color: COLORS.gold, opacity: barSpring > 0.5 ? 1 : 0 }}>
                {dim.score.toFixed(1)}
              </span>
            </div>
            <div style={{ height: 2, background: "#1C1510", borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(dim.score / 10) * barSpring * 100}%`,
                  background: `linear-gradient(90deg, ${COLORS.goldDim}, ${COLORS.gold})`,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const OverallScore: React.FC<{ delay?: number }> = ({ delay = 20 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scoreSpring = spring({ frame, fps, delay, config: { damping: 200 }, durationInFrames: 45 });
  const score = interpolate(scoreSpring, [0, 1], [0, 8.3]);

  const percentileOpacity = interpolate(frame, [delay + 35, delay + 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: josefinFamily,
          fontSize: 10,
          letterSpacing: "0.28em",
          color: COLORS.textMuted,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Overall Score
      </div>
      <div
        style={{
          fontSize: 84,
          fontWeight: "700",
          color: COLORS.gold,
          fontFamily: "Georgia, serif",
          lineHeight: 1,
          textShadow: `0 0 36px ${COLORS.gold}3A`,
        }}
      >
        {score.toFixed(1)}
      </div>
      <div
        style={{
          fontFamily: josefinFamily,
          fontSize: 11,
          letterSpacing: "0.2em",
          color: COLORS.textSecondary,
          marginTop: 8,
          opacity: percentileOpacity,
        }}
      >
        Top{" "}
        <span style={{ color: COLORS.gold }}>
          {Math.round(interpolate(percentileOpacity, [0, 1], [100, 12]))}%
        </span>{" "}
        globally
      </div>
      <div
        style={{
          fontFamily: josefinFamily,
          fontSize: 10,
          letterSpacing: "0.3em",
          color: COLORS.textMuted,
          marginTop: 5,
          textTransform: "uppercase",
          opacity: percentileOpacity,
        }}
      >
        Archetype: The Classic
      </div>
    </div>
  );
};
