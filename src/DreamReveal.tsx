import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const GOLD = "#D4A843";
const DREAM_BLUE = "#9ec5ff";

// ─── Hilal SVG (marka — emoji yerine) ───────────────────────────────────────
const Moon: React.FC<{ size?: number }> = ({ size = 84 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={GOLD}
    style={{ filter: "drop-shadow(0 0 22px rgba(212, 168, 67, 0.65))" }}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// ─── Su damlası SVG (rüya sembolü) ──────────────────────────────────────────
const WaterDrop: React.FC<{ size?: number }> = ({ size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={DREAM_BLUE}>
    <path d="M12 2.5C12 2.5 19 10.7 19 14.9A7 7 0 0 1 5 14.9C5 10.7 12 2.5 12 2.5z" />
    <ellipse cx="9.4" cy="14.2" rx="1.5" ry="2.3" fill="rgba(255,255,255,0.55)" />
  </svg>
);

// ─── Yıldız alanı ───────────────────────────────────────────────────────────
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
    for (let i = 0; i < 90; i++) {
      arr.push({
        x: (i * 137) % 100,
        y: (i * 61) % 100,
        size: 1 + (i % 4),
        delay: (i * 0.4) % 30,
        isGold: i % 9 === 0,
      });
    }
    return arr;
  }, []);

  return (
    <AbsoluteFill>
      {stars.map((star, i) => {
        const base = interpolate(
          frame,
          [star.delay, star.delay + fps],
          [0, star.isGold ? 1 : 0.65],
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
              opacity: base * twinkle,
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

// ─── Rüya parçacıkları — yukarı süzülen yumuşak küreler ─────────────────────
const DreamParticles: React.FC = () => {
  const frame = useCurrentFrame();

  const particles = React.useMemo(() => {
    const arr: Array<{
      x: number;
      size: number;
      phase: number;
      speed: number;
      isBlue: boolean;
    }> = [];
    for (let i = 0; i < 14; i++) {
      arr.push({
        x: (i * 53) % 100,
        size: 18 + ((i * 13) % 46),
        phase: (i * 37) % 130,
        speed: 0.05 + (i % 5) * 0.014,
        isBlue: i % 3 === 0,
      });
    }
    return arr;
  }, []);

  return (
    <AbsoluteFill>
      {particles.map((p, i) => {
        const progress = ((frame * p.speed + p.phase) % 130) / 130;
        const y = interpolate(progress, [0, 1], [112, -12]);
        const sway = Math.sin((frame + p.phase) * 0.02) * 5;
        const opacity = Math.sin(progress * Math.PI) * 0.45;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(${p.x}% + ${sway}px)`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.isBlue
                ? "radial-gradient(circle, rgba(158,197,255,0.5), transparent 70%)"
                : "radial-gradient(circle, rgba(212,168,67,0.42), transparent 70%)",
              filter: "blur(2px)",
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── [0-2.5s] Hook ──────────────────────────────────────────────────────────
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 0.5 * fps, 2 * fps, 2.5 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" },
  );
  const translateY = interpolate(frame, [0, 1 * fps], [40, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const moonSpring = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.9 },
    durationInFrames: 1 * fps,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${interpolate(moonSpring, [0, 1], [0.6, 1])})`,
        }}
      >
        <Moon size={110} />
      </div>
      <div
        style={{
          fontSize: 64,
          fontFamily: "Georgia, serif",
          color: GOLD,
          letterSpacing: 6,
          lineHeight: 1.25,
          textAlign: "center",
          opacity,
          transform: `translateY(${translateY}px)`,
          textShadow: "0 0 30px rgba(212, 168, 67, 0.6)",
        }}
      >
        BU GECE
        <br />
        NE GÖRDÜN?
      </div>
    </AbsoluteFill>
  );
};

// ─── [2.5-6.5s] Rüya — daktilo (kullanıcı girişi) ───────────────────────────
const DreamText: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fullText = "“Berrak bir nehirde\nyüzüyordum, sular\nışıl ışıldı...”";
  const charsPerSecond = 22;
  const totalChars = fullText.length;
  const revealed = Math.min(
    totalChars,
    Math.floor((frame / fps) * charsPerSecond),
  );
  const displayed = fullText.substring(0, revealed);
  const showCursor = Math.floor(frame / 15) % 2 === 0;

  const labelOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [3.4 * fps, 4 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        paddingLeft: 70,
        paddingRight: 70,
      }}
    >
      <div
        style={{
          fontSize: 30,
          fontFamily: "Georgia, serif",
          color: GOLD,
          letterSpacing: 12,
          marginBottom: 44,
          opacity: labelOpacity * fadeOut,
        }}
      >
        RÜYAN
      </div>
      <div
        style={{
          fontSize: 56,
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.5,
          whiteSpace: "pre-line",
          opacity: fadeOut,
          textShadow: "0 0 25px rgba(158, 197, 255, 0.4)",
        }}
      >
        {displayed}
        {revealed < totalChars && (
          <span style={{ color: GOLD, opacity: showCursor ? 1 : 0 }}>|</span>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─── [6.3-7.9s] Geçiş — "Pythia yorumluyor" ─────────────────────────────────
const Interpreting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dur = 1.3 * fps;
  const ring = interpolate(frame, [0, dur], [0, 1], {
    extrapolateRight: "clamp",
  });
  const ringScale = interpolate(ring, [0, 1], [0.2, 2.4]);
  const ringOpacity = interpolate(ring, [0, 0.3, 1], [0, 0.55, 0]);
  const textOpacity = interpolate(
    frame,
    [0.15 * fps, 0.45 * fps, dur - 8, dur],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" },
  );
  const dots = ".".repeat((Math.floor(frame / 8) % 3) + 1);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: `2px solid ${GOLD}`,
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
          boxShadow: `0 0 60px ${GOLD}`,
        }}
      />
      <div
        style={{
          fontSize: 42,
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          color: GOLD,
          letterSpacing: 3,
          opacity: textOpacity,
          textShadow: "0 0 30px rgba(212, 168, 67, 0.7)",
        }}
      >
        Pythia yorumluyor{dots}
      </div>
    </AbsoluteFill>
  );
};

// ─── [7.5-12.5s] Yorum reveal — sembol + kademeli satırlar ──────────────────
const Interpretation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const symbolSpring = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 90 },
    durationInFrames: 1 * fps,
  });
  const symbolScale = interpolate(symbolSpring, [0, 1], [0.3, 1]);
  const symbolOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headlineSpring = spring({
    frame: frame - 0.5 * fps,
    fps,
    config: { damping: 16, stiffness: 100 },
    durationInFrames: 1 * fps,
  });
  const headlineOpacity = interpolate(headlineSpring, [0, 1], [0, 1]);
  const headlineY = interpolate(headlineSpring, [0, 1], [40, 0]);

  const lines = ["Berrak su, içsel bir", "arınmanın işareti —", "duygularına güven."];

  const fadeOut = interpolate(frame, [4.4 * fps, 5 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        paddingLeft: 70,
        paddingRight: 70,
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          transform: `scale(${symbolScale})`,
          opacity: symbolOpacity,
          filter: "drop-shadow(0 0 42px rgba(158, 197, 255, 0.7))",
          marginBottom: 32,
        }}
      >
        <WaterDrop size={130} />
      </div>
      <div
        style={{
          fontSize: 66,
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          color: GOLD,
          letterSpacing: 6,
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          textShadow: "0 0 40px rgba(212, 168, 67, 0.8)",
          marginBottom: 38,
          textAlign: "center",
        }}
      >
        SU — DUYGULAR
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        {lines.map((ln, i) => {
          const delay = 1.4 * fps + i * 0.35 * fps;
          const lo = interpolate(frame, [delay, delay + 0.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const ly = interpolate(frame, [delay, delay + 0.5 * fps], [24, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          return (
            <div
              key={i}
              style={{
                fontSize: 52,
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                color: "#ffffff",
                textAlign: "center",
                lineHeight: 1.45,
                opacity: lo,
                transform: `translateY(${ly}px)`,
                textShadow: "0 0 20px rgba(158, 197, 255, 0.4)",
              }}
            >
              {ln}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── [12.5-15s] Logo + CTA ──────────────────────────────────────────────────
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
            fontSize: 92,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            marginTop: 36,
            letterSpacing: 14,
            textShadow: "0 0 30px rgba(212, 168, 67, 0.8)",
          }}
        >
          PYTHIA
        </div>
        <div
          style={{
            fontSize: 38,
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            color: "rgba(255, 255, 255, 0.85)",
            marginTop: 18,
            letterSpacing: 1,
            textAlign: "center",
          }}
        >
          Rüyanı yaz, anlamını keşfet
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
// Main — 15 saniye Rüya Yorumu Reveal
// ═══════════════════════════════════════════════════════════════════════════

export const DreamReveal: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #0a0820 0%, #150f38 50%, #241640 100%)",
      }}
    >
      <StarField />
      <DreamParticles />
      {/* Vignette — derinlik */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 42%, transparent 32%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      <Sequence durationInFrames={f(2.5)} layout="none">
        <Hook />
      </Sequence>

      <Sequence from={f(2.5)} durationInFrames={f(4)} layout="none">
        <DreamText />
      </Sequence>

      <Sequence from={f(6.3)} durationInFrames={f(1.6)} layout="none">
        <Interpreting />
      </Sequence>

      <Sequence from={f(7.5)} durationInFrames={f(5)} layout="none">
        <Interpretation />
      </Sequence>

      <Sequence from={f(12.5)} durationInFrames={f(2.5)} layout="none">
        <LogoCta />
      </Sequence>
    </AbsoluteFill>
  );
};
