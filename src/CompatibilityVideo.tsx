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
import type { Compatibility } from "./data/zodiac-compatibility";
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
// CompatibilityVideo — viral "burç uyumu" (en yüksek etkileşim)
// "AKREP + BOĞA = ?" → verdict reveal → 3 beat (dinamik) → "siz misiniz?"
// Etiketleme tetikler (kendi+partner burcu) → yorum/paylaşım patlar.
// ═══════════════════════════════════════════════════════════════════════════

export type CompatibilityVideoProps = { compat: Compatibility; voiceover?: Voiceover };

// ─── Altın glyph (CSS mask) ──────────────────────────────────────────────
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

// ─── Tek burç bloğu (glyph + isim) ───────────────────────────────────────
const SignBlock: React.FC<{ svgFile: string; name: string; glow: number }> = ({
  svgFile,
  name,
  glow,
}) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <GoldGlyph svgFile={svgFile} size={170} glow={glow} />
    <div
      style={{
        fontSize: 48,
        fontFamily: "Georgia, serif",
        fontWeight: 700,
        color: GOLD,
        letterSpacing: 3,
        marginTop: 12,
        textShadow: `0 0 24px ${GOLD}`,
      }}
    >
      {name}
    </div>
  </div>
);

// ─── Hook — "AKREP + BOĞA = ?" ───────────────────────────────────────────
const PairHook: React.FC<{
  svg1: string;
  name1: string;
  svg2: string;
  name2: string;
  durFrames?: number;
}> = ({ svg1, name1, svg2, name2, durFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = durFrames ?? 2.5 * fps;
  const opacity = interpolate(frame, [0, 0.4 * fps, d - 0.45 * fps, d], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 0.5 * fps,
  });
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 50px" }}>
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
          <SignBlock svgFile={svg1} name={name1} glow={glow} />
          <div
            style={{
              fontSize: 90,
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              color: "#ffffff",
              textShadow: "0 0 30px rgba(168,85,247,0.7)",
            }}
          >
            +
          </div>
          <SignBlock svgFile={svg2} name={name2} glow={glow} />
        </div>
        <div
          style={{
            fontSize: 100,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#ffffff",
            marginTop: 36,
            letterSpacing: 6,
            textShadow: `0 0 40px ${GOLD}`,
          }}
        >
          = ?
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Verdict reveal — "YA HEP YA HİÇ 🔥" ─────────────────────────────────
const Verdict: React.FC<{ verdict: string; durFrames?: number }> = ({ verdict, durFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = durFrames ?? 2.5 * fps;
  const enter = spring({ frame, fps, config: { damping: 11, stiffness: 110 }, durationInFrames: 0.5 * fps });
  const opacity = interpolate(frame, [0, 0.3 * fps, d - 0.45 * fps, d], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const pulse = 1 + Math.sin(frame * 0.12) * 0.05;
  const scale = interpolate(enter, [0, 1], [0.5, 1]) * pulse;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 70px" }}>
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
        <div
          style={{
            fontSize: 96,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            lineHeight: 1.15,
            textShadow: `0 0 60px ${GOLD}`,
          }}
        >
          {verdict}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── BeatCard — sıra numarası + dinamik cümlesi ──────────────────────────
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
export const CompatibilityVideo: React.FC<CompatibilityVideoProps> = ({ compat, voiceover }) => {
  const { fps } = useVideoConfig();
  const g = getSegs(voiceover, fps);
  const s1 = getZodiacById(compat.sign1Id);
  const s2 = getZodiacById(compat.sign2Id);

  return (
    <AbsoluteFill style={{ background: BG_GRADIENT }}>
      <StarField />
      <BackgroundMusic maxVolume={voiceover ? 0.12 : 0.45} />
      {voiceover && <VoiceTrack vo={voiceover} />}

      <Sequence durationInFrames={g.hook.dur} layout="none">
        <PairHook
          svg1={s1?.svgFile ?? "aries.svg"}
          name1={s1?.signName ?? ""}
          svg2={s2?.svgFile ?? "taurus.svg"}
          name2={s2?.signName ?? ""}
          durFrames={g.hook.dur}
        />
      </Sequence>

      <Sequence from={g.reveal.from} durationInFrames={g.reveal.dur} layout="none">
        <Verdict verdict={compat.verdict} durFrames={g.reveal.dur} />
      </Sequence>

      <Sequence from={g.m1.from} durationInFrames={g.m1.dur} layout="none">
        <BeatCard n={1} text={compat.beats[0]} durFrames={g.m1.dur} />
      </Sequence>

      <Sequence from={g.m2.from} durationInFrames={g.m2.dur} layout="none">
        <BeatCard n={2} text={compat.beats[1]} durFrames={g.m2.dur} />
      </Sequence>

      <Sequence from={g.m3.from} durationInFrames={g.m3.dur} layout="none">
        <BeatCard n={3} text={compat.beats[2]} durFrames={g.m3.dur} />
      </Sequence>

      <Sequence from={g.q.from} durationInFrames={g.q.dur} layout="none">
        <Question title="SİZ MİSİNİZ?" body={compat.question} footer="o kişiyi etiketle 👇" durFrames={g.q.dur} />
      </Sequence>

      <Sequence from={g.cta.from} durationInFrames={g.cta.dur} layout="none">
        <LogoCta subtitle="AI ile detaylı uyum analizi" />
      </Sequence>
    </AbsoluteFill>
  );
};
