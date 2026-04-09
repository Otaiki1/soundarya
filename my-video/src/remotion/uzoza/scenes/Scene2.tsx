import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS } from "../colors";
import { playfairFamily } from "../fonts";
import { MeshOverlay } from "../components/MeshOverlay";

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();

  const portraitOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const meshProgress = interpolate(frame, [12, 82], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const textOpacity = interpolate(frame, [58, 80], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const textY = interpolate(frame, [58, 80], [14, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Portrait covers upper 70%, text occupies lower 30%
  const portraitH = 1360;

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>

      {/* Portrait — top region, fades into bg at bottom */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: portraitH, opacity: portraitOpacity }}>
        <Img
          src={staticFile("uzoza/Nigerian_man_with_golden_ratio_analysis_lines.png")}
          style={{ width: 1080, height: portraitH, objectFit: "cover", objectPosition: "center top", filter: "saturate(0.75) brightness(0.7)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${COLORS.bg} 95%)` }} />
        <div style={{ position: "absolute", top: 0, left: 0 }}>
          <MeshOverlay width={1080} height={portraitH * 0.7} progress={meshProgress} />
        </div>
      </div>

      {/* Text — anchored in the lower 30% of the frame (below portrait) */}
      <div
        style={{
          position: "absolute",
          top: portraitH - 80, // overlap slightly into the fade zone
          left: 0, right: 0, bottom: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "0 72px",
          gap: 0,
        }}
      >
        <div style={{ opacity: textOpacity, transform: `translateY(${textY}px)`, textAlign: "center" }}>
          <div style={{
            fontFamily: playfairFamily, fontSize: 50, fontWeight: 400,
            color: COLORS.textPrimary, letterSpacing: "0.01em", lineHeight: 1.32,
            fontStyle: "italic",
          }}>
            Most people never find out what it is.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
