import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ZodiacSign } from "./data/zodiac-signs";
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
// Zodiac video — "X burcunun gizli yüzü"
// Ses-güdümlü: voiceover prop'u varsa segmentler ses süresine göre boyutlanır
// (+ seslendirme + kısık müzik). Yoksa eski sabit 15sn düzen (Studio önizleme).
// ═══════════════════════════════════════════════════════════════════════════

export type ZodiacVideoProps = { sign: ZodiacSign; voiceover?: Voiceover };

// ─── Altın glyph (CSS mask tekniği) ──────────────────────────────────────
const GoldGlyph: React.FC<{ svgFile: string; size: number; glow: number }> = ({
  svgFile,
  size,
  glow,
}) => {
  const url = staticFile(`zodiac/${svgFile}`);
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: GOLD,
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        filter: `drop-shadow(0 0 ${30 + glow * 50}px rgba(212, 168, 67, ${
          0.6 + glow * 0.4
        }))`,
      }}
    />
  );
};

// ─── Hook — "X BURCUNUN GİZLİ YÜZÜ" ──────────────────────────────────────
const Hook: React.FC<{ sign: ZodiacSign; durFrames?: number }> = ({
  sign,
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
            fontSize: 100,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 6,
            textShadow: `0 0 50px ${GOLD}, 0 0 100px rgba(212, 168, 67, 0.5)`,
          }}
        >
          {sign.signName}
        </div>
        <div
          style={{
            fontSize: 52,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.75)",
            letterSpacing: 4,
            marginTop: 16,
          }}
        >
          BURCUNUN
        </div>
        <div
          style={{
            fontSize: 64,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 8,
            marginTop: 8,
            textShadow: `0 0 30px rgba(168, 85, 247, 0.6)`,
          }}
        >
          GİZLİ YÜZÜ
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Glyph reveal — altın burç sembolü + isim ────────────────────────────
const GlyphReveal: React.FC<{ sign: ZodiacSign; durFrames?: number }> = ({
  sign,
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
  const rotate = interpolate(enter, [0, 1], [-40, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;
  // yavaş sürekli nefes (statik kalmasın)
  const breathe = 1 + Math.sin(frame * 0.05) * 0.03;

  const nameOpacity = interpolate(frame, [0.9 * fps, 1.4 * fps], [0, 1], {
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
      }}
    >
      <div
        style={{
          transform: `scale(${scale * breathe}) rotate(${rotate}deg)`,
          opacity,
        }}
      >
        <GoldGlyph svgFile={sign.svgFile} size={340} glow={glow} />
      </div>
      <div style={{ opacity: nameOpacity, marginTop: 30, textAlign: "center" }}>
        <div
          style={{
            fontSize: 76,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 6,
            textShadow: `0 0 40px ${GOLD}`,
          }}
        >
          {sign.signName}
        </div>
        <div
          style={{
            fontSize: 30,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.55)",
            letterSpacing: 2,
            marginTop: 6,
          }}
        >
          {sign.element} · {sign.dateRange}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main composition
// ═══════════════════════════════════════════════════════════════════════════
export const ZodiacVideo: React.FC<ZodiacVideoProps> = ({ sign, voiceover }) => {
  const { fps } = useVideoConfig();
  const g = getSegs(voiceover, fps);

  return (
    <AbsoluteFill style={{ background: BG_GRADIENT }}>
      <StarField />
      <BackgroundMusic maxVolume={voiceover ? 0.12 : 0.45} />
      {voiceover && <VoiceTrack vo={voiceover} />}

      <Sequence durationInFrames={g.hook.dur} layout="none">
        <Hook sign={sign} durFrames={g.hook.dur} />
      </Sequence>

      <Sequence from={g.reveal.from} durationInFrames={g.reveal.dur} layout="none">
        <GlyphReveal sign={sign} durFrames={g.reveal.dur} />
      </Sequence>

      <Sequence from={g.m1.from} durationInFrames={g.m1.dur} layout="none">
        <MeaningCard number="1" title={sign.meanings[0].title} desc={sign.meanings[0].desc} durFrames={g.m1.dur} />
      </Sequence>

      <Sequence from={g.m2.from} durationInFrames={g.m2.dur} layout="none">
        <MeaningCard number="2" title={sign.meanings[1].title} desc={sign.meanings[1].desc} durFrames={g.m2.dur} />
      </Sequence>

      <Sequence from={g.m3.from} durationInFrames={g.m3.dur} layout="none">
        <MeaningCard number="3" title={sign.meanings[2].title} desc={sign.meanings[2].desc} durFrames={g.m3.dur} />
      </Sequence>

      <Sequence from={g.q.from} durationInFrames={g.q.dur} layout="none">
        <Question
          title={sign.questionTitle}
          body={sign.questionBody}
          footer={sign.questionFooter}
          durFrames={g.q.dur}
        />
      </Sequence>

      <Sequence from={g.cta.from} durationInFrames={g.cta.dur} layout="none">
        <LogoCta subtitle="AI ile detaylı burç yorumu" />
      </Sequence>
    </AbsoluteFill>
  );
};
