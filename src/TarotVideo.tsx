import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { TarotCard } from "./data/tarot-cards";
import {
  GOLD,
  BG_GRADIENT,
  StarField,
  MeaningCard,
  Question,
  LogoCta,
} from "./components/shared";

// ═══════════════════════════════════════════════════════════════════════════
// Tarot video — "Bugün senin kartın: X"
// Gerçek kart görseli public/tarot/XX.webp kullanır.
// ═══════════════════════════════════════════════════════════════════════════

export type TarotVideoProps = { card: TarotCard };

// ─── Hook — "BUGÜN SENİN KARTIN" ─────────────────────────────────────────
const Hook: React.FC<{ energy: string }> = ({ energy }) => {
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

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
        <div
          style={{
            fontSize: 52,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 6,
            marginBottom: 20,
          }}
        >
          BUGÜN SENİN
        </div>
        <div
          style={{
            fontSize: 130,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 6,
            textShadow: `0 0 50px ${GOLD}, 0 0 100px rgba(212, 168, 67, 0.5)`,
          }}
        >
          KARTIN
        </div>
        <div
          style={{
            fontSize: 38,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.6)",
            fontStyle: "italic",
            marginTop: 24,
            letterSpacing: 2,
          }}
        >
          {energy}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Card reveal — gerçek kart görseli + isim ────────────────────────────
const CardReveal: React.FC<{ card: TarotCard }> = ({ card }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Kart aşağıdan uçar gelir
  const cardSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 70 },
    durationInFrames: 1.3 * fps,
  });
  const cardY = interpolate(cardSpring, [0, 1], [900, 0]);
  const cardScale = interpolate(cardSpring, [0, 1], [0.5, 1]);
  const cardRotate = interpolate(cardSpring, [0, 1], [-10, 0]);
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;

  // İsim kart oturduktan sonra belirir (~1.3s)
  const nameOpacity = interpolate(
    frame,
    [1.3 * fps, 1.8 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Sekans sonunda fade out
  const fadeOut = interpolate(frame, [2.5 * fps, 3 * fps], [1, 0], {
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
          transform: `translateY(${cardY}px) scale(${cardScale}) rotate(${cardRotate}deg)`,
          filter: `drop-shadow(0 0 ${40 + glow * 50}px rgba(212, 168, 67, ${
            0.5 + glow * 0.4
          }))`,
        }}
      >
        <Img
          src={staticFile(`tarot/${card.imageFile}`)}
          style={{
            width: 440,
            height: 733,
            objectFit: "cover",
            borderRadius: 20,
            border: `4px solid ${GOLD}`,
          }}
        />
      </div>
      <div
        style={{
          opacity: nameOpacity,
          marginTop: 30,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 6,
            textShadow: `0 0 40px ${GOLD}`,
          }}
        >
          {card.cardName}
        </div>
        <div
          style={{
            fontSize: 30,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.55)",
            fontStyle: "italic",
            letterSpacing: 3,
            marginTop: 4,
          }}
        >
          {card.cardNameSub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main composition
// ═══════════════════════════════════════════════════════════════════════════
export const TarotVideo: React.FC<TarotVideoProps> = ({ card }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: BG_GRADIENT }}>
      <StarField />

      {/* [0-2.5s] Hook */}
      <Sequence durationInFrames={2.5 * fps} layout="none">
        <Hook energy={card.energy} />
      </Sequence>

      {/* [2.5-5.5s] Card reveal */}
      <Sequence from={2.5 * fps} durationInFrames={3 * fps} layout="none">
        <CardReveal card={card} />
      </Sequence>

      {/* [5.5-7.5s] Meaning 1 */}
      <Sequence from={5.5 * fps} durationInFrames={2 * fps} layout="none">
        <MeaningCard number="1" title={card.meanings[0].title} desc={card.meanings[0].desc} />
      </Sequence>

      {/* [7.5-9.5s] Meaning 2 */}
      <Sequence from={7.5 * fps} durationInFrames={2 * fps} layout="none">
        <MeaningCard number="2" title={card.meanings[1].title} desc={card.meanings[1].desc} />
      </Sequence>

      {/* [9.5-11.5s] Meaning 3 */}
      <Sequence from={9.5 * fps} durationInFrames={2 * fps} layout="none">
        <MeaningCard number="3" title={card.meanings[2].title} desc={card.meanings[2].desc} />
      </Sequence>

      {/* [11.5-13s] Question */}
      <Sequence from={11.5 * fps} durationInFrames={1.5 * fps} layout="none">
        <Question
          title={card.questionTitle}
          body={card.questionBody}
          footer={card.questionFooter}
        />
      </Sequence>

      {/* [13-15s] Logo CTA */}
      <Sequence from={13 * fps} durationInFrames={2 * fps} layout="none">
        <LogoCta subtitle="AI ile detaylı tarot yorumu" />
      </Sequence>
    </AbsoluteFill>
  );
};
