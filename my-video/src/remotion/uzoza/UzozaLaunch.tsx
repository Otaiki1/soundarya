import React from "react";
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { Scene6 } from "./scenes/Scene6";
import { Scene7 } from "./scenes/Scene7";
import { Scene8 } from "./scenes/Scene8";
import "./fonts";

const FPS = 30;
const T = (s: number) => Math.round(s * FPS); // seconds → frames

// ─── Scene durations (raw, before transition overlap) ────────────────────────
// Voiceover is ~32s. Total raw = 960 + 7 transitions × 18 = 1086f → net 960f = 32s.
// Scenes are sized to match voiceover natural pauses.
const TRANSITION_F = 18; // slightly longer for smoothness

const S = {
  s1: T(3.2), //  96f  — "Your face has a score."
  s2: T(3.8), // 114f  — "Most people never find out…"
  s3: T(5.2), // 156f  — Dimension labels + "Uzoza reads…"
  s4: T(6.4), // 192f  — Score reveal + "One portrait…"
  s5: T(5.0), // 150f  — Insight cards + "Not flattery…"
  s6: T(5.2), // 156f  — Diptych + "Check where you stand…"
  s7: T(4.8), // 144f  — Mint/leaderboard + "Mint your score…"
  s8: T(6.8), // 204f  — CTA + URL hold
};

// Net duration: sum(S) - 7 × TRANSITION_F
// = (96+114+156+192+150+156+144+204) - 126 = 1212 - 126 = 1086f ≈ 36.2s
// (slightly longer than audio = natural end-card breathing room)
export const UZOZA_DURATION =
  Object.values(S).reduce((a, b) => a + b, 0) - TRANSITION_F * 7;

const timing = linearTiming({ durationInFrames: TRANSITION_F });

// ─── SFX absolute start offsets (accounting for transition overlaps) ─────────
// Scene starts (net, from frame 0 of the composition):
// S1: 0
// S2: S.s1 - 18 = 78
// S3: 78 + S.s2 - 18 = 174
// S4: 174 + S.s3 - 18 = 312
// S5: 312 + S.s4 - 18 = 486
// S6: 486 + S.s5 - 18 = 618
// S7: 618 + S.s6 - 18 = 756
// S8: 756 + S.s7 - 18 = 882
const SCENE_STARTS = (() => {
  const starts: number[] = [0];
  const durations = Object.values(S);
  for (let i = 1; i < durations.length; i++) {
    starts.push(starts[i - 1] + durations[i - 1] - TRANSITION_F);
  }
  return starts;
})();

export const UzozaLaunch: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* ── Voiceover ─────────────────────────────────────────────────── */}
      <Html5Audio src={staticFile("uzoza/voiceover/uzoza-launch.mp3")} volume={1} />

      <Html5Audio
        src={staticFile("uzoza/bg-music.mp3")}
        volume={(f: number) =>
          interpolate(
            f,
            [0, 30, UZOZA_DURATION - 60, UZOZA_DURATION],
            [0, 0.2, 0.2, 0],
          )
        }
      />

      {/* ── SFX: mesh scan lock (start of Scene 2, after mesh animates ~1.3s in) */}
      <Sequence from={SCENE_STARTS[1] + T(1.3)} durationInFrames={T(1.5)}>
        <Html5Audio src={staticFile("uzoza/sfx/scan-lock.wav")} volume={0.28} />
      </Sequence>

      {/* ── SFX: score ding (Scene 4, when score counter peaks ~2.2s in) */}
      <Sequence from={SCENE_STARTS[3] + T(2.2)} durationInFrames={T(1.8)}>
        <Html5Audio src={staticFile("uzoza/sfx/score-ding.wav")} volume={0.35} />
      </Sequence>

      {/* ── SFX: mint chime (Scene 7, token appears ~0.6s in) */}
      <Sequence from={SCENE_STARTS[6] + T(0.6)} durationInFrames={T(1.5)}>
        <Html5Audio src={staticFile("uzoza/sfx/mint-chime.wav")} volume={0.3} />
      </Sequence>

      {/* ── SFX: soft whoosh on Scene 8 entry */}
      <Sequence from={SCENE_STARTS[7]} durationInFrames={T(0.8)}>
        <Html5Audio src={staticFile("uzoza/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>

      {/* ── Scenes ────────────────────────────────────────────────────── */}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S.s1} premountFor={FPS}>
          <Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={S.s2} premountFor={FPS}>
          <Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={S.s3} premountFor={FPS}>
          <Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={S.s4} premountFor={FPS}>
          <Scene4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={S.s5} premountFor={FPS}>
          <Scene5 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={S.s6} premountFor={FPS}>
          <Scene6 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={S.s7} premountFor={FPS}>
          <Scene7 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={S.s8} premountFor={FPS}>
          <Scene8 />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
