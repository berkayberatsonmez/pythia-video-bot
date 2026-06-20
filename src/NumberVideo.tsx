import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { NumberContent } from "./data/numbers";
import {
  GOLD,
  BG_GRADIENT,
  StarField,
  BackgroundMusic,
  MeaningCard,
  Question,
  LogoCta,
} from "./components/shared";
import { type Voiceover, getSegs, VoiceTrack } from "./components/voiceover";

// ═══════════════════════════════════════════════════════════════════════════
// Number video — numeroloji + melek sayıları (büyük sayı animasyonu)
//   lifepath → "Yaşam yolu X isen"
//   angel    → "Sürekli X görüyorsan"
// ═══════════════════════════════════════════════════════════════════════════

export type NumberVideoProps = { content: NumberContent; voiceover?: Voiceover };

// ─── Hook — sayıya göre değişir ──────────────────────────────────────────
const Hook: React.FC<{ content: NumberContent; durFrames?: number }> = ({
  content,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = durFrames ?? 2.5 * fps;

  // sürekli yavaş drift (statik durmasın → TikTok "statik AI" cezasına karşı)
  const drift = Math.sin(frame * 0.04) * 8;
  const opacity = interpolate(
    frame,
    [0, 0.4 * fps, d - 0.45 * fps, d],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" },
  );
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 0.5 * fps,
  });

  const topText =
    content.kind === "lifepath" ? "YAŞAM YOLU SAYIN" : "SÜREKLİ GÖRÜYORSAN";

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity,
          transform: `scale(${scale}) translateY(${drift}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 5,
            marginBottom: 30,
          }}
        >
          {topText}
        </div>
        <div
          style={{
            fontSize: content.number.length >= 4 ? 240 : 320,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            lineHeight: 1,
            textShadow: `0 0 60px ${GOLD}, 0 0 120px rgba(212, 168, 67, 0.6)`,
          }}
        >
          {content.number}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Number reveal — büyük sayı + başlık ─────────────────────────────────
const NumberReveal: React.FC<{ content: NumberContent; durFrames?: number }> = ({
  content,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = durFrames ?? 2.5 * fps;

  const enter = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 90 },
    durationInFrames: 1 * fps,
  });
  const scale = interpolate(enter, [0, 1], [0.3, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;
  // yavaş sürekli nefes (statik kalmasın)
  const breathe = 1 + Math.sin(frame * 0.05) * 0.03;

  const titleOpacity = interpolate(frame, [0.8 * fps, 1.3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [d - 0.5 * fps, d], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          transform: `scale(${scale * breathe})`,
          opacity,
          fontSize: content.number.length >= 4 ? 300 : 380,
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          color: GOLD,
          lineHeight: 1,
          textShadow: `0 0 ${50 + glow * 60}px ${GOLD}, 0 0 ${
            100 + glow * 80
          }px rgba(212, 168, 67, 0.7)`,
        }}
      >
        {content.number}
      </div>
      <div
        style={{
          opacity: titleOpacity,
          marginTop: 20,
          fontSize: content.title.length > 14 ? 56 : 72,
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: 6,
          textShadow: `0 0 30px rgba(168, 85, 247, 0.7)`,
          textAlign: "center",
        }}
      >
        {content.title}
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main composition
// ═══════════════════════════════════════════════════════════════════════════
export const NumberVideo: React.FC<NumberVideoProps> = ({
  content,
  voiceover,
}) => {
  const { fps } = useVideoConfig();
  const g = getSegs(voiceover, fps);
  const subtitle =
    content.kind === "lifepath"
      ? "AI ile detaylı numeroloji"
      : "AI ile melek sayısı yorumu";

  return (
    <AbsoluteFill style={{ background: BG_GRADIENT }}>
      <StarField />
      <BackgroundMusic maxVolume={voiceover ? 0.12 : 0.45} />
      {voiceover && <VoiceTrack vo={voiceover} />}

      {/* Hook */}
      <Sequence durationInFrames={g.hook.dur} layout="none">
        <Hook content={content} durFrames={g.hook.dur} />
      </Sequence>

      {/* Number reveal */}
      <Sequence from={g.reveal.from} durationInFrames={g.reveal.dur} layout="none">
        <NumberReveal content={content} durFrames={g.reveal.dur} />
      </Sequence>

      {/* Meaning 1 */}
      <Sequence from={g.m1.from} durationInFrames={g.m1.dur} layout="none">
        <MeaningCard number="1" title={content.meanings[0].title} desc={content.meanings[0].desc} durFrames={g.m1.dur} />
      </Sequence>

      {/* Meaning 2 */}
      <Sequence from={g.m2.from} durationInFrames={g.m2.dur} layout="none">
        <MeaningCard number="2" title={content.meanings[1].title} desc={content.meanings[1].desc} durFrames={g.m2.dur} />
      </Sequence>

      {/* Meaning 3 */}
      <Sequence from={g.m3.from} durationInFrames={g.m3.dur} layout="none">
        <MeaningCard number="3" title={content.meanings[2].title} desc={content.meanings[2].desc} durFrames={g.m3.dur} />
      </Sequence>

      {/* Question */}
      <Sequence from={g.q.from} durationInFrames={g.q.dur} layout="none">
        <Question
          title={content.questionTitle}
          body={content.questionBody}
          footer={content.questionFooter}
          durFrames={g.q.dur}
        />
      </Sequence>

      {/* Logo CTA */}
      <Sequence from={g.cta.from} durationInFrames={g.cta.dur} layout="none">
        <LogoCta subtitle={subtitle} />
      </Sequence>
    </AbsoluteFill>
  );
};
