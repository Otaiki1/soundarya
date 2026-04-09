import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../colors";
import { playfairFamily, josefinFamily } from "../fonts";

// Scene 8 — Portrait 1080×1920
// Centered wordmark, sweep, tagline, URL — clean vertical stack
export const Scene8: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wordmarkSpring = spring({ frame, fps, delay: 8, config: { damping: 200 }, durationInFrames: 45 });

  const lineWidth = interpolate(frame, [30, 85], [0, 420], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const taglineOpacity = interpolate(frame, [65, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [65, 90], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

  const urlOpacity = interpolate(frame, [98, 125], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const urlY = interpolate(frame, [98, 125], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

  const subcopyOpacity = interpolate(frame, [148, 168], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const glowPulse = interpolate(frame % 100, [0, 50, 100], [0.06, 0.14, 0.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cornerOpacity = interpolate(frame, [45, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep }}>
      {/* Glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 700px 700px at 50% 50%, rgba(201,169,110,${glowPulse}) 0%, transparent 70%)`,
        }}
      />

      {/* Corner decorations — sized for portrait */}
      <AbsoluteFill style={{ opacity: cornerOpacity }}>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920">
          <line x1="60" y1="80" x2="200" y2="80" stroke={COLORS.gold} strokeWidth="0.9" opacity="0.38" />
          <line x1="60" y1="80" x2="60" y2="180" stroke={COLORS.gold} strokeWidth="0.9" opacity="0.38" />
          <line x1="1020" y1="80" x2="880" y2="80" stroke={COLORS.gold} strokeWidth="0.9" opacity="0.38" />
          <line x1="1020" y1="80" x2="1020" y2="180" stroke={COLORS.gold} strokeWidth="0.9" opacity="0.38" />
          <line x1="60" y1="1840" x2="200" y2="1840" stroke={COLORS.gold} strokeWidth="0.9" opacity="0.38" />
          <line x1="60" y1="1840" x2="60" y2="1740" stroke={COLORS.gold} strokeWidth="0.9" opacity="0.38" />
          <line x1="1020" y1="1840" x2="880" y2="1840" stroke={COLORS.gold} strokeWidth="0.9" opacity="0.38" />
          <line x1="1020" y1="1840" x2="1020" y2="1740" stroke={COLORS.gold} strokeWidth="0.9" opacity="0.38" />
        </svg>
      </AbsoluteFill>

      {/* Main content — vertically centered */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          padding: "0 60px",
        }}
      >
        {/* UZOZA wordmark — bigger for portrait */}
        <div
          style={{
            opacity: wordmarkSpring,
            transform: `scale(${interpolate(wordmarkSpring, [0, 1], [0.88, 1])})`,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontFamily: playfairFamily,
              fontSize: 108,
              fontWeight: 700,
              color: COLORS.gold,
              letterSpacing: "0.22em",
              lineHeight: 1,
              textShadow: `0 0 80px ${COLORS.gold}42`,
              textAlign: "center",
            }}
          >
            UZOZA
          </div>
        </div>

        {/* Sweep line */}
        <div
          style={{
            width: lineWidth,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            opacity: 0.65,
            marginBottom: 48,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: playfairFamily,
              fontSize: 50,
              fontWeight: 400,
              color: COLORS.textPrimary,
              letterSpacing: "0.02em",
              fontStyle: "italic",
              lineHeight: 1.22,
            }}
          >
            Discover your score.
          </div>
        </div>

        {/* URL */}
        <div style={{ opacity: urlOpacity, transform: `translateY(${urlY}px)` }}>
          <div
            style={{
              fontFamily: josefinFamily,
              fontSize: 30,
              fontWeight: 300,
              letterSpacing: "0.42em",
              color: COLORS.gold,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            uzoza.xyz
          </div>
        </div>
      </AbsoluteFill>

      {/* Subcopy */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 140,
          opacity: subcopyOpacity,
        }}
      >
        <div
          style={{
            fontFamily: josefinFamily,
            fontSize: 12,
            letterSpacing: "0.28em",
            color: COLORS.textMuted,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          Your face has a score. Find out what it is.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
