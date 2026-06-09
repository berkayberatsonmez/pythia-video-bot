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
const IVORY = "#F8F0DA";

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

// ─── Hook — "RÜYANDA DİŞİN DÜŞTÜĞÜNÜ GÖRDÜYSEN" (0-2.5s) ──────────────────
const Hook: React.FC = () => {
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
            fontSize: 110,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 4,
            textShadow: `0 0 50px ${GOLD}, 0 0 100px rgba(212, 168, 67, 0.5)`,
            lineHeight: 1.1,
          }}
        >
          DİŞİN
          <br />
          DÜŞTÜĞÜNÜ
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

// ─── Tooth SVG — stylized ───────────────────────────────────────────────────
const ToothIcon: React.FC<{ size?: number }> = ({ size = 340 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill={IVORY}
    stroke={GOLD}
    strokeWidth="2.5"
    strokeLinejoin="round"
  >
    {/* Tooth body — molar shape */}
    <path
      d="M30 18 C25 18, 20 22, 20 30
         L20 50
         C20 55, 22 60, 25 65
         L28 78
         C28 84, 32 86, 35 82
         L37 70
         C38 65, 42 65, 43 70
         L46 82
         C49 86, 53 84, 53 78
         L56 65
         C59 60, 62 55, 62 50
         L62 42
         C62 36, 68 32, 70 28
         C72 22, 70 18, 65 18
         Z"
    />
    {/* Crown highlight */}
    <path
      d="M30 24 C28 26, 26 30, 26 35"
      fill="none"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="2"
    />
    {/* Crack/glow line */}
    <path
      d="M40 30 L42 50"
      fill="none"
      stroke={GOLD}
      strokeWidth="1.2"
      opacity="0.5"
    />
  </svg>
);

// ─── Tooth reveal — diş düşme animasyonu (2.5-5s) ──────────────────────────
const ToothReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Initial appear from above + slight fall
  const appearSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
    durationInFrames: 1 * fps,
  });

  const toothY = interpolate(appearSpring, [0, 1], [-200, 0]);
  const scale = interpolate(appearSpring, [0, 1], [0.4, 1]);
  const opacity = interpolate(appearSpring, [0, 1], [0, 1]);

  // After settling, slow rotation (tooth wobbling)
  const settledFrame = Math.max(0, frame - 1 * fps);
  const wobble = Math.sin(settledFrame * 0.08) * 8;

  // Glow pulse
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;

  // Fade out near end of sequence
  const fadeOut = interpolate(
    frame,
    [2 * fps, 2.5 * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity: opacity * fadeOut,
          transform: `translateY(${toothY}px) scale(${scale}) rotate(${wobble}deg)`,
          filter: `drop-shadow(0 0 ${40 + glow * 50}px rgba(212, 168, 67, ${
            0.6 + glow * 0.4
          }))`,
        }}
      >
        <ToothIcon size={340} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Meaning card — 3 anlam katmanı ─────────────────────────────────────────
type Meaning = { number: string; title: string; desc: string };

const MEANINGS: Meaning[] = [
  {
    number: "1",
    title: "KAYIP / DEĞİŞİM",
    desc: "Hayatında bir dönem kapanıyor.\nKayıp gibi gözüken şey,\naslında bırakman gereken.",
  },
  {
    number: "2",
    title: "KONTROL KAYBI",
    desc: "Bilinçaltında bir kaygı var.\nGüç veya kontrolü kaybetme\nkorkusu seninle konuşuyor.",
  },
  {
    number: "3",
    title: "YENİLENME",
    desc: "Süt dişi gider, yenisi gelir.\nEski sen kabuk değiştiriyor,\nyeni bir başlangıç yaklaşıyor.",
  },
];

const MeaningCard: React.FC<{ meaning: Meaning }> = ({ meaning }) => {
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
        <div
          style={{
            fontSize: 72,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 4,
            marginBottom: 40,
            textShadow: `0 0 30px rgba(168, 85, 247, 0.6)`,
          }}
        >
          {meaning.title}
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
          {meaning.desc}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Question — engagement prompt ───────────────────────────────────────────
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
          PEKİ SENİN DİŞİN...
        </div>
        <div
          style={{
            fontSize: 64,
            fontFamily: "Georgia, serif",
            color: "#ffffff",
            fontWeight: 700,
            lineHeight: 1.3,
            textShadow: `0 0 30px ${GOLD}`,
          }}
        >
          kanlı mıydı,
          <br />
          yoksa temiz mi düştü?
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
          cevap, anlamı tamamen değiştiriyor
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Logo + CTA — closing ───────────────────────────────────────────────────
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
// Main — 15 saniye Teeth Dream Interpretation
// ═══════════════════════════════════════════════════════════════════════════

export const TeethDream: React.FC = () => {
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

      {/* [2.5-5s] Tooth reveal */}
      <Sequence from={2.5 * fps} durationInFrames={2.5 * fps} layout="none">
        <ToothReveal />
      </Sequence>

      {/* [5-7.3s] Meaning 1: KAYIP / DEĞİŞİM */}
      <Sequence from={5 * fps} durationInFrames={2.3 * fps} layout="none">
        <MeaningCard meaning={MEANINGS[0]} />
      </Sequence>

      {/* [7.3-9.6s] Meaning 2: KONTROL KAYBI */}
      <Sequence from={7.3 * fps} durationInFrames={2.3 * fps} layout="none">
        <MeaningCard meaning={MEANINGS[1]} />
      </Sequence>

      {/* [9.6-11.9s] Meaning 3: YENİLENME */}
      <Sequence from={9.6 * fps} durationInFrames={2.3 * fps} layout="none">
        <MeaningCard meaning={MEANINGS[2]} />
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
