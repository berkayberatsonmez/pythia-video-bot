import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";

// ─── Star field — kozmik atmosfer ───────────────────────────────────────────
const StarField: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Seeded pseudo-random stars (sabit konum, animasyon delay'i)
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
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );
        // Subtle twinkle
        const twinkle =
          0.7 + Math.sin((frame + i * 10) * 0.05) * 0.3;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              backgroundColor: star.isGold ? "#D4A843" : "#ffffff",
              borderRadius: "50%",
              opacity: opacity * twinkle,
              boxShadow: star.isGold
                ? `0 0 ${star.size * 6}px #D4A843`
                : `0 0 ${star.size * 3}px rgba(255,255,255,0.6)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Hook — "BUGÜN'ÜN ENERJİSİ" (0-2s) ──────────────────────────────────────
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 0.5 * fps, 1.5 * fps, 2 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" },
  );
  const translateY = interpolate(frame, [0, 1 * fps], [30, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 300,
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontFamily: "Georgia, serif",
          color: "#D4A843",
          letterSpacing: 8,
          opacity,
          transform: `translateY(${translateY}px)`,
          textShadow: "0 0 30px rgba(212, 168, 67, 0.6)",
        }}
      >
        BUGÜNÜN ENERJİSİ
      </div>
      {/* Hilal — emoji yerine SVG (CI/Linux render'da güvenli, marka-tutarlı) */}
      <svg
        width={84}
        height={84}
        viewBox="0 0 24 24"
        fill="#D4A843"
        style={{
          marginTop: 30,
          opacity,
          filter: "drop-shadow(0 0 20px rgba(212, 168, 67, 0.6))",
        }}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </AbsoluteFill>
  );
};

// ─── Card reveal — kart aşağıdan uçar, oturur, parıldar ────────────────────
const CardReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring entrance
  const cardSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 1 },
    durationInFrames: 1.5 * fps,
  });

  const cardY = interpolate(cardSpring, [0, 1], [1000, 0]);
  const cardScale = interpolate(cardSpring, [0, 1], [0.4, 1]);
  const cardRotate = interpolate(cardSpring, [0, 1], [-12, 0]);

  // Glow pulse after settling
  const settledFrame = Math.max(0, frame - 1.5 * fps);
  const glow = (Math.sin(settledFrame * 0.1) + 1) * 0.5;

  // Fade out near end of composition (frame 10s onwards, in this sequence)
  const fadeStart = 10 * fps; // since this seq starts at 2s
  const fadeOpacity = interpolate(
    frame,
    [fadeStart, 11 * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
      }}
    >
      <div
        style={{
          transform: `translateY(${cardY}px) scale(${cardScale}) rotate(${cardRotate}deg)`,
          filter: `drop-shadow(0 0 ${30 + glow * 50}px rgba(212, 168, 67, ${
            0.5 + glow * 0.4
          }))`,
          opacity: fadeOpacity,
        }}
      >
        <Img
          src={staticFile("card.webp")}
          style={{
            width: 500,
            height: 833,
            objectFit: "cover",
            borderRadius: 24,
            border: "4px solid #D4A843",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Card name — "YILDIZ" (5-9s) ────────────────────────────────────────────
const CardName: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slide = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 100 },
    durationInFrames: 1 * fps,
  });

  const opacity = interpolate(slide, [0, 1], [0, 1]);
  const translateY = interpolate(slide, [0, 1], [50, 0]);

  // Fade out at end of sequence
  const fadeOpacity = interpolate(
    frame,
    [3 * fps, 4 * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 340,
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          color: "#D4A843",
          letterSpacing: 12,
          textTransform: "uppercase",
          opacity: opacity * fadeOpacity,
          transform: `translateY(${translateY}px)`,
          textShadow: "0 0 50px rgba(212, 168, 67, 0.9)",
        }}
      >
        Yıldız
      </div>
    </AbsoluteFill>
  );
};

// ─── Interpretation — typewriter (9-13s) ────────────────────────────────────
const Interpretation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fullText = "Karanlıktan sonra\nışık geliyor.\nHayallerine güven.";
  const charsPerSecond = 20;
  const totalChars = fullText.length;
  const charsRevealed = Math.min(
    totalChars,
    Math.floor((frame / fps) * charsPerSecond),
  );
  const displayedText = fullText.substring(0, charsRevealed);

  // Cursor blink
  const showCursor = Math.floor(frame / 15) % 2 === 0;

  // Fade out at end
  const fadeOpacity = interpolate(
    frame,
    [3.5 * fps, 4 * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 200,
        paddingLeft: 60,
        paddingRight: 60,
      }}
    >
      <div
        style={{
          fontSize: 62,
          fontFamily: "Georgia, serif",
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.5,
          fontStyle: "italic",
          whiteSpace: "pre-line",
          opacity: fadeOpacity,
          textShadow: "0 0 25px rgba(168, 85, 247, 0.6)",
        }}
      >
        {displayedText}
        {charsRevealed < totalChars && (
          <span
            style={{
              opacity: showCursor ? 1 : 0,
              color: "#D4A843",
              marginLeft: 4,
            }}
          >
            |
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─── Logo + CTA — closing (13-15s) ──────────────────────────────────────────
const LogoCta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
    durationInFrames: 1 * fps,
  });

  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.5, 1]);

  // Subtle glow pulse on logo
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
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
            style={{
              width: 280,
              height: 280,
              borderRadius: 70,
            }}
          />
        </div>
        <div
          style={{
            fontSize: 96,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#D4A843",
            marginTop: 40,
            letterSpacing: 14,
            textShadow: "0 0 30px rgba(212, 168, 67, 0.8)",
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
          AI mistik yolculuğun
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#D4A843",
            marginTop: 30,
            padding: "12px 32px",
            border: "2px solid #D4A843",
            borderRadius: 999,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          App Store · Google Play
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Composition — 15 saniye Tarot Reveal
// ═══════════════════════════════════════════════════════════════════════════

export const TarotReveal: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #09071A 0%, #1a0a2e 50%, #2a1845 100%)",
      }}
    >
      {/* Yıldızlar — sürekli görünür */}
      <StarField />

      {/* [0-2s] Hook */}
      <Sequence durationInFrames={2 * fps} layout="none">
        <Hook />
      </Sequence>

      {/* [2-13s] Kart belirir ve durur */}
      <Sequence from={2 * fps} durationInFrames={11 * fps} layout="none">
        <CardReveal />
      </Sequence>

      {/* [5-9s] Kart adı */}
      <Sequence from={5 * fps} durationInFrames={4 * fps} layout="none">
        <CardName />
      </Sequence>

      {/* [9-13s] Yorum typewriter */}
      <Sequence from={9 * fps} durationInFrames={4 * fps} layout="none">
        <Interpretation />
      </Sequence>

      {/* [13-15s] Logo + CTA */}
      <Sequence from={13 * fps} durationInFrames={2 * fps} layout="none">
        <LogoCta />
      </Sequence>
    </AbsoluteFill>
  );
};
