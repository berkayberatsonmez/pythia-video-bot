// ═══════════════════════════════════════════════════════════════════════════
// SpeedClimb — L1→L5 hızlı montaj: her seviyeden bot'un en yoğun kesiti
//
// Her seviyenin ilk mühür + sonrası ~5.5sn kesiti (deterministik: mühür
// olaylarından). Aralarda 0.3sn "Seviye N →" geçiş kartı. Hook: "1. seviye
// kolay dedin... 5.'ye gel". Mevcut GameScene windowed motoru üstünde.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  type CalculateMetadataFunction,
} from "remotion";
import { simulate, type SimResult } from "./game/botSim";
import { forLevel } from "./game/levelConfig";
import { GameScene } from "./game/GameScene";
import { GameAudio } from "./game/GameAudio";
import { GameReplayHookProgress } from "./game/hookProgress";
import { CtaCard, ctaFrames } from "./components/gameStyle";
import { kSkyTop, kSkyBottom, kInk, kCoinGold } from "./game/layout";

export const CLIMB_FPS = 30;
const CARD_SEC = 0.3;
const WINDOW_SEC = 5.5;

export type SpeedClimbProps = {
  levels: number[]; // örn [1,2,3,4,5]
  hook: string;
  speed: number;
  showQr?: boolean;
  resolved?: { sim: SimResult; start: number; dur: number; level: number }[];
};

function climbWindow(sim: SimResult): { start: number; dur: number } {
  const seals = sim.bins.filter((b) => b.sealStartT != null).map((b) => b.sealStartT as number).sort((a, b) => a - b);
  const first = seals[0] ?? 0;
  const start = Math.max(0, first - 0.8);
  return { start, dur: Math.min(WINDOW_SEC, sim.totalSec - start) };
}

function resolveParts(levels: number[]) {
  return levels.map((level) => {
    const sim = simulate(forLevel(level), level * 7919, "clean");
    const w = climbWindow(sim);
    return { sim, start: w.start, dur: w.dur, level };
  });
}

export const calcSpeedClimbMetadata: CalculateMetadataFunction<SpeedClimbProps> = ({ props }) => {
  const speed = props.speed || 1.4;
  const resolved = resolveParts(props.levels);
  const cardFrames = Math.round(CARD_SEC * CLIMB_FPS);
  const gameFrames = resolved.reduce((s, r) => s + Math.round((r.dur / speed) * CLIMB_FPS), 0);
  const cards = (resolved.length - 1) * cardFrames;
  return {
    durationInFrames: gameFrames + cards + ctaFrames(CLIMB_FPS),
    props: { ...props, resolved },
  };
};

const LevelCard: React.FC<{ level: number }> = ({ level }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [0.9, 1.1]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${kSkyTop}, ${kSkyBottom})`, justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${scale})`, color: kInk, fontWeight: 900, fontSize: 130, fontFamily: "'Baloo 2',system-ui,sans-serif", textShadow: `0 4px 0 #fff` }}>
        SEVİYE {level} <span style={{ color: kCoinGold }}>→</span>
      </div>
    </AbsoluteFill>
  );
};

const ClimbPartScene: React.FC<{ part: { sim: SimResult; start: number; dur: number; level: number }; speed: number }> = ({ part, speed }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const gt = part.start + (frame / fps) * speed;
  return (
    <>
      <GameScene sim={part.sim} gt={gt} label={`SEVİYE ${part.level}`} showTimer={false} />
      <GameAudio sim={part.sim} fps={fps} speed={speed} windowStart={part.start} windowDur={part.dur} />
    </>
  );
};

export const SpeedClimb: React.FC<SpeedClimbProps> = (props) => {
  const { fps } = useVideoConfig();
  const speed = props.speed || 1.4;
  const resolved = props.resolved ?? resolveParts(props.levels);
  const cardFrames = Math.round(CARD_SEC * fps);
  const partFrames = resolved.map((r) => Math.round((r.dur / speed) * fps));

  // yerleşim: part0, card(→L2), part1, card(→L3), ... partN
  const blocks: { kind: "part" | "card"; idx: number; frames: number }[] = [];
  resolved.forEach((_, i) => {
    if (i > 0) blocks.push({ kind: "card", idx: i, frames: cardFrames });
    blocks.push({ kind: "part", idx: i, frames: partFrames[i] });
  });
  const offsets: number[] = [];
  let acc = 0;
  for (const b of blocks) {
    offsets.push(acc);
    acc += b.frames;
  }
  const totalGame = acc;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {blocks.map((b, i) => (
        <Sequence key={i} from={offsets[i]} durationInFrames={b.frames} layout="none">
          {b.kind === "part" ? (
            <ClimbPartScene part={resolved[b.idx]} speed={speed} />
          ) : (
            <LevelCard level={resolved[b.idx].level} />
          )}
        </Sequence>
      ))}

      <Sequence durationInFrames={totalGame} layout="none">
        <GameReplayHookProgress hook={props.hook} total={totalGame} />
      </Sequence>
      <Sequence from={totalGame} durationInFrames={ctaFrames(fps)} layout="none">
        <CtaCard showQr={props.showQr} />
      </Sequence>
    </AbsoluteFill>
  );
};
