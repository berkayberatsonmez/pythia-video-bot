import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const GOLD = "#D4A843";
export const PURPLE = "#a855f7";
export const BG_GRADIENT =
  "linear-gradient(180deg, #09071A 0%, #1a0a2e 50%, #2a1845 100%)";

// ═══════════════════════════════════════════════════════════════════════════
// BackgroundMusic — telifsiz mistik müzik (tüm videolarda ortak)
// Başta fade-in, sonda fade-out. public/music.mp3
// ═══════════════════════════════════════════════════════════════════════════
export const BackgroundMusic: React.FC<{ maxVolume?: number }> = ({
  maxVolume = 0.45,
}) => {
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <Audio
      src={staticFile("music.mp3")}
      volume={(f) =>
        interpolate(
          f,
          [
            0,
            Math.round(0.6 * fps),
            durationInFrames - Math.round(1.2 * fps),
            durationInFrames,
          ],
          [0, maxVolume, maxVolume, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      }
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// StarField — kozmik yıldız arka planı (tüm kategorilerde ortak)
// ═══════════════════════════════════════════════════════════════════════════
export const StarField: React.FC = () => {
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

// ═══════════════════════════════════════════════════════════════════════════
// MeaningCard — numaralı 3 anlam kartı (tüm kategoriler)
// ═══════════════════════════════════════════════════════════════════════════
export const MeaningCard: React.FC<{
  number: string;
  title: string;
  desc: string;
  durFrames?: number; // sesli modda segment süresi (verilirse sona göre fade)
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
      style={{ justifyContent: "center", alignItems: "center", padding: "0 80px" }}
    >
      <div style={{ opacity, transform: `translateY(${translateY}px)`, textAlign: "center" }}>
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

// ═══════════════════════════════════════════════════════════════════════════
// Question — engagement sorusu (tüm kategoriler)
// ═══════════════════════════════════════════════════════════════════════════
export const Question: React.FC<{
  title: string;
  body: string;
  footer: string;
  durFrames?: number; // sesli modda segment süresi
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

// ═══════════════════════════════════════════════════════════════════════════
// LogoCta — Pythia logo + CTA (tüm kategoriler ortak kapanış)
// ═══════════════════════════════════════════════════════════════════════════
export const LogoCta: React.FC<{ subtitle?: string }> = ({
  subtitle = "AI ile detaylı mistik yorum",
}) => {
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
  const bounce = Math.sin(frame * 0.2) * 8; // CTA "indir" oku zıplatma

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
          {subtitle}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "#0e0a1f",
            backgroundColor: GOLD,
            marginTop: 28,
            padding: "14px 40px",
            borderRadius: 999,
            letterSpacing: 2,
            boxShadow: `0 0 ${24 + glow * 24}px ${GOLD}`,
          }}
        >
          🔮 ÜCRETSİZ İNDİR
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#ffffff",
            marginTop: 22,
            fontFamily: "Georgia, serif",
            letterSpacing: 1,
            transform: `translateY(${bounce}px)`,
            textShadow: "0 0 20px rgba(168,85,247,0.7)",
          }}
        >
          👇 Profildeki linke dokun
        </div>
      </div>
    </AbsoluteFill>
  );
};
