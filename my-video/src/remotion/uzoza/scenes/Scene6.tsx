import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../colors";
import { playfairFamily, josefinFamily } from "../fonts";

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imageOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const dividerOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const deltaSpring = spring({ frame, fps, delay: 30, config: { damping: 200 }, durationInFrames: 50 });
  const deltaScore = interpolate(deltaSpring, [0, 1], [0, 0.8]);

  const line1Opacity = interpolate(frame, [88, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2Opacity = interpolate(frame, [105, 122], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line3Opacity = interpolate(frame, [122, 139], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Each image panel = 700px tall. Diptych = 1400px total. Text in bottom 520px.
  const imgH = 700;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, ${COLORS.bgSurface} 0%, ${COLORS.bg} 65%)` }}>

      {/* Week 1 — top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: imgH, opacity: imageOpacity }}>
        <Img
          src={staticFile("uzoza/Arab_man_diptych_Week_1_vs_Week_6_with_delta_score.png")}
          style={{ width: 1080, height: imgH, objectFit: "cover", objectPosition: "center top", filter: "saturate(0.6) brightness(0.7)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 55%, ${COLORS.bg} 95%)` }} />
        {/* Week 1 label — top-left */}
        <div style={{ position: "absolute", top: 36, left: 40 }}>
          <div style={{ fontFamily: josefinFamily, fontSize: 10, letterSpacing: "0.3em", color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 6 }}>Week 1</div>
          <div style={{ background: `${COLORS.bgDeep}CC`, border: `1px solid ${COLORS.gold}28`, borderRadius: 5, padding: "5px 14px" }}>
            <span style={{ fontFamily: josefinFamily, fontSize: 20, color: COLORS.textSecondary }}>7.5</span>
          </div>
        </div>
      </div>

      {/* Horizontal VS divider — between the two images */}
      <div style={{ position: "absolute", top: imgH - 2, left: 0, right: 0, height: 4, opacity: dividerOpacity, background: `linear-gradient(to right, transparent, ${COLORS.gold}50, transparent)` }} />
      <div style={{
        position: "absolute", top: imgH - 22, left: "50%", transform: "translateX(-50%)",
        background: COLORS.bg, border: `1px solid ${COLORS.gold}44`, borderRadius: 18,
        padding: "6px 18px", fontFamily: josefinFamily, fontSize: 10, letterSpacing: "0.2em",
        color: COLORS.gold, opacity: dividerOpacity, zIndex: 10,
      }}>
        VS
      </div>

      {/* Week 6 — below divider */}
      <div style={{ position: "absolute", top: imgH + 4, left: 0, right: 0, height: imgH, opacity: imageOpacity }}>
        <Img
          src={staticFile("uzoza/Arab_man_diptych_Week_1_vs_Week_6_with_delta_score.png")}
          style={{ width: 1080, height: imgH, objectFit: "cover", objectPosition: "center bottom", filter: "saturate(0.88) brightness(0.85)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 50%, ${COLORS.bg} 96%)` }} />
        {/* Week 6 label — top-left */}
        <div style={{ position: "absolute", top: 36, left: 40 }}>
          <div style={{ fontFamily: josefinFamily, fontSize: 10, letterSpacing: "0.3em", color: COLORS.gold, textTransform: "uppercase", marginBottom: 6 }}>Week 6</div>
          <div style={{ background: `${COLORS.bgDeep}CC`, border: `1px solid ${COLORS.gold}50`, borderRadius: 5, padding: "5px 14px", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: josefinFamily, fontSize: 20, color: COLORS.gold }}>{(7.5 + deltaScore).toFixed(1)}</span>
            <span style={{ fontFamily: josefinFamily, fontSize: 12, color: "#5DBE6A", opacity: deltaSpring }}>+{deltaScore.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Text lines — anchored in the bottom 380px, well below both images */}
      <div
        style={{
          position: "absolute",
          top: imgH * 2 + 20, // starts right below Week 6 image
          left: 0, right: 0, bottom: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "0 72px",
          gap: 10,
        }}
      >
        {[
          { text: "Check where you stand.", opacity: line1Opacity, color: COLORS.textPrimary },
          { text: "Improve.", opacity: line2Opacity, color: COLORS.gold },
          { text: "Come back stronger.", opacity: line3Opacity, color: COLORS.textPrimary },
        ].map(({ text, opacity, color }) => (
          <div key={text} style={{ opacity }}>
            <span style={{ fontFamily: playfairFamily, fontSize: 38, color }}>{text}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
