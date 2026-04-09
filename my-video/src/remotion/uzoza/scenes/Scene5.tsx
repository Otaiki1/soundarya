import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../colors";
import { playfairFamily, josefinFamily } from "../fonts";

interface InsightCardProps {
  title: string;
  body: string;
  tag: string;
  delay: number;
  accent?: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, body, tag, delay, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, delay, config: { damping: 200 }, durationInFrames: 25 });

  return (
    <div style={{
      opacity: s,
      transform: `translateY(${interpolate(s, [0, 1], [16, 0])}px)`,
      background: accent ? `${COLORS.bgSurface}EE` : `${COLORS.charcoal}CC`,
      border: `1px solid ${accent ? COLORS.gold + "50" : COLORS.gold + "1E"}`,
      borderRadius: 8, padding: "18px 22px",
      position: "relative", overflow: "hidden",
    }}>
      {accent && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(to bottom, ${COLORS.gold}, ${COLORS.goldDim})`, borderRadius: "8px 0 0 8px" }} />
      )}
      <div style={{ fontFamily: josefinFamily, fontSize: 10, letterSpacing: "0.32em", color: COLORS.gold, textTransform: "uppercase", marginBottom: 7 }}>
        {tag}
      </div>
      <div style={{ fontFamily: josefinFamily, fontSize: 13, fontWeight: "bold", letterSpacing: "0.1em", color: COLORS.textPrimary, textTransform: "uppercase", marginBottom: 7 }}>
        {title}
      </div>
      <div style={{ fontFamily: josefinFamily, fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6, letterSpacing: "0.02em" }}>
        {body}
      </div>
    </div>
  );
};

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [90, 112], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [90, 112], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${COLORS.bgSurface} 0%, ${COLORS.bg} 65%)` }}>

      {/* Single column — header → cards → tagline */}
      <div
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          padding: "160px 60px 160px",
          gap: 0,
        }}
      >
        {/* Header */}
        <div style={{ opacity: headerOpacity, marginBottom: 48, alignSelf: "flex-start", paddingLeft: 8 }}>
          <div style={{ fontFamily: josefinFamily, fontSize: 11, letterSpacing: "0.42em", color: COLORS.gold, textTransform: "uppercase", marginBottom: 10 }}>
            Your Analysis
          </div>
          <div style={{ width: 40, height: 1, background: COLORS.gold, opacity: 0.45 }} />
        </div>

        {/* Cards — 2 columns, fixed height */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <InsightCard tag="Strengths" title="Bone Structure" body="Top 15% globally for orbital rim projection and zygomatic definition." delay={0} accent />
          <InsightCard tag="Focus Area" title="Skin Quality" body="Your lowest dimension. Skincare protocol yields the biggest score jump." delay={12} />
          <InsightCard tag="Roadmap" title="Next Steps" body="Facial posture + lighting. Estimated impact: +0.4 on your score." delay={24} />
          <InsightCard tag="Archetype" title="The Classic" body="Timeless, universally appealing features with strong structure." delay={36} accent />
        </div>

        {/* Flexible spacer */}
        <div style={{ flex: 1 }} />

        {/* Tagline — bottom */}
        <div style={{ opacity: taglineOpacity, transform: `translateY(${taglineY}px)`, textAlign: "center" }}>
          <div style={{ fontFamily: playfairFamily, fontSize: 46, color: COLORS.textPrimary, fontStyle: "italic", lineHeight: 1.26 }}>
            Not flattery. Not filters.{" "}
            <span style={{ color: COLORS.gold }}>Just the truth.</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
