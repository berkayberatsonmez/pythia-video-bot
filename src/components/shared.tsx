import React from "react";
import {
  AbsoluteFill,
  Audio,
  getInputProps,
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
// Tema (görsel çeşitlilik) — render-rotation `theme` prop'unu (0-3) geçirir;
// scripts/variety.ts gün+slottan deterministik seçer. Prop verilmezse 0 =
// eski StarField görünümü (Studio önizleme ve TikTok yolu değişmez).
// getInputProps: tüm kompozisyon sarmalayıcılarına tek tek prop taşımamak için.
// ═══════════════════════════════════════════════════════════════════════════
export const THEME_COUNT = 4;
const MUSIC_START_SEC = [0, 38, 76, 114];
const MUSIC_RATE = [1, 0.97, 1.03, 0.99];
export function useThemeIndex(): number {
  let t = 0;
  try {
    const v = Number((getInputProps() as { theme?: unknown }).theme);
    if (Number.isInteger(v) && v >= 0 && v < THEME_COUNT) t = v;
  } catch {
    /* Studio dışı/boş girdi → 0 */
  }
  return t;
}

// ═══════════════════════════════════════════════════════════════════════════
// BackgroundMusic — telifsiz mistik müzik (tüm videolarda ortak)
// Başta fade-in, sonda fade-out. public/music.mp3
// ═══════════════════════════════════════════════════════════════════════════
export const BackgroundMusic: React.FC<{ maxVolume?: number }> = ({
  maxVolume = 0.45,
}) => {
  const { durationInFrames, fps } = useVideoConfig();
  // Tek parça var → hafif çeşitleme: temaya göre BAŞLANGIÇ ofseti (+ hafif hız).
  // Ofsetler parçanın (174 sn) içinde kalır: en uzun video ~45 sn → 114+50 < 174.
  const t = useThemeIndex();
  const startSec = MUSIC_START_SEC[t];
  return (
    <Audio
      src={staticFile("music.mp3")}
      trimBefore={Math.round(startSec * fps)}
      playbackRate={MUSIC_RATE[t]}
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
// ThemedBackdrop — 4 deterministik arka plan teması (StarField'in yerine)
//   0 yıldız alanı (eski)      1 nebula gradyanı (sürüklenen renkli bulutlar)
//   2 minimal koyu + film greni 3 takımyıldız çizgileri
// Yalnız ZEMİN değişir; kart/yazı renkleri aynı kalır (marka tutarlı).
// ═══════════════════════════════════════════════════════════════════════════
const Nebula: React.FC = () => {
  const frame = useCurrentFrame();
  const blobs = [
    { x: 25, y: 22, c: "rgba(168,85,247,0.38)", r: 62, s: 0.011 },
    { x: 78, y: 48, c: "rgba(56,189,248,0.24)", r: 58, s: 0.008 },
    { x: 38, y: 82, c: "rgba(236,72,153,0.26)", r: 66, s: 0.013 },
  ];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #070518 0%, #120a2c 100%)" }}>
      {blobs.map((b, i) => (
        <AbsoluteFill
          key={i}
          style={{
            background: `radial-gradient(circle at ${b.x + Math.sin(frame * b.s + i) * 9}% ${
              b.y + Math.cos(frame * b.s * 1.3 + i) * 7
            }%, ${b.c} 0%, rgba(0,0,0,0) ${b.r}%)`,
          }}
        />
      ))}
      {Array.from({ length: 36 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${(i * 211) % 100}%`,
            top: `${(i * 97) % 100}%`,
            width: 2,
            height: 2,
            borderRadius: 2,
            background: "#fff",
            opacity: 0.25 + 0.35 * Math.abs(Math.sin((frame + i * 17) * 0.04)),
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const GrainMinimal: React.FC = () => {
  const frame = useCurrentFrame();
  // feTurbulence tohumu birkaç karede bir değişir → canlı ama sakin gren
  const seed = Math.floor(frame / 3) % 24;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #15101f 0%, #07050c 70%)" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "screen" }}>
        <filter id="pythia-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#pythia-grain)" />
      </svg>
    </AbsoluteFill>
  );
};

const CONSTELLATION_PTS: [number, number][] = [
  [12, 14], [30, 9], [48, 18], [64, 8], [86, 16],
  [20, 36], [42, 42], [70, 34], [90, 46],
  [10, 62], [34, 70], [58, 60], [80, 72],
  [22, 88], [50, 84], [76, 92],
];
const CONSTELLATION_LINES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [2, 6], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 7], [11, 12], [10, 13], [13, 14], [14, 15], [12, 15],
];
const Constellation: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #050a1c 0%, #0b1530 55%, #16103a 100%)" }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
        {CONSTELLATION_LINES.map(([a, b], i) => (
          <line
            key={i}
            x1={CONSTELLATION_PTS[a][0]}
            y1={CONSTELLATION_PTS[a][1]}
            x2={CONSTELLATION_PTS[b][0]}
            y2={CONSTELLATION_PTS[b][1]}
            stroke="#9db4ff"
            strokeWidth={0.12}
            opacity={0.18 + 0.14 * Math.sin(frame * 0.03 + i)}
          />
        ))}
      </svg>
      {CONSTELLATION_PTS.map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
            borderRadius: 5,
            background: "#e8eeff",
            boxShadow: "0 0 18px 4px rgba(157,180,255,0.7)",
            opacity: 0.55 + 0.4 * Math.abs(Math.sin(frame * 0.04 + i * 2)),
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

export const ThemedBackdrop: React.FC<{ base?: React.ReactNode }> = ({ base }) => {
  const t = useThemeIndex();
  if (t === 1) return <Nebula />;
  if (t === 2) return <GrainMinimal />;
  if (t === 3) return <Constellation />;
  return <>{base ?? <StarField />}</>;
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
