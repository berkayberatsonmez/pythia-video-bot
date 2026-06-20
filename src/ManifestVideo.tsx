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
import { type Voiceover, getSegs, VoiceTrack } from "./components/voiceover";

// ═══════════════════════════════════════════════════════════════════════════
// Manifesto video — app özelliğiyle birebir: OKUNACAK manifesto.
// "Niyetini yaz → Pythia manifestoya dönüştürür → her gün okuyarak çağır"
//
// Format: prompt → tema → satır satır beliren manifesto (read-along) → CTA
// Ses-güdümlü: voiceover prop'u varsa segmentler ses süresine göre boyutlanır
// (+ seslendirme + kısık müzik). Yoksa eski sabit 15sn düzen (Studio önizleme).
// ═══════════════════════════════════════════════════════════════════════════

export type ManifestVideoProps = { content: Manifesto; voiceover?: Voiceover };

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
const Hook: React.FC<{ content: Manifesto; durFrames?: number }> = ({
  content,
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
          padding: "0 50px",
        }}
      >
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

// ─── Theme reveal — büyük tema + hilal (zodiac GlyphReveal muadili) ───────
const ThemeReveal: React.FC<{ content: Manifesto; durFrames?: number }> = ({
  content,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = durFrames ?? 2.5 * fps;

  const enter = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 80 },
    durationInFrames: 1.1 * fps,
  });
  const scale = interpolate(enter, [0, 1], [0.2, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;
  // yavaş sürekli nefes (statik kalmasın)
  const breathe = 1 + Math.sin(frame * 0.05) * 0.03;

  const subOpacity = interpolate(frame, [0.9 * fps, 1.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
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
        padding: "0 50px",
      }}
    >
      <div
        style={{
          transform: `scale(${scale * breathe})`,
          opacity,
          marginBottom: 40,
        }}
      >
        <MoonDecor size={150} glow={glow} />
      </div>
      <div style={{ opacity: subOpacity, textAlign: "center" }}>
        <div
          style={{
            fontSize: content.theme.length > 10 ? 88 : 110,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 4,
            lineHeight: 1.1,
            textShadow: `0 0 40px ${GOLD}`,
          }}
        >
          {content.theme}
        </div>
        <div
          style={{
            fontSize: 34,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.55)",
            fontStyle: "italic",
            letterSpacing: 2,
            marginTop: 10,
          }}
        >
          {content.themeSub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Line card — manifesto satır(lar)ı (read-along beat) ─────────────────
const LineCard: React.FC<{
  lines: string[];
  glowFirst?: boolean;
  durFrames?: number;
}> = ({ lines, glowFirst, durFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 90 },
    durationInFrames: 0.7 * fps,
  });
  const enterOpacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [40, 0]);

  const exitStart = durFrames ? durFrames - 0.35 * fps : 2 * fps;
  const exitFade = interpolate(
    frame,
    [exitStart, exitStart + 0.3 * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = enterOpacity * exitFade;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 70px",
      }}
    >
      <div style={{ marginBottom: 44, opacity }}>
        <MoonDecor size={90} glow={glow} />
      </div>
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          display: "flex",
          flexDirection: "column",
          gap: 34,
          alignItems: "center",
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: 58,
              fontFamily: "Georgia, serif",
              fontWeight: 600,
              fontStyle: "italic",
              color: glowFirst && i === 0 ? GOLD : "rgba(255,255,255,0.92)",
              textAlign: "center",
              lineHeight: 1.3,
              textShadow:
                glowFirst && i === 0
                  ? `0 0 30px rgba(212, 168, 67, 0.6)`
                  : `0 0 20px rgba(168, 85, 247, 0.4)`,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── Söyle — "yüksek sesle söyle, gerçeğe çağır" ─────────────────────────
const SpeakPrompt: React.FC<{ durFrames?: number }> = ({ durFrames }) => {
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
export const ManifestVideo: React.FC<ManifestVideoProps> = ({
  content,
  voiceover,
}) => {
  const { fps } = useVideoConfig();
  const g = getSegs(voiceover, fps);

  // 4 olumlama satırını 3 beat'e dağıt: [0], [1], [2..] (kalanlar son kartta)
  const l = content.lines;
  const m1Lines = l.slice(0, 1);
  const m2Lines = l.slice(1, 2);
  const m3Lines = l.slice(2);

  return (
    <AbsoluteFill style={{ background: BG_GRADIENT }}>
      <StarField />
      <BackgroundMusic maxVolume={voiceover ? 0.12 : 0.45} />
      {voiceover && <VoiceTrack vo={voiceover} />}

      {/* Hook (intro) */}
      <Sequence durationInFrames={g.hook.dur} layout="none">
        <Hook content={content} durFrames={g.hook.dur} />
      </Sequence>

      {/* Theme reveal */}
      <Sequence from={g.reveal.from} durationInFrames={g.reveal.dur} layout="none">
        <ThemeReveal content={content} durFrames={g.reveal.dur} />
      </Sequence>

      {/* Manifesto satırı 1 */}
      <Sequence from={g.m1.from} durationInFrames={g.m1.dur} layout="none">
        <LineCard lines={m1Lines} glowFirst durFrames={g.m1.dur} />
      </Sequence>

      {/* Manifesto satırı 2 */}
      <Sequence from={g.m2.from} durationInFrames={g.m2.dur} layout="none">
        <LineCard lines={m2Lines} glowFirst durFrames={g.m2.dur} />
      </Sequence>

      {/* Manifesto satırı 3 (kalan satırlar) */}
      <Sequence from={g.m3.from} durationInFrames={g.m3.dur} layout="none">
        <LineCard lines={m3Lines} durFrames={g.m3.dur} />
      </Sequence>

      {/* Söyle çağrısı ("say it aloud" beat) */}
      <Sequence from={g.q.from} durationInFrames={g.q.dur} layout="none">
        <SpeakPrompt durFrames={g.q.dur} />
      </Sequence>

      {/* CTA — app özelliğine direkt köprü */}
      <Sequence from={g.cta.from} durationInFrames={g.cta.dur} layout="none">
        <LogoCta subtitle="sana özel manifesto yazar" />
      </Sequence>
    </AbsoluteFill>
  );
};
