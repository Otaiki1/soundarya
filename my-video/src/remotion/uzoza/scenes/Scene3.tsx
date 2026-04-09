import React from "react";
import {
  AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { COLORS } from "../colors";
import { playfairFamily, josefinFamily } from "../fonts";

const DIMENSION_LABELS = [
  "Symmetry", "Harmony", "Proportionality", "Bone Structure", "Skin", "Dimorphism", "Neoteny",
];

const PORTRAIT_CYCLE = [
  "uzoza/Brazilian_woman_with_symmetry_nodes.png",
  "uzoza/Korean_man_with_measurement_grid_and_score_readouts.png",
  "uzoza/South_Asian_woman_with_landmark_mesh_and_partial_score.png",
  "uzoza/Nigerian_man_with_golden_ratio_analysis_lines.png",
];

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const portraitIndex = Math.floor(frame / 35) % PORTRAIT_CYCLE.length;
  const localF = frame % 35;
  const portraitOpacity = interpolate(localF, [0, 6, 28, 35], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const taglineOpacity = interpolate(frame, [100, 122], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [100, 122], [12, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>

      {/* Cycling portrait — full bleed, very subtle */}
      <AbsoluteFill>
        <Img
          src={staticFile(PORTRAIT_CYCLE[portraitIndex])}
          style={{
            width: 1080, height: 1920, objectFit: "cover", objectPosition: "center top",
            opacity: portraitOpacity * 0.22, filter: "saturate(0.35) brightness(0.5)",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${COLORS.bg}AA 0%, ${COLORS.bg}44 35%, ${COLORS.bg}44 65%, ${COLORS.bg}AA 100%)` }} />

      {/* Single column: gold tag → labels → tagline */}
      <div
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          padding: "180px 72px 200px",
        }}
      >
        {/* Top eyebrow */}
        <div style={{ marginBottom: 30, textAlign: "center" }}>
          <div style={{
            fontFamily: josefinFamily, fontSize: 12, letterSpacing: "0.4em",
            color: COLORS.gold, textTransform: "uppercase",
          }}>
            9 Dimensions
          </div>
          <div style={{ width: 36, height: 1, background: COLORS.gold, opacity: 0.45, margin: "12px auto 0" }} />
        </div>

        {/* Spacer pushes labels toward center */}
        <div style={{ flex: 1 }} />

        {/* Dimension labels */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {DIMENSION_LABELS.map((label, i) => {
            const s = spring({ frame, fps, delay: i * 10, config: { damping: 200 }, durationInFrames: 20 });
            return (
              <div
                key={label}
                style={{
                  opacity: s,
                  transform: `translateY(${interpolate(s, [0, 1], [10, 0])}px)`,
                  display: "flex", alignItems: "center", gap: 16,
                }}
              >
                <div style={{ width: interpolate(s, [0, 1], [0, 26]), height: 1, background: COLORS.gold, opacity: 0.5 }} />
                <div style={{ fontFamily: josefinFamily, fontSize: 17, letterSpacing: "0.34em", color: COLORS.textSecondary, textTransform: "uppercase" }}>
                  {label}
                </div>
                <div style={{ width: interpolate(s, [0, 1], [0, 26]), height: 1, background: COLORS.gold, opacity: 0.5 }} />
              </div>
            );
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Tagline — bottom of column */}
        <div style={{ opacity: taglineOpacity, transform: `translateY(${taglineY}px)`, textAlign: "center" }}>
          <div style={{ fontFamily: playfairFamily, fontSize: 42, fontWeight: 400, color: COLORS.textPrimary, fontStyle: "italic", lineHeight: 1.28 }}>
            Uzoza reads what most people miss.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
