// ═══════════════════════════════════════════════════════════════════════════
// FailBait — bot bir paketi tehlike bölgesine sokar, video düşmeye ~0.4sn kala
// DONAR (son kare + zoom), sonra "Sen kurtarabilir miydin?" engagement kartı.
//
// botSim "failBait" modu: bir yem paketi tehlikeye kadar uzatır (tensionT) ama
// GERÇEK kayıp OLMAZ (validator bütçesi bozulmaz) — video dondurma ile keser.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  type CalculateMetadataFunction,
} from "remotion";
import { simulate, type BotMode, type SimResult } from "./game/botSim";
import { forLevel } from "./game/levelConfig";
import { dailyConfig } from "./game/dailyConfig";
import { GameScene } from "./game/GameScene";
import { GameAudio } from "./game/GameAudio";
import { GameReplayHookProgress } from "./game/hookProgress";
import { STAGE_H, kSkyTop, kSkyBottom, kInk, kCoinGold, kCard } from "./game/layout";
import { APP } from "./appConfig";

export const FB_FPS = 30;
const FREEZE_SEC = 1.5;
const CARD_SEC = 3.0;

export type FailBaitProps = {
  seed: number;
  level: number; // 0 = daily config
  hook: string;
  label: string;
  showQr?: boolean;
  sim?: SimResult;
};

function cfgFor(level: number) {
  return level === 0 ? dailyConfig : forLevel(level);
}

export const calcFailBaitMetadata: CalculateMetadataFunction<FailBaitProps> = ({ props }) => {
  const sim = simulate(cfgFor(props.level), props.seed, "failBait" as BotMode);
  const tensionT = sim.tensionT ?? sim.finishTimeSec * 0.6;
  const gameFrames = Math.round(tensionT * FB_FPS);
  const total = gameFrames + Math.round((FREEZE_SEC + CARD_SEC) * FB_FPS);
  return { durationInFrames: total, props: { ...props, sim } };
};

// Dondurulmuş kare + tehlikeye zoom + kırmızı vinyet + "?!"
const FrozenZoom: React.FC<{ sim: SimResult; tensionT: number; label: string }> = ({ sim, tensionT, label }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });
  const scale = 1 + 0.18 * p;
  const shake = Math.sin(frame * 1.6) * (2 + 4 * p);
  const q = spring({ frame, fps, config: { damping: 8, stiffness: 140 }, durationInFrames: 0.4 * fps });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${scale}) translateX(${shake}px)`, transformOrigin: "78% 80%" }}>
        <GameScene sim={sim} gt={tensionT} label={label} showTimer={false} />
      </div>
      {/* kırmızı tehlike vinyeti */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 78% 80%, rgba(231,76,60,0) 30%, rgba(231,76,60,0.45) 100%)", opacity: p }} />
      {/* "?!" */}
      <div style={{ position: "absolute", top: STAGE_H * 0.28, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontSize: 180, fontWeight: 900, color: "#E74C3C", transform: `scale(${q})`, display: "inline-block", textShadow: "0 6px 0 #fff, 0 8px 30px rgba(0,0,0,0.4)" }}>
          ?!
        </span>
      </div>
    </AbsoluteFill>
  );
};

const QuestionCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 13, stiffness: 100 }, durationInFrames: 0.5 * fps });
  const scale = interpolate(enter, [0, 1], [0.7, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const bounce = Math.sin(frame * 0.2) * 6;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${kSkyTop}, ${kSkyBottom})`, justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${scale})`, opacity, textAlign: "center", padding: "0 70px" }}>
        <div style={{ background: kCard, borderRadius: 40, padding: "50px 46px", boxShadow: "0 16px 0 rgba(23,58,77,0.15)", border: `8px solid ${kCoinGold}` }}>
          <div style={{ fontSize: 76, fontWeight: 900, color: kInk, fontFamily: "'Baloo 2',system-ui,sans-serif", lineHeight: 1.2 }}>
            Sen kurtarabilir miydin?
          </div>
          <div style={{ fontSize: 46, fontWeight: 800, color: "#E74C3C", marginTop: 26, transform: `translateY(${bounce}px)` }}>
            Yorumlara yaz 👇
          </div>
        </div>
        <div style={{ marginTop: 40, fontSize: 34, fontWeight: 700, color: kInk, fontFamily: "system-ui,sans-serif" }}>
          📦 {APP.name} — {APP.storeName}'de ücretsiz
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const FailBait: React.FC<FailBaitProps> = (props) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const sim = props.sim ?? simulate(cfgFor(props.level), props.seed, "failBait" as BotMode);
  const tensionT = sim.tensionT ?? sim.finishTimeSec * 0.6;
  const gameFrames = Math.round(tensionT * fps);
  const freezeFrames = Math.round(FREEZE_SEC * fps);
  const gt = frame / fps;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={gameFrames} layout="none">
        <GameScene sim={sim} gt={gt} label={props.label} showTimer={false} />
        <GameAudio sim={sim} fps={fps} speed={1} windowDur={tensionT} />
        <GameReplayHookProgress hook={props.hook} total={gameFrames} />
      </Sequence>
      <Sequence from={gameFrames} durationInFrames={freezeFrames} layout="none">
        <FrozenZoom sim={sim} tensionT={tensionT} label={props.label} />
      </Sequence>
      <Sequence from={gameFrames + freezeFrames} durationInFrames={Math.round(CARD_SEC * fps)} layout="none">
        <QuestionCard />
      </Sequence>
    </AbsoluteFill>
  );
};
