// ═══════════════════════════════════════════════════════════════════════════
// GameReplay — sentetik oyun tekrarı kompozisyonu (Faz 2 ana format)
//
// Bot bugünün GERÇEK bulmacasını (seed + config) oynar; kare kare render edilir.
// Pazarlama çerçevesi (üst hook + alt progress + kapanış CTA) oyunun üstüne giyilir.
// Süre bot çizelgesinden otomatik (calcGameReplayMetadata → simulate).
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  type CalculateMetadataFunction,
} from "remotion";
import { simulate, type BotMode, type SimResult } from "./game/botSim";
import { forLevel } from "./game/levelConfig";
import { dailyConfig } from "./game/dailyConfig";
import { GameScene } from "./game/GameScene";
import { GameAudio } from "./game/GameAudio";
import { GameReplayHookProgress, GameProgressBar } from "./game/hookProgress";
import { CtaCard, ctaFrames, CREAM, INK } from "./components/gameStyle";

export const GR_FPS = 30;

export type GameReplayProps = {
  seed: number;
  level: number; // 0 = günlük (dailyConfig), >0 = forLevel(level)
  mode: BotMode;
  hook: string;
  label: string; // HUD etiketi ("GÜNLÜK" / "SEVİYE 20")
  showTimer: boolean;
  speed: number; // zaman ölçeği (1 = gerçek zaman)
  showQr?: boolean;
  chrome?: "full" | "asmr"; // asmr = hook yerine küçük "🎧 sesli izle" rozeti
  sim?: SimResult; // calculateMetadata doldurur
};

// ASMR rozeti: ilk ~1.5 sn görünür, sonra solar.
const AsmrBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = frame < 1.2 * fps ? 1 : Math.max(0, 1 - (frame - 1.2 * fps) / (0.5 * fps));
  if (opacity <= 0) return null;
  return (
    <div style={{ position: "absolute", top: 200, left: 0, right: 0, textAlign: "center", opacity }}>
      <span style={{ display: "inline-block", background: CREAM, color: INK, fontWeight: 800, fontSize: 40, padding: "12px 30px", borderRadius: 999, fontFamily: "system-ui, sans-serif", boxShadow: "0 6px 18px rgba(0,0,0,0.2)" }}>
        🎧 sesli izle
      </span>
    </div>
  );
};

function cfgFor(level: number) {
  return level === 0 ? dailyConfig : forLevel(level);
}

export const calcGameReplayMetadata: CalculateMetadataFunction<GameReplayProps> = ({ props }) => {
  const sim = simulate(cfgFor(props.level), props.seed, props.mode);
  const speed = props.speed || 1;
  const gameFrames = Math.round((sim.totalSec / speed) * GR_FPS);
  return {
    durationInFrames: gameFrames + ctaFrames(GR_FPS),
    props: { ...props, sim },
  };
};

export const GameReplay: React.FC<GameReplayProps> = (props) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const speed = props.speed || 1;

  // sim yoksa (Studio, calculateMetadata çalışmadan) anlık üret — önizleme için.
  const sim = props.sim ?? simulate(cfgFor(props.level), props.seed, props.mode);
  const gameFrames = Math.round((sim.totalSec / speed) * fps);
  const gt = (frame / fps) * speed;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={gameFrames} layout="none">
        <GameScene sim={sim} gt={gt} label={props.label} showTimer={props.showTimer} />
        <GameAudio sim={sim} fps={fps} speed={speed} />
        {props.chrome === "asmr" ? (
          <>
            <AsmrBadge />
            <GameProgressBar total={gameFrames} />
          </>
        ) : (
          <GameReplayHookProgress hook={props.hook} total={gameFrames} />
        )}
      </Sequence>
      <Sequence from={gameFrames} durationInFrames={ctaFrames(fps)} layout="none">
        <CtaCard showQr={props.showQr} />
      </Sequence>
    </AbsoluteFill>
  );
};
