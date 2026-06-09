import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Manifesto } from "./data/manifestation";
import {
  GOLD,
  BG_GRADIENT,
  StarField,
  BackgroundMusic,
  LogoCta,
} from "./components/shared";

// ═══════════════════════════════════════════════════════════════════════════
// Manifesto video — app özelliğiyle birebir: OKUNACAK manifesto.
// "Niyetini yaz → Pythia manifestoya dönüştürür → her gün okuyarak çağır"
//
// Format: prompt → tema → satır satır beliren manifesto (read-along) → CTA
// ═══════════════════════════════════════════════════════════════════════════

export type ManifestVideoProps = { content: Manifesto };

// ─── Hilal ay (küçük dekor) ──────────────────────────────────────────────
const MoonDecor: React.FC<{ size: number; glow: number }> = ({ size, glow }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={GOLD}
    style={{
      filter: `drop-shadow(0 0 ${20 + glow * 30}px rgba(212, 168, 67, ${
        0.5 + glow * 0.4
      }))`,
    }}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// ─── Hook — "HER SABAH BUNU OKU" + tema ──────────────────────────────────
const Hook: React.FC<{ content: Manifesto }> = ({ content }) => {
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
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center", padding: "0 50px" }}>
        <div
          style={{
            fontSize: 46,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.72)",
            letterSpacing: 5,
            marginBottom: 26,
          }}
        >
          {content.prompt}
        </div>
        <div
          style={{
            fontSize: content.theme.length > 10 ? 84 : 104,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 3,
            lineHeight: 1.1,
            textShadow: `0 0 50px ${GOLD}, 0 0 100px rgba(212, 168, 67, 0.5)`,
          }}
        >
          {content.theme}
        </div>
        <div
          style={{
            fontSize: 34,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.6)",
            fontStyle: "italic",
            letterSpacing: 2,
            marginTop: 18,
          }}
        >
          {content.themeSub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Reading — manifesto satırları sırayla belirir (read-along) ──────────
const ManifestoReading: React.FC<{ content: Manifesto }> = ({ content }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;

  // Her satır 1.6s arayla belirir; hepsi ekranda kalır
  const lineGap = 1.6 * fps;
  const firstLineStart = 0.5 * fps;

  // Sekans sonunda yumuşak fade
  const blockFade = interpolate(
    frame,
    [8.5 * fps, 9 * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 70px",
        opacity: blockFade,
      }}
    >
      {/* Üstte küçük hilal */}
      <div style={{ marginBottom: 44 }}>
        <MoonDecor size={90} glow={glow} />
      </div>

      {/* Manifesto satırları */}
      <div style={{ display: "flex", flexDirection: "column", gap: 34, alignItems: "center" }}>
        {content.lines.map((line, i) => {
          const start = firstLineStart + i * lineGap;
          const enter = spring({
            frame: frame - start,
            fps,
            config: { damping: 16, stiffness: 90 },
            durationInFrames: 0.7 * fps,
          });
          const lineOpacity = interpolate(enter, [0, 1], [0, 1]);
          const lineY = interpolate(enter, [0, 1], [40, 0]);

          // En son beliren satır altın parlasın, öncekiler beyaz
          const isNewest =
            frame >= start && frame < start + lineGap;

          return (
            <div
              key={i}
              style={{
                opacity: lineOpacity,
                transform: `translateY(${lineY}px)`,
                fontSize: 58,
                fontFamily: "Georgia, serif",
                fontWeight: 600,
                fontStyle: "italic",
                color: isNewest ? GOLD : "rgba(255,255,255,0.92)",
                textAlign: "center",
                lineHeight: 1.3,
                textShadow: isNewest
                  ? `0 0 30px rgba(212, 168, 67, 0.6)`
                  : `0 0 20px rgba(168, 85, 247, 0.4)`,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Söyle — "yüksek sesle söyle, gerçeğe çağır" ─────────────────────────
const SpeakPrompt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 0.4 * fps, 1.1 * fps, 1.5 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
      <div style={{ opacity, textAlign: "center" }}>
        <div
          style={{
            fontSize: 72,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.3,
            textShadow: `0 0 30px ${GOLD}`,
          }}
        >
          Yüksek sesle söyle.
        </div>
        <div
          style={{
            fontSize: 42,
            fontFamily: "Georgia, serif",
            color: GOLD,
            fontStyle: "italic",
            marginTop: 24,
          }}
        >
          niyetini gerçeğe çağır 🌙
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main composition
// ═══════════════════════════════════════════════════════════════════════════
export const ManifestVideo: React.FC<ManifestVideoProps> = ({ content }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: BG_GRADIENT }}>
      <StarField />
      <BackgroundMusic />

      {/* [0-2.5s] Hook */}
      <Sequence durationInFrames={2.5 * fps} layout="none">
        <Hook content={content} />
      </Sequence>

      {/* [2.5-11.5s] Manifesto okuma (read-along) */}
      <Sequence from={2.5 * fps} durationInFrames={9 * fps} layout="none">
        <ManifestoReading content={content} />
      </Sequence>

      {/* [11.5-13s] Söyle çağrısı */}
      <Sequence from={11.5 * fps} durationInFrames={1.5 * fps} layout="none">
        <SpeakPrompt />
      </Sequence>

      {/* [13-15s] CTA — app özelliğine direkt köprü */}
      <Sequence from={13 * fps} durationInFrames={2 * fps} layout="none">
        <LogoCta subtitle="sana özel manifesto yazar" />
      </Sequence>
    </AbsoluteFill>
  );
};
