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
  BackgroundMusic,
  MeaningCard,
  Question,
  LogoCta,
} from "./components/shared";
import { type Voiceover, getSegs, VoiceTrack } from "./components/voiceover";

// ═══════════════════════════════════════════════════════════════════════════
// Tarot video — "Bugün senin kartın: X"
// Gerçek kart görseli public/tarot/XX.webp kullanır.
// ═══════════════════════════════════════════════════════════════════════════

export type TarotVideoProps = { card: TarotCard; voiceover?: Voiceover };

// ─── Hook — "BUGÜN SENİN KARTIN" ─────────────────────────────────────────
const Hook: React.FC<{ energy: string; durFrames?: number }> = ({
  energy,
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
const CardReveal: React.FC<{ card: TarotCard; durFrames?: number }> = ({
  card,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = durFrames ?? 3 * fps;

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
  // yavaş sürekli nefes (statik kalmasın)
  const breathe = 1 + Math.sin(frame * 0.05) * 0.03;

  // İsim kart oturduktan sonra belirir (~1.3s)
  const nameOpacity = interpolate(
    frame,
    [1.3 * fps, 1.8 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Sekans sonunda fade out
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
          transform: `translateY(${cardY}px) scale(${cardScale * breathe}) rotate(${cardRotate}deg)`,
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
export const TarotVideo: React.FC<TarotVideoProps> = ({ card, voiceover }) => {
  const { fps } = useVideoConfig();
  const g = getSegs(voiceover, fps);

  return (
    <AbsoluteFill style={{ background: BG_GRADIENT }}>
      <StarField />
      <BackgroundMusic maxVolume={voiceover ? 0.12 : 0.45} />
      {voiceover && <VoiceTrack vo={voiceover} />}

      {/* Hook */}
      <Sequence durationInFrames={g.hook.dur} layout="none">
        <Hook energy={card.energy} durFrames={g.hook.dur} />
      </Sequence>

      {/* Card reveal */}
      <Sequence from={g.reveal.from} durationInFrames={g.reveal.dur} layout="none">
        <CardReveal card={card} durFrames={g.reveal.dur} />
      </Sequence>

      {/* Meaning 1 */}
      <Sequence from={g.m1.from} durationInFrames={g.m1.dur} layout="none">
        <MeaningCard number="1" title={card.meanings[0].title} desc={card.meanings[0].desc} durFrames={g.m1.dur} />
      </Sequence>

      {/* Meaning 2 */}
      <Sequence from={g.m2.from} durationInFrames={g.m2.dur} layout="none">
        <MeaningCard number="2" title={card.meanings[1].title} desc={card.meanings[1].desc} durFrames={g.m2.dur} />
      </Sequence>

      {/* Meaning 3 */}
      <Sequence from={g.m3.from} durationInFrames={g.m3.dur} layout="none">
        <MeaningCard number="3" title={card.meanings[2].title} desc={card.meanings[2].desc} durFrames={g.m3.dur} />
      </Sequence>

      {/* Question */}
      <Sequence from={g.q.from} durationInFrames={g.q.dur} layout="none">
        <Question
          title={card.questionTitle}
          body={card.questionBody}
          footer={card.questionFooter}
          durFrames={g.q.dur}
        />
      </Sequence>

      {/* Logo CTA */}
      <Sequence from={g.cta.from} durationInFrames={g.cta.dur} layout="none">
        <LogoCta subtitle="AI ile detaylı tarot yorumu" />
      </Sequence>
    </AbsoluteFill>
  );
};
