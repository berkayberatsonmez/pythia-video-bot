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
import type { Ranking } from "./data/zodiac-rankings";
import { getZodiacById } from "./data/zodiac-signs";
import {
  GOLD,
  BG_GRADIENT,
  StarField,
  BackgroundMusic,
  Question,
  LogoCta,
} from "./components/shared";
import { type Voiceover, getSegs, VoiceTrack } from "./components/voiceover";

// ═══════════════════════════════════════════════════════════════════════════
// RankingVideo — viral "Top-3 burç sıralaması" (geri sayım 3→2→1)
// "EN ÇOK X YAPAN 3 BURÇ — Seninki var mı?" → merak + paylaşım.
// Ses-güdümlü (getSegs); sessizde sabit 15sn (Studio).
// ═══════════════════════════════════════════════════════════════════════════

export type RankingVideoProps = { ranking: Ranking; voiceover?: Voiceover };

// ─── Altın glyph (CSS mask) — burç sembolü ───────────────────────────────
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
        filter: `drop-shadow(0 0 ${20 + glow * 40}px rgba(212,168,67,${0.6 + glow * 0.4}))`,
      }}
    />
  );
};

// ─── Hook — "EN ÇOK X YAPAN / 3 BURÇ" ────────────────────────────────────
const Hook: React.FC<{ trait: string; durFrames?: number }> = ({
  trait,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = durFrames ?? 2.5 * fps;
  const drift = Math.sin(frame * 0.04) * 8;
  const opacity = interpolate(frame, [0, 0.4 * fps, d - 0.45 * fps, d], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 0.5 * fps,
  });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 70px" }}>
      <div style={{ opacity, transform: `scale(${scale}) translateY(${drift}px)`, textAlign: "center" }}>
        <div
          style={{
            fontSize: 66,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            textShadow: "0 0 30px rgba(168,85,247,0.6)",
          }}
        >
          {trait.toLocaleUpperCase("tr")}
        </div>
        <div
          style={{
            fontSize: 120,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 6,
            marginTop: 14,
            textShadow: `0 0 50px ${GOLD}`,
          }}
        >
          3 BURÇ
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Bridge — "Seninki var mı? geri sayıyoruz…" (merak köprüsü) ───────────
const Bridge: React.FC<{ durFrames?: number }> = ({ durFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = durFrames ?? 2.5 * fps;
  const opacity = interpolate(frame, [0, 0.4 * fps, d - 0.5 * fps, d], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const pulse = 1 + Math.sin(frame * 0.12) * 0.04;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity, transform: `scale(${pulse})`, textAlign: "center" }}>
        <div
          style={{
            fontSize: 76,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.2,
            textShadow: `0 0 30px ${GOLD}`,
          }}
        >
          Seninki var mı? 👀
        </div>
        <div
          style={{
            fontSize: 34,
            color: "rgba(255,255,255,0.7)",
            marginTop: 24,
            letterSpacing: 3,
            fontStyle: "italic",
          }}
        >
          geri sayıyoruz…
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── RankCard — sıra numarası + glyph + isim + blurb ─────────────────────
const RANK_LABEL = ["3", "2", "1"]; // index 0→3., 1→2., 2→1.
const RANK_COLOR = ["#cd7f32", "#c8c8d0", GOLD]; // bronz, gümüş, altın
const RankCard: React.FC<{
  rank: number;
  signId: string;
  blurb: string;
  durFrames?: number;
}> = ({ rank, signId, blurb, durFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sign = getZodiacById(signId);
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
  const ty = interpolate(enter, [0, 1], [70, 0]);
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;
  const color = RANK_COLOR[rank];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 80px" }}>
      <div
        style={{
          opacity,
          transform: `translateY(${ty}px)`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 150,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color,
            lineHeight: 1,
            textShadow: `0 0 40px ${color}`,
          }}
        >
          {RANK_LABEL[rank]}.
        </div>
        <div style={{ marginTop: 8 }}>
          <GoldGlyph svgFile={sign?.svgFile ?? "aries.svg"} size={150} glow={glow} />
        </div>
        <div
          style={{
            fontSize: 64,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 4,
            marginTop: 8,
            textShadow: `0 0 30px ${GOLD}`,
          }}
        >
          {sign?.signName ?? ""}
        </div>
        <div
          style={{
            fontSize: 40,
            fontFamily: "Georgia, serif",
            color: "rgba(255,255,255,0.85)",
            fontStyle: "italic",
            lineHeight: 1.4,
            marginTop: 18,
          }}
        >
          {blurb}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main composition
// ═══════════════════════════════════════════════════════════════════════════
export const RankingVideo: React.FC<RankingVideoProps> = ({ ranking, voiceover }) => {
  const { fps } = useVideoConfig();
  const g = getSegs(voiceover, fps);

  return (
    <AbsoluteFill style={{ background: BG_GRADIENT }}>
      <StarField />
      <BackgroundMusic maxVolume={voiceover ? 0.12 : 0.45} />
      {voiceover && <VoiceTrack vo={voiceover} />}

      <Sequence durationInFrames={g.hook.dur} layout="none">
        <Hook trait={ranking.trait} durFrames={g.hook.dur} />
      </Sequence>

      <Sequence from={g.reveal.from} durationInFrames={g.reveal.dur} layout="none">
        <Bridge durFrames={g.reveal.dur} />
      </Sequence>

      <Sequence from={g.m1.from} durationInFrames={g.m1.dur} layout="none">
        <RankCard rank={0} signId={ranking.ranks[0].signId} blurb={ranking.ranks[0].blurb} durFrames={g.m1.dur} />
      </Sequence>

      <Sequence from={g.m2.from} durationInFrames={g.m2.dur} layout="none">
        <RankCard rank={1} signId={ranking.ranks[1].signId} blurb={ranking.ranks[1].blurb} durFrames={g.m2.dur} />
      </Sequence>

      <Sequence from={g.m3.from} durationInFrames={g.m3.dur} layout="none">
        <RankCard rank={2} signId={ranking.ranks[2].signId} blurb={ranking.ranks[2].blurb} durFrames={g.m3.dur} />
      </Sequence>

      <Sequence from={g.q.from} durationInFrames={g.q.dur} layout="none">
        <Question title="PEKİ SEN?" body={ranking.question} footer="yorumlara yaz 👇" durFrames={g.q.dur} />
      </Sequence>

      <Sequence from={g.cta.from} durationInFrames={g.cta.dur} layout="none">
        <LogoCta subtitle="AI ile kişisel burç yorumu" />
      </Sequence>
    </AbsoluteFill>
  );
};
