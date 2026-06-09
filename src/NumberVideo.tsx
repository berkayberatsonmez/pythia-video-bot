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

// ═══════════════════════════════════════════════════════════════════════════
// Number video — numeroloji + melek sayıları (büyük sayı animasyonu)
//   lifepath → "Yaşam yolu X isen"
//   angel    → "Sürekli X görüyorsan"
// ═══════════════════════════════════════════════════════════════════════════

export type NumberVideoProps = { content: NumberContent };

// ─── Hook — sayıya göre değişir ──────────────────────────────────────────
const Hook: React.FC<{ content: NumberContent }> = ({ content }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 0.4 * fps, 2 * fps, 2.5 * fps],
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
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
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
const NumberReveal: React.FC<{ content: NumberContent }> = ({ content }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 90 },
    durationInFrames: 1 * fps,
  });
  const scale = interpolate(enter, [0, 1], [0.3, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;

  const titleOpacity = interpolate(frame, [0.8 * fps, 1.3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [2 * fps, 2.5 * fps], [1, 0], {
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
          transform: `scale(${scale})`,
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
export const NumberVideo: React.FC<NumberVideoProps> = ({ content }) => {
  const { fps } = useVideoConfig();
  const subtitle =
    content.kind === "lifepath"
      ? "AI ile detaylı numeroloji"
      : "AI ile melek sayısı yorumu";

  return (
    <AbsoluteFill style={{ background: BG_GRADIENT }}>
      <StarField />
      <BackgroundMusic />

      {/* [0-2.5s] Hook */}
      <Sequence durationInFrames={2.5 * fps} layout="none">
        <Hook content={content} />
      </Sequence>

      {/* [2.5-5s] Number reveal */}
      <Sequence from={2.5 * fps} durationInFrames={2.5 * fps} layout="none">
        <NumberReveal content={content} />
      </Sequence>

      {/* [5-7.3s] Meaning 1 */}
      <Sequence from={5 * fps} durationInFrames={2.3 * fps} layout="none">
        <MeaningCard number="1" title={content.meanings[0].title} desc={content.meanings[0].desc} />
      </Sequence>

      {/* [7.3-9.6s] Meaning 2 */}
      <Sequence from={7.3 * fps} durationInFrames={2.3 * fps} layout="none">
        <MeaningCard number="2" title={content.meanings[1].title} desc={content.meanings[1].desc} />
      </Sequence>

      {/* [9.6-11.9s] Meaning 3 */}
      <Sequence from={9.6 * fps} durationInFrames={2.3 * fps} layout="none">
        <MeaningCard number="3" title={content.meanings[2].title} desc={content.meanings[2].desc} />
      </Sequence>

      {/* [11.9-13.4s] Question */}
      <Sequence from={11.9 * fps} durationInFrames={1.5 * fps} layout="none">
        <Question
          title={content.questionTitle}
          body={content.questionBody}
          footer={content.questionFooter}
        />
      </Sequence>

      {/* [13.4-15s] Logo CTA */}
      <Sequence from={13.4 * fps} durationInFrames={1.6 * fps} layout="none">
        <LogoCta subtitle={subtitle} />
      </Sequence>
    </AbsoluteFill>
  );
};
