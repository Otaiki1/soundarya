import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS } from "../colors";
import { playfairFamily, josefinFamily } from "../fonts";
import { DimensionBars, OverallScore } from "../components/DimensionBars";

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();

  const portraitOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const scoreOpacity = interpolate(frame, [15, 38], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const scoreY = interpolate(frame, [15, 38], [18, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const taglineOpacity = interpolate(frame, [130, 155], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [130, 155], [10, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Portrait: top 40% of frame
  const portraitH = 760;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 28%, ${COLORS.bgSurface} 0%, ${COLORS.bg} 60%)` }}>

      {/* Portrait — top 40% */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: portraitH, opacity: portraitOpacity }}>
        <Img
          src={staticFile("uzoza/South_Asian_woman_with_landmark_mesh_and_partial_score.png")}
          style={{ width: 1080, height: portraitH, objectFit: "cover", objectPosition: "center top", filter: "saturate(0.78) brightness(0.8)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 50%, ${COLORS.bg} 100%)` }} />
        {/* Corner marks */}
        {([{ top: 80, left: 40 }, { top: 80, right: 40 }] as React.CSSProperties[]).map((pos, i) => (
          <div key={i} style={{
            position: "absolute", width: 18, height: 18,
            borderTop: `2px solid ${COLORS.gold}`, opacity: 0.7,
            borderLeft: pos.left !== undefined ? `2px solid ${COLORS.gold}` : undefined,
            borderRight: pos.right !== undefined ? `2px solid ${COLORS.gold}` : undefined,
            ...pos,
          }} />
        ))}
      </div>

      {/* Single column for all score content + tagline */}
      <div
        style={{
          position: "absolute",
          top: portraitH - 40, left: 0, right: 0, bottom: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          padding: "0 90px",
          gap: 0,
        }}
      >
        {/* Score + label + bars — all in a single block */}
        <div style={{ opacity: scoreOpacity, transform: `translateY(${scoreY}px)`, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <OverallScore delay={20} />

          <div style={{ width: "100%", height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.gold}40, transparent)` }} />

          <DimensionBars />
        </div>

        {/* Flexible spacer before tagline */}
        <div style={{ flex: 1 }} />

        {/* Tagline — bottom of column */}
        <div style={{ opacity: taglineOpacity, transform: `translateY(${taglineY}px)`, textAlign: "center", paddingBottom: 120 }}>
          <div style={{
            fontFamily: josefinFamily, fontSize: 12, letterSpacing: "0.3em",
            color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 14,
          }}>
            One portrait · Nine dimensions · One honest read
          </div>
          <div style={{ fontFamily: playfairFamily, fontSize: 36, color: COLORS.textPrimary, lineHeight: 1.28 }}>
            <span style={{ color: COLORS.gold }}>Honest.</span> Precise. Yours.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
