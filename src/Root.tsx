import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { GameReplay, calcGameReplayMetadata } from "./GameReplay";
import { SealCompilation, calcSealCompilationMetadata } from "./SealCompilation";
import { SpeedClimb, calcSpeedClimbMetadata } from "./SpeedClimb";
import { FailBait, calcFailBaitMetadata } from "./FailBait";
import { todaysSeed } from "./game/dailyConfig";

// ═══════════════════════════════════════════════════════════════════════════
// Conveyor Sort — sentetik oyun tekrarı kompozisyonları (Faz 2)
//
// Bot oyunun GERÇEK dizilim üreticisiyle (Dart parite) oynar; kare kare render.
// Süreler bot çizelgesinden calculateMetadata ile otomatik.
//
//   npm run dev                      Studio önizleme
//   npm run daily                    bugünün formatlarını üret + yükle
//   npx tsx scripts/verify-determinism.ts   Dart parite testi
// ═══════════════════════════════════════════════════════════════════════════

// Studio önizleme için "bugün" (render'da generate-daily props geçer).
const previewSeed = todaysSeed();

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ═══ GameReplay — DailyChallenge / LevelShowcase ═══════════════ */}
      <Composition
        id="GameReplay"
        component={GameReplay}
        durationInFrames={40 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          seed: previewSeed,
          level: 0, // 0 = günlük bulmaca
          mode: "clean" as const,
          hook: "Bugünün bulmacası — sen kaç saniyede? 📦",
          label: "GÜNLÜK",
          showTimer: true,
          speed: 1,
          showQr: false,
        }}
        calculateMetadata={calcGameReplayMetadata}
      />

      {/* ═══ SealCompilation — mühür-yoğun kesitler ═══════════════════ */}
      <Composition
        id="SealCompilation"
        component={SealCompilation}
        durationInFrames={20 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          parts: [
            { seed: previewSeed, level: 0, mode: "clean" as const, label: "GÜNLÜK" },
            { seed: previewSeed, level: 18, mode: "clean" as const, label: "SEVİYE 18" },
            { seed: previewSeed, level: 24, mode: "clean" as const, label: "SEVİYE 24" },
          ],
          hook: "Oddly satisfying mühür yağmuru 📦",
          speed: 1.3,
          showQr: false,
        }}
        calculateMetadata={calcSealCompilationMetadata}
      />

      {/* ═══ SpeedClimb — L1→L5 hızlı montaj ══════════════════════════ */}
      <Composition
        id="SpeedClimb"
        component={SpeedClimb}
        durationInFrames={40 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          levels: [1, 2, 3, 4, 5],
          hook: "1. seviye kolay dedin... 5.'ye gel 📦",
          speed: 1.4,
          showQr: false,
        }}
        calculateMetadata={calcSpeedClimbMetadata}
      />

      {/* ═══ FailBait — tehlike anında dondur + soru ══════════════════ */}
      <Composition
        id="FailBait"
        component={FailBait}
        durationInFrames={30 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          seed: 18 * 7919,
          level: 18,
          hook: "Bu paketi kurtarabilir miydin? 😱📦",
          label: "SEVİYE 18",
          showQr: false,
        }}
        calculateMetadata={calcFailBaitMetadata}
      />

      {/* ═══ BoosterSave / PerfectRunASMR — GameReplay varyantları ═════ */}
      {/* (rotation.ts comp="GameReplay" + mode/chrome props ile üretir)   */}
      <Composition
        id="BoosterSave"
        component={GameReplay}
        durationInFrames={60 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          seed: 20 * 7919,
          level: 20,
          mode: "boosterSave" as const,
          hook: "Son saniye kurtarışı ⏳📦",
          label: "SEVİYE 20",
          showTimer: false,
          speed: 1,
          chrome: "full" as const,
          showQr: false,
        }}
        calculateMetadata={calcGameReplayMetadata}
      />
      <Composition
        id="PerfectRunASMR"
        component={GameReplay}
        durationInFrames={70 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          seed: 22 * 7919,
          level: 22,
          mode: "clean" as const,
          hook: "",
          label: "SEVİYE 22",
          showTimer: false,
          speed: 1,
          chrome: "asmr" as const,
          showQr: false,
        }}
        calculateMetadata={calcGameReplayMetadata}
      />
    </>
  );
};
