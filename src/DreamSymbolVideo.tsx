import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Img,
} from "remotion";
import type { DreamSymbol } from "./data/dream-symbols";
import { SymbolIcon } from "./components/SymbolIcon";
import { BackgroundMusic } from "./components/shared";
import { type Voiceover, getSegs, VoiceTrack } from "./components/voiceover";

const GOLD = "#D4A843";

// ═══════════════════════════════════════════════════════════════════════════
// Parametreleştirilmiş "Rüyanda X Gördüysen" video şablonu
//
// Props ile her sembol için kullanılır. Render etmek için:
//   npx remotion render src/index.ts DreamSymbolVideo out/video.mp4 \
//     --props='{"symbolId":"snake"}'
// ═══════════════════════════════════════════════════════════════════════════

export type DreamSymbolVideoProps = {
  symbol: DreamSymbol;
  voiceover?: Voiceover;
};

// ─── Star field ──────────────────────────────────────────────────────────
const StarField: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stars = React.useMemo(() => {
    const arr: Array<{
      x: number;
      y: number;
      size: number;
      delay: number;
      isGold: boolean;
    }> = [];
    for (let i = 0; i < 100; i++) {
      arr.push({
        x: (i * 137) % 100,
        y: (i * 67) % 100,
        size: 1 + (i % 4),
        delay: (i * 0.3) % 30,
        isGold: i % 8 === 0,
      });
    }
    return arr;
  }, []);

  return (
    <AbsoluteFill>
      {stars.map((star, i) => {
        const opacity = interpolate(
          frame,
          [star.delay, star.delay + fps],
          [0, star.isGold ? 1 : 0.7],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const twinkle = 0.7 + Math.sin((frame + i * 10) * 0.05) * 0.3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              backgroundColor: star.isGold ? GOLD : "#ffffff",
              borderRadius: "50%",
              opacity: opacity * twinkle,
              boxShadow: star.isGold
                ? `0 0 ${star.size * 6}px ${GOLD}`
                : `0 0 ${star.size * 3}px rgba(255,255,255,0.6)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Hook — "RÜYANDA X GÖRDÜYSEN" ────────────────────────────────────────
const Hook: React.FC<{ symbolUpper: string; durFrames?: number }> = ({
  symbolUpper,
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

  // Multi-line symbol name — eg "DİŞİN\nDÜŞTÜĞÜNÜ"
  const hasMultipleLines = symbolUpper.includes("\n");
  const fontSize = hasMultipleLines ? 100 : 140;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity,
          transform: `scale(${scale}) translateY(${drift}px)`,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 6,
            marginBottom: 24,
          }}
        >
          RÜYANDA
        </div>
        <div
          style={{
            fontSize,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 4,
            textShadow: `0 0 50px ${GOLD}, 0 0 100px rgba(212, 168, 67, 0.5)`,
            lineHeight: 1.1,
            whiteSpace: "pre-line",
          }}
        >
          {symbolUpper}
        </div>
        <div
          style={{
            fontSize: 44,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 6,
            marginTop: 24,
          }}
        >
          GÖRDÜYSEN...
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Symbol reveal — büyük ikon, glow, animasyon ─────────────────────────
const SymbolReveal: React.FC<{ symbol: DreamSymbol; durFrames?: number }> = ({
  symbol,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = durFrames ?? 2.5 * fps;

  const appearSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
    durationInFrames: 1.2 * fps,
  });

  const scale = interpolate(appearSpring, [0, 1], [0.3, 1]);
  const rotate = interpolate(appearSpring, [0, 1], [-15, 0]);
  const opacity = interpolate(appearSpring, [0, 1], [0, 1]);

  // Glow pulse after settling
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;
  // yavaş sürekli nefes (statik kalmasın)
  const breathe = 1 + Math.sin(frame * 0.05) * 0.03;

  const fadeOut = interpolate(frame, [d - 0.5 * fps, d], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity: opacity * fadeOut,
          transform: `scale(${scale * breathe}) rotate(${rotate}deg)`,
          filter: `drop-shadow(0 0 ${40 + glow * 50}px rgba(212, 168, 67, ${
            0.6 + glow * 0.4
          }))`,
        }}
      >
        <SymbolIcon type={symbol.iconType} size={380} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Meaning card ────────────────────────────────────────────────────────
const MeaningCard: React.FC<{
  number: string;
  title: string;
  desc: string;
  durFrames?: number;
}> = ({ number, title, desc, durFrames }) => {
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
  const translateY = interpolate(enter, [0, 1], [60, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 200,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            lineHeight: 1,
            textShadow: `0 0 40px ${GOLD}`,
            marginBottom: 20,
          }}
        >
          {number}
        </div>
        <div
          style={{
            fontSize: title.length > 12 ? 60 : 76,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 4,
            marginBottom: 40,
            textShadow: `0 0 30px rgba(168, 85, 247, 0.6)`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 42,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.5,
            fontStyle: "italic",
            whiteSpace: "pre-line",
          }}
        >
          {desc}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Question — engagement prompt ─────────────────────────────────────────
const Question: React.FC<{
  title: string;
  body: string;
  footer: string;
  durFrames?: number;
}> = ({ title, body, footer, durFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const holdEnd = durFrames ? durFrames - 0.4 * fps : 1.1 * fps;
  const end = durFrames ? durFrames : 1.5 * fps;
  const opacity = interpolate(
    frame,
    [0, 0.4 * fps, holdEnd, end],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}
    >
      <div style={{ opacity, textAlign: "center" }}>
        <div
          style={{
            fontSize: 50,
            fontFamily: "Georgia, serif",
            color: GOLD,
            fontWeight: 700,
            marginBottom: 30,
            letterSpacing: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 64,
            fontFamily: "Georgia, serif",
            color: "#ffffff",
            fontWeight: 700,
            lineHeight: 1.3,
            textShadow: `0 0 30px ${GOLD}`,
            whiteSpace: "pre-line",
          }}
        >
          {body}
        </div>
        <div
          style={{
            fontSize: 32,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.7)",
            fontStyle: "italic",
            marginTop: 40,
          }}
        >
          {footer}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Logo + CTA ──────────────────────────────────────────────────────────
const LogoCta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
    durationInFrames: 0.8 * fps,
  });

  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.5, 1]);
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            filter: `drop-shadow(0 0 ${40 + glow * 30}px rgba(168, 85, 247, ${
              0.6 + glow * 0.3
            }))`,
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{ width: 260, height: 260, borderRadius: 65 }}
          />
        </div>
        <div
          style={{
            fontSize: 96,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            marginTop: 36,
            letterSpacing: 14,
            textShadow: `0 0 30px ${GOLD}`,
          }}
        >
          PYTHIA
        </div>
        <div
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.8)",
            marginTop: 16,
            fontStyle: "italic",
            letterSpacing: 2,
          }}
        >
          AI ile detaylı rüya tabiri
        </div>
        <div
          style={{
            fontSize: 28,
            color: GOLD,
            marginTop: 30,
            padding: "12px 32px",
            border: `2px solid ${GOLD}`,
            borderRadius: 999,
            letterSpacing: 3,
          }}
        >
          ÜCRETSİZ DENE
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Ana composition — symbol prop'una göre tüm video parametrelenir
// ═══════════════════════════════════════════════════════════════════════════

export const DreamSymbolVideo: React.FC<DreamSymbolVideoProps> = ({
  symbol,
  voiceover,
}) => {
  const { fps } = useVideoConfig();
  const g = getSegs(voiceover, fps);

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #09071A 0%, #1a0a2e 50%, #2a1845 100%)",
      }}
    >
      <StarField />
      <BackgroundMusic maxVolume={voiceover ? 0.12 : 0.45} />
      {voiceover && <VoiceTrack vo={voiceover} />}

      {/* Hook */}
      <Sequence durationInFrames={g.hook.dur} layout="none">
        <Hook symbolUpper={symbol.symbolNameUpper} durFrames={g.hook.dur} />
      </Sequence>

      {/* Symbol reveal */}
      <Sequence from={g.reveal.from} durationInFrames={g.reveal.dur} layout="none">
        <SymbolReveal symbol={symbol} durFrames={g.reveal.dur} />
      </Sequence>

      {/* Meaning 1 */}
      <Sequence from={g.m1.from} durationInFrames={g.m1.dur} layout="none">
        <MeaningCard
          number="1"
          title={symbol.meanings[0].title}
          desc={symbol.meanings[0].desc}
          durFrames={g.m1.dur}
        />
      </Sequence>

      {/* Meaning 2 */}
      <Sequence from={g.m2.from} durationInFrames={g.m2.dur} layout="none">
        <MeaningCard
          number="2"
          title={symbol.meanings[1].title}
          desc={symbol.meanings[1].desc}
          durFrames={g.m2.dur}
        />
      </Sequence>

      {/* Meaning 3 */}
      <Sequence from={g.m3.from} durationInFrames={g.m3.dur} layout="none">
        <MeaningCard
          number="3"
          title={symbol.meanings[2].title}
          desc={symbol.meanings[2].desc}
          durFrames={g.m3.dur}
        />
      </Sequence>

      {/* Question */}
      <Sequence from={g.q.from} durationInFrames={g.q.dur} layout="none">
        <Question
          title={symbol.questionTitle}
          body={symbol.questionBody}
          footer={symbol.questionFooter}
          durFrames={g.q.dur}
        />
      </Sequence>

      {/* Logo + CTA */}
      <Sequence from={g.cta.from} durationInFrames={g.cta.dur} layout="none">
        <LogoCta />
      </Sequence>
    </AbsoluteFill>
  );
};
