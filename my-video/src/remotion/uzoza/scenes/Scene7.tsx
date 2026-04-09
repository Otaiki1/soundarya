import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../colors";
import { playfairFamily, josefinFamily } from "../fonts";

const LeaderboardRow: React.FC<{ rank: number; name: string; score: number; delta?: number; isYou?: boolean; delay: number }> = ({ rank, name, score, delta, isYou, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, delay, config: { damping: 200 }, durationInFrames: 22 });

  return (
    <div style={{
      opacity: s,
      transform: `translateX(${interpolate(s, [0, 1], [-18, 0])}px)`,
      display: "flex", alignItems: "center", gap: 14,
      padding: "11px 20px",
      background: isYou ? `${COLORS.gold}14` : "transparent",
      border: isYou ? `1px solid ${COLORS.gold}38` : "1px solid transparent",
      borderRadius: 6,
    }}>
      <div style={{ fontFamily: josefinFamily, fontSize: 13, color: isYou ? COLORS.gold : COLORS.textMuted, width: 26 }}>{rank}</div>
      <div style={{ flex: 1, fontFamily: josefinFamily, fontSize: 14, letterSpacing: "0.1em", color: isYou ? COLORS.textPrimary : COLORS.textSecondary, textTransform: "uppercase" }}>{name}</div>
      <div style={{ fontFamily: josefinFamily, fontSize: 15, color: isYou ? COLORS.gold : COLORS.textSecondary }}>{score.toFixed(1)}</div>
      {delta !== undefined && (
        <div style={{ fontFamily: josefinFamily, fontSize: 11, color: delta > 0 ? "#5DBE6A" : "#EF5350", width: 38, textAlign: "right" }}>
          {delta > 0 ? "+" : ""}{delta.toFixed(1)}
        </div>
      )}
    </div>
  );
};

const ScoreToken: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, delay: 5, config: { damping: 12, stiffness: 80 }, durationInFrames: 45 });
  const floatY = Math.sin((frame / 30) * Math.PI) * 7;
  const glowPulse = interpolate(frame % 80, [0, 40, 80], [0.28, 0.65, 0.28], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glowHex = Math.round(glowPulse * 90).toString(16).padStart(2, "0");

  return (
    <div style={{
      opacity: s,
      transform: `translateY(${floatY}px) scale(${interpolate(s, [0, 1], [0.65, 1])})`,
      width: 188, height: 188, borderRadius: "50%",
      background: `radial-gradient(circle at 38% 32%, ${COLORS.bgSurface}, ${COLORS.bgDeep})`,
      border: `2px solid ${COLORS.gold}55`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      boxShadow: `0 0 60px ${COLORS.gold}${glowHex}`,
      position: "relative",
    }}>
      <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: `1px solid ${COLORS.gold}22` }} />
      <div style={{ fontFamily: josefinFamily, fontSize: 9, letterSpacing: "0.32em", color: COLORS.gold, textTransform: "uppercase", marginBottom: 6 }}>Score</div>
      <div style={{ fontSize: 54, fontWeight: 700, color: COLORS.gold, fontFamily: "Georgia, serif", lineHeight: 1, textShadow: `0 0 20px ${COLORS.gold}88` }}>8.3</div>
      <div style={{ fontFamily: josefinFamily, fontSize: 8, letterSpacing: "0.25em", color: COLORS.textMuted, marginTop: 6, textTransform: "uppercase" }}>Uzoza</div>
    </div>
  );
};

export const Scene7: React.FC = () => {
  const frame = useCurrentFrame();

  const networkOpacity = interpolate(frame, [0, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lbHeaderOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const line1Opacity = interpolate(frame, [95, 112], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2Opacity = interpolate(frame, [112, 129], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line3Opacity = interpolate(frame, [129, 144], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const nodes = [
    { x: 0.1, y: 0.1 }, { x: 0.9, y: 0.08 }, { x: 0.05, y: 0.48 },
    { x: 0.95, y: 0.52 }, { x: 0.5, y: 0.05 }, { x: 0.15, y: 0.85 },
    { x: 0.85, y: 0.8 }, { x: 0.5, y: 0.95 },
  ];

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, ${COLORS.bgSurface} 0%, ${COLORS.bg} 65%)` }}>

      {/* Network bg */}
      <AbsoluteFill style={{ opacity: networkOpacity * 0.32 }}>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920">
          {nodes.map((a, i) => nodes.slice(i + 1).map((b, j) => {
            const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
            if (dist > 0.6) return null;
            return <line key={`${i}-${j}`} x1={a.x * 1080} y1={a.y * 1920} x2={b.x * 1080} y2={b.y * 1920}
              stroke={COLORS.gold} strokeWidth="0.8"
              opacity={interpolate(frame, [i * 4, i * 4 + 25], [0, (1 - dist / 0.6) * 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />;
          }))}
          {nodes.map((n, i) => (
            <circle key={i} cx={n.x * 1080} cy={n.y * 1920} r={3} fill={COLORS.gold}
              opacity={interpolate(frame, [i * 4, i * 4 + 18], [0, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          ))}
        </svg>
      </AbsoluteFill>

      {/* Single column: token → leaderboard → text lines */}
      <div
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          padding: "200px 60px 180px",
          gap: 0,
        }}
      >
        {/* Score token */}
        <ScoreToken />

        <div style={{ height: 60 }} />

        {/* Leaderboard */}
        <div style={{ width: "100%" }}>
          <div style={{ opacity: lbHeaderOpacity }}>
            <div style={{ fontFamily: josefinFamily, fontSize: 10, letterSpacing: "0.36em", color: COLORS.gold, textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>
              Leaderboard — Your Circle
            </div>
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.gold}40, transparent)`, marginBottom: 8 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <LeaderboardRow rank={1} name="Alex K." score={9.1} delta={0.3} delay={22} />
            <LeaderboardRow rank={2} name="Jordan M." score={8.7} delta={0.1} delay={30} />
            <LeaderboardRow rank={3} name="You" score={8.3} delta={0.8} isYou delay={38} />
            <LeaderboardRow rank={4} name="Sam R." score={8.0} delta={-0.1} delay={46} />
            <LeaderboardRow rank={5} name="Riley T." score={7.8} delta={0.4} delay={54} />
          </div>
        </div>

        {/* Push text lines to bottom */}
        <div style={{ flex: 1 }} />

        {/* Text lines */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { text: "Mint your score.", opacity: line1Opacity, color: COLORS.gold },
            { text: "Challenge your friends.", opacity: line2Opacity, color: COLORS.textPrimary },
            { text: "Own the result.", opacity: line3Opacity, color: COLORS.textPrimary },
          ].map(({ text, opacity, color }) => (
            <div key={text} style={{ opacity }}>
              <span style={{ fontFamily: playfairFamily, fontSize: 40, color }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
