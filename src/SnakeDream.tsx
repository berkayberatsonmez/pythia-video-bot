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

const GOLD = "#D4A843";

// ─── Star field — kozmik atmosfer ───────────────────────────────────────────
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

// ─── Hook — "RÜYANDA YILAN GÖRDÜYSEN" (0-2.5s) ─────────────────────────────
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 0.4 * fps, 2 * fps, 2.5 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" },
  );

  // Dramatic scale-in
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 0.5 * fps,
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 6,
            marginBottom: 20,
          }}
        >
          RÜYANDA
        </div>
        <div
          style={{
            fontSize: 140,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 8,
            textShadow: `0 0 50px ${GOLD}, 0 0 100px rgba(212, 168, 67, 0.5)`,
            lineHeight: 1,
          }}
        >
          YILAN
        </div>
        <div
          style={{
            fontSize: 48,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 6,
            marginTop: 20,
          }}
        >
          GÖRDÜYSEN...
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Snake reveal — büyük altın yılan SVG (2.5-5s) ─────────────────────────
const SnakeIcon: React.FC<{ size?: number }> = ({ size = 380 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke={GOLD}
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Stylized serpent — coiled body */}
    <path
      d="M50 12 C35 12, 22 22, 22 38 C22 50, 35 55, 50 55 C65 55, 78 50, 78 62 C78 75, 65 82, 50 82 C40 82, 32 78, 28 72"
      fill="none"
    />
    {/* Snake head */}
    <ellipse cx="50" cy="12" rx="9" ry="6" fill={GOLD} stroke="none" />
    {/* Eye */}
    <circle cx="53" cy="11" r="1.5" fill="#09071A" />
    {/* Forked tongue */}
    <path d="M58 12 L64 10 M58 12 L64 14" strokeWidth="2" />
    {/* Tail tip */}
    <path d="M28 72 L24 78 L20 75" fill="none" strokeWidth="3" />
    {/* Scale pattern marks */}
    <path d="M30 30 L35 32 M40 25 L45 27 M55 40 L60 42 M65 50 L70 52"
          strokeWidth="2" opacity="0.6" />
  </svg>
);

const SnakeReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Snake slithers in with rotation
  const snakeSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
    durationInFrames: 1.2 * fps,
  });

  const scale = interpolate(snakeSpring, [0, 1], [0.2, 1]);
  const rotate = interpolate(snakeSpring, [0, 1], [-30, 0]);
  const opacity = interpolate(snakeSpring, [0, 1], [0, 1]);

  // Glow pulse
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;

  // Fade out near end (sequence is 2.5s long, fade in last 0.5s)
  const fadeOut = interpolate(
    frame,
    [2 * fps, 2.5 * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      <div
        style={{
          opacity: opacity * fadeOut,
          transform: `scale(${scale}) rotate(${rotate}deg)`,
          filter: `drop-shadow(0 0 ${40 + glow * 50}px rgba(212, 168, 67, ${
            0.6 + glow * 0.4
          }))`,
        }}
      >
        <SnakeIcon size={380} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Meaning card — 3 anlam katmanı (5-12s) ────────────────────────────────
type Meaning = { number: string; title: string; desc: string };

const MEANINGS: Meaning[] = [
  {
    number: "1",
    title: "DÖNÜŞÜM",
    desc: "Eski benliğinden ayrılıyorsun.\nYılan kabuğunu değiştirir,\nsen de değişiyorsun.",
  },
  {
    number: "2",
    title: "GİZLİ KORKU",
    desc: "Yüzleşmediğin bir şey var.\nBilinçaltın o şeyi sembolize\nediyor — görmek istiyor.",
  },
  {
    number: "3",
    title: "ŞİFA",
    desc: "Kadim bilgelik, tıp sembolü.\nİyileşme süreci başladı,\nsabırlı ol.",
  },
];

const MeaningCard: React.FC<{ meaning: Meaning; index: number }> = ({
  meaning,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
    durationInFrames: 0.6 * fps,
  });

  const exitFade = interpolate(
    frame,
    [2 * fps, 2.3 * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

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
        {/* Big gold number */}
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
          {meaning.number}
        </div>
        {/* Title */}
        <div
          style={{
            fontSize: 86,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 8,
            marginBottom: 40,
            textShadow: `0 0 30px rgba(168, 85, 247, 0.6)`,
          }}
        >
          {meaning.title}
        </div>
        {/* Description */}
        <div
          style={{
            fontSize: 44,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.5,
            fontStyle: "italic",
            whiteSpace: "pre-line",
          }}
        >
          {meaning.desc}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Question — engagement prompt (12-13.5s) ───────────────────────────────
const Question: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 0.4 * fps, 1.1 * fps, 1.5 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}
    >
      <div
        style={{
          opacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontFamily: "Georgia, serif",
            color: GOLD,
            fontWeight: 700,
            marginBottom: 30,
            letterSpacing: 4,
          }}
        >
          PEKİ SENİN YILANIN
        </div>
        <div
          style={{
            fontSize: 72,
            fontFamily: "Georgia, serif",
            color: "#ffffff",
            fontWeight: 700,
            lineHeight: 1.3,
            textShadow: `0 0 30px ${GOLD}`,
          }}
        >
          saldırgan mıydı,
          <br />
          yoksa sakin mi?
        </div>
        <div
          style={{
            fontSize: 36,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.7)",
            fontStyle: "italic",
            marginTop: 40,
          }}
        >
          yorumlara yaz, yorumlayalım
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Logo + CTA — closing (13.5-15s) ────────────────────────────────────────
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
// Main — 15 saniye Snake Dream Interpretation
// ═══════════════════════════════════════════════════════════════════════════

export const SnakeDream: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #09071A 0%, #1a0a2e 50%, #2a1845 100%)",
      }}
    >
      <StarField />

      {/* [0-2.5s] Hook */}
      <Sequence durationInFrames={2.5 * fps} layout="none">
        <Hook />
      </Sequence>

      {/* [2.5-5s] Snake reveal */}
      <Sequence from={2.5 * fps} durationInFrames={2.5 * fps} layout="none">
        <SnakeReveal />
      </Sequence>

      {/* [5-7.3s] Meaning 1: DÖNÜŞÜM */}
      <Sequence from={5 * fps} durationInFrames={2.3 * fps} layout="none">
        <MeaningCard meaning={MEANINGS[0]} index={0} />
      </Sequence>

      {/* [7.3-9.6s] Meaning 2: GİZLİ KORKU */}
      <Sequence from={7.3 * fps} durationInFrames={2.3 * fps} layout="none">
        <MeaningCard meaning={MEANINGS[1]} index={1} />
      </Sequence>

      {/* [9.6-11.9s] Meaning 3: ŞİFA */}
      <Sequence from={9.6 * fps} durationInFrames={2.3 * fps} layout="none">
        <MeaningCard meaning={MEANINGS[2]} index={2} />
      </Sequence>

      {/* [11.9-13.4s] Question */}
      <Sequence from={11.9 * fps} durationInFrames={1.5 * fps} layout="none">
        <Question />
      </Sequence>

      {/* [13.4-15s] Logo + CTA */}
      <Sequence from={13.4 * fps} durationInFrames={1.6 * fps} layout="none">
        <LogoCta />
      </Sequence>
    </AbsoluteFill>
  );
};
