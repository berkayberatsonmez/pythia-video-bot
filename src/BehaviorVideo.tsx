import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Behavior } from "./data/zodiac-behaviors";
import { getZodiacById } from "./data/zodiac-signs";
import {
  GOLD,
  BG_GRADIENT,
  StarField,
  BackgroundMusic,
  Question,
  LogoCta,
} from "./components/shared";
import { type Voiceover, getSegs, VoiceTrack } from "./components/voiceover";

// ═══════════════════════════════════════════════════════════════════════════
// BehaviorVideo — viral "burç davranış senaryosu" (en paylaşılan format)
// "BİR AKREP seni sildiğinde…" → glyph → 3 beat (escalating) → "yaşadın mı?"
// Ses-güdümlü (getSegs); sessizde sabit 15sn (Studio). İnanç gerektirmez.
// ═══════════════════════════════════════════════════════════════════════════

export type BehaviorVideoProps = { behavior: Behavior; voiceover?: Voiceover };

// ─── Altın glyph (CSS mask) — burç sembolü ───────────────────────────────
const GoldGlyph: React.FC<{ svgFile: string; size: number; glow: number }> = ({
  svgFile,
  size,
  glow,
}) => {
  const url = staticFile(`zodiac/${svgFile}`);
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: GOLD,
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        filter: `drop-shadow(0 0 ${20 + glow * 40}px rgba(212,168,67,${0.6 + glow * 0.4}))`,
      }}
    />
  );
};

// ─── Hook — "BİR AKREP / SENİ SİLDİĞİNDE" ────────────────────────────────
const Hook: React.FC<{ signName: string; scenario: string; durFrames?: number }> = ({
  signName,
  scenario,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = durFrames ?? 2.5 * fps;
  const drift = Math.sin(frame * 0.04) * 8;
  const opacity = interpolate(frame, [0, 0.4 * fps, d - 0.45 * fps, d], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 0.5 * fps,
  });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 70px" }}>
      <div style={{ opacity, transform: `scale(${scale}) translateY(${drift}px)`, textAlign: "center" }}>
        <div
          style={{
            fontSize: 60,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 2,
            textShadow: "0 0 30px rgba(168,85,247,0.6)",
          }}
        >
          BİR {signName}
        </div>
        <div
          style={{
            fontSize: 84,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            lineHeight: 1.15,
            marginTop: 16,
            textShadow: `0 0 50px ${GOLD}`,
          }}
        >
          {scenario.toLocaleUpperCase("tr")}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Reveal — glyph + "…ne yapar?" (merak köprüsü) ───────────────────────
const Reveal: React.FC<{ svgFile: string; durFrames?: number }> = ({ svgFile, durFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = durFrames ?? 2.5 * fps;
  const enter = spring({ frame, fps, config: { damping: 13, stiffness: 90 }, durationInFrames: 0.6 * fps });
  const opacity = interpolate(frame, [0, 0.35 * fps, d - 0.45 * fps, d], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;
  const scale = interpolate(enter, [0, 1], [0.6, 1]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <GoldGlyph svgFile={svgFile} size={240} glow={glow} />
        <div
          style={{
            fontSize: 52,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#ffffff",
            marginTop: 36,
            fontStyle: "italic",
            textShadow: `0 0 30px ${GOLD}`,
          }}
        >
          …ne yapar? 👀
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── BeatCard — sıra numarası + davranış cümlesi ─────────────────────────
const BeatCard: React.FC<{ n: number; text: string; durFrames?: number }> = ({
  n,
  text,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
    durationInFrames: 0.6 * fps,
  });
  const exitStart = durFrames ? durFrames - 0.35 * fps : 2 * fps;
  const exitFade = interpolate(frame, [exitStart, exitStart + 0.3 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]) * exitFade;
  const ty = interpolate(enter, [0, 1], [70, 0]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 90px" }}>
      <div
        style={{
          opacity,
          transform: `translateY(${ty}px)`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 130,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            lineHeight: 1,
            textShadow: `0 0 40px ${GOLD}`,
          }}
        >
          {n}
        </div>
        <div
          style={{
            fontSize: 52,
            fontFamily: "Georgia, serif",
            color: "#ffffff",
            lineHeight: 1.4,
            marginTop: 28,
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main composition
// ═══════════════════════════════════════════════════════════════════════════
export const BehaviorVideo: React.FC<BehaviorVideoProps> = ({ behavior, voiceover }) => {
  const { fps } = useVideoConfig();
  const g = getSegs(voiceover, fps);
  const sign = getZodiacById(behavior.signId);
  const svgFile = sign?.svgFile ?? "aries.svg";

  return (
    <AbsoluteFill style={{ background: BG_GRADIENT }}>
      <StarField />
      <BackgroundMusic maxVolume={voiceover ? 0.12 : 0.45} />
      {voiceover && <VoiceTrack vo={voiceover} />}

      <Sequence durationInFrames={g.hook.dur} layout="none">
        <Hook signName={sign?.signName ?? ""} scenario={behavior.scenario} durFrames={g.hook.dur} />
      </Sequence>

      <Sequence from={g.reveal.from} durationInFrames={g.reveal.dur} layout="none">
        <Reveal svgFile={svgFile} durFrames={g.reveal.dur} />
      </Sequence>

      <Sequence from={g.m1.from} durationInFrames={g.m1.dur} layout="none">
        <BeatCard n={1} text={behavior.beats[0]} durFrames={g.m1.dur} />
      </Sequence>

      <Sequence from={g.m2.from} durationInFrames={g.m2.dur} layout="none">
        <BeatCard n={2} text={behavior.beats[1]} durFrames={g.m2.dur} />
      </Sequence>

      <Sequence from={g.m3.from} durationInFrames={g.m3.dur} layout="none">
        <BeatCard n={3} text={behavior.beats[2]} durFrames={g.m3.dur} />
      </Sequence>

      <Sequence from={g.q.from} durationInFrames={g.q.dur} layout="none">
        <Question title="PEKİ SEN?" body={behavior.question} footer="yorumlara yaz 👇" durFrames={g.q.dur} />
      </Sequence>

      <Sequence from={g.cta.from} durationInFrames={g.cta.dur} layout="none">
        <LogoCta subtitle="AI ile kişisel burç yorumu" />
      </Sequence>
    </AbsoluteFill>
  );
};
