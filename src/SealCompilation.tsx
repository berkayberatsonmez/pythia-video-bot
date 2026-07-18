// ═══════════════════════════════════════════════════════════════════════════
// SealCompilation — 3-4 kısa mühür-yoğun oyun kesitini arka arkaya bağlar (Faz 2)
//
// Her "part" bir sim'in en mühür-yoğun penceresidir (bestSealWindow). Kesitler
// hızlıca akar → "oddly satisfying" mühür yağmuru. Pazarlama çerçevesi (hook +
// progress + CTA) üstüne giyilir. Süre parçalardan otomatik hesaplanır.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  type CalculateMetadataFunction,
} from "remotion";
import { simulate, bestSealWindow, type BotMode, type SimResult } from "./game/botSim";
import { forLevel } from "./game/levelConfig";
import { dailyConfig } from "./game/dailyConfig";
import { GameScene } from "./game/GameScene";
import { GameAudio } from "./game/GameAudio";
import { CtaCard, ctaFrames } from "./components/gameStyle";
import { GameReplayHookProgress } from "./game/hookProgress";

export const SC_FPS = 30;

export type SealPart = {
  seed: number;
  level: number; // 0 = daily config
  mode: BotMode;
  label: string;
  windowStart?: number; // sn — verilmezse bestSealWindow ile bulunur
  windowDur?: number; // sn — kesit uzunluğu (varsayılan 3.5)
};

export type SealCompilationProps = {
  parts: SealPart[];
  hook: string;
  speed: number; // kesit hızlandırma (mühür yağmuru için 1.2-1.5 iyi)
  showQr?: boolean;
  // calculateMetadata doldurur:
  resolved?: { sim: SimResult; start: number; dur: number; label: string }[];
};

const DEFAULT_WINDOW = 3.5;

function cfgFor(level: number) {
  return level === 0 ? dailyConfig : forLevel(level);
}

function resolveParts(parts: SealPart[]) {
  return parts.map((p) => {
    const sim = simulate(cfgFor(p.level), p.seed, p.mode);
    const dur = p.windowDur ?? DEFAULT_WINDOW;
    const win =
      p.windowStart != null
        ? { start: p.windowStart, dur }
        : bestSealWindow(sim, dur);
    return { sim, start: win.start, dur: win.dur, label: p.label };
  });
}

export const calcSealCompilationMetadata: CalculateMetadataFunction<SealCompilationProps> = ({ props }) => {
  const speed = props.speed || 1.3;
  const resolved = resolveParts(props.parts);
  const totalGame = resolved.reduce((s, r) => s + Math.round((r.dur / speed) * SC_FPS), 0);
  return {
    durationInFrames: totalGame + ctaFrames(SC_FPS),
    props: { ...props, resolved },
  };
};

export const SealCompilation: React.FC<SealCompilationProps> = (props) => {
  const { fps } = useVideoConfig();
  const speed = props.speed || 1.3;
  const resolved = props.resolved ?? resolveParts(props.parts);

  const partFrames = resolved.map((r) => Math.round((r.dur / speed) * fps));
  const totalGame = partFrames.reduce((a, b) => a + b, 0);

  const offsets: number[] = [];
  let acc = 0;
  for (const f of partFrames) {
    offsets.push(acc);
    acc += f;
  }

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {resolved.map((r, i) => (
        <Sequence key={i} from={offsets[i]} durationInFrames={partFrames[i]} layout="none">
          <SealPartScene part={r} speed={speed} />
        </Sequence>
      ))}

      {/* Ortak hook + progress (tüm derleme boyunca) */}
      <Sequence durationInFrames={totalGame} layout="none">
        <GameReplayHookProgress hook={props.hook} total={totalGame} />
      </Sequence>

      <Sequence from={totalGame} durationInFrames={ctaFrames(fps)} layout="none">
        <CtaCard showQr={props.showQr} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Tek kesit: pencere içinde GameScene + windowed GameAudio.
const SealPartScene: React.FC<{
  part: { sim: SimResult; start: number; dur: number; label: string };
  speed: number;
}> = ({ part, speed }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const gt = part.start + (frame / fps) * speed;
  return (
    <>
      <GameScene sim={part.sim} gt={gt} label={part.label} showTimer={false} />
      <GameAudio sim={part.sim} fps={fps} speed={speed} windowStart={part.start} windowDur={part.dur} />
    </>
  );
};
