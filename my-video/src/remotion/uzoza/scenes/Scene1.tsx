import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../colors";
import { playfairFamily } from "../fonts";
import { FaceSilhouetteLine } from "../components/GoldLine";

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();

  const lineProgress = interpolate(frame, [0, 62], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const textOpacity = interpolate(frame, [32, 54], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const textY = interpolate(frame, [32, 54], [14, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const lineWidth = interpolate(frame, [48, 80], [0, 300], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const glow = interpolate(frame, [0, 50], [0, 0.09], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, ${COLORS.bgSurface} 0%, ${COLORS.bg} 65%)` }}>

      {/* Ambient glow */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 500px 600px at 50% 40%, rgba(201,169,110,${glow}) 0%, transparent 70%)` }} />

      {/* Single column — top to bottom */}
      <div
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          padding: "0 72px",
        }}
      >
        {/* Silhouette — upper 55% of frame */}
        <div style={{ height: 1050, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: "scale(1.6)" }}>
            <FaceSilhouetteLine progress={lineProgress} />
          </div>
        </div>

        {/* Fixed gap between silhouette and text */}
        <div style={{ height: 60 }} />

        {/* Text block */}
        <div style={{ opacity: textOpacity, transform: `translateY(${textY}px)`, textAlign: "center" }}>
          <div style={{
            fontFamily: playfairFamily, fontSize: 62, fontWeight: 400,
            color: COLORS.textPrimary, letterSpacing: "0.01em", lineHeight: 1.2,
          }}>
            Your face has a score.
          </div>
        </div>

        <div style={{ height: 28 }} />

        {/* Gold accent line */}
        <div style={{
          width: lineWidth, height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
          opacity: 0.6,
        }} />
      </div>
    </AbsoluteFill>
  );
};
