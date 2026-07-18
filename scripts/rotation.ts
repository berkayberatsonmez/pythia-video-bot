// ═══════════════════════════════════════════════════════════════════════════
// rotation.ts — Hangi gün hangi format(lar) yayınlanır (stateless, deterministik)
//
// Sabah slotu = DailyChallenge HER GÜN (oyunla senkron — herkese aynı bulmaca).
// Akşam slotu = kalan 5 format arasında GÜN-ENDEKSLİ rotasyon (art arda aynı
// format gelmez — döngüsel). Formatlar mevcut GameReplay/GameScene motoru üstünde.
// ═══════════════════════════════════════════════════════════════════════════

import { simulate } from "../src/game/botSim";
import { forLevel } from "../src/game/levelConfig";
import { dailyConfig, todaysSeed } from "../src/game/dailyConfig";

export type VideoFormat =
  | "daily"
  | "showcase"
  | "seal"
  | "speedclimb"
  | "failbait"
  | "boostersave"
  | "asmr";

export type SelectedVideo = {
  slot: "morning" | "evening";
  format: VideoFormat;
  comp: "GameReplay" | "SealCompilation" | "SpeedClimb" | "FailBait";
  id: string;
  category: string; // metadata dispatch = format
  label: string;
  hook: string;
  finishSec?: number;
  props: Record<string, unknown>;
};

function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Gün endeksi (epoch'tan bu yana gün) — akşam rotasyonu döngüsü için.
function dayIndex(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

const SHOWCASE_HOOKS = [
  "Bu seviyeyi geçebilir misin? 📦",
  "Oddly satisfying paket sıralama 📦",
  "%1 bu seviyeyi ilk denemede geçiyor 😮‍💨📦",
  "Bu tempoyu kaldırabilir misin? 📦",
];

const showcaseLevel = (seed: number) => 12 + (seed % 19); // L12..L30

// ─── Format kurucular ──────────────────────────────────────────────────────
function buildDaily(seed: number): SelectedVideo {
  const finishSec = simulate(dailyConfig, seed, "clean").finishTimeSec;
  const hook = `Bugünün bulmacası — ben ${mmss(finishSec)}'te bitirdim, sen? 📦`;
  return {
    slot: "morning",
    format: "daily",
    comp: "GameReplay",
    id: `daily-${seed}`,
    category: "daily",
    label: `📦 Günlük (${mmss(finishSec)})`,
    hook,
    finishSec,
    props: { seed, level: 0, mode: "clean", hook, label: "GÜNLÜK", showTimer: true, speed: 1, chrome: "full", showQr: false },
  };
}

function buildShowcase(seed: number): SelectedVideo {
  const level = showcaseLevel(seed);
  const hook = SHOWCASE_HOOKS[seed % SHOWCASE_HOOKS.length];
  return {
    slot: "evening",
    format: "showcase",
    comp: "GameReplay",
    id: `showcase-L${level}-${seed}`,
    category: "showcase",
    label: `🎮 Seviye ${level} (nearMiss)`,
    hook,
    props: { seed: level * 7919, level, mode: "nearMiss", hook, label: `SEVİYE ${level}`, showTimer: false, speed: 1.2, chrome: "full", showQr: false },
  };
}

function buildSeal(seed: number): SelectedVideo {
  const l1 = 8 + (seed % 10);
  const l2 = 16 + (seed % 12);
  const parts = [
    { seed, level: 0, mode: "clean" as const, label: "GÜNLÜK" },
    { seed: l1 * 7919, level: l1, mode: "clean" as const, label: `SEVİYE ${l1}` },
    { seed: l2 * 7919, level: l2, mode: "clean" as const, label: `SEVİYE ${l2}` },
  ];
  const hook = "Oddly satisfying mühür yağmuru 📦";
  return {
    slot: "evening",
    format: "seal",
    comp: "SealCompilation",
    id: `seal-${seed}`,
    category: "seal",
    label: "🎞️ Mühür derlemesi",
    hook,
    props: { parts, hook, speed: 1.35, showQr: false },
  };
}

function buildSpeedClimb(seed: number): SelectedVideo {
  const hook = "1. seviye kolay dedin... 5.'ye gel 📦";
  return {
    slot: "evening",
    format: "speedclimb",
    comp: "SpeedClimb",
    id: `speedclimb-${seed}`,
    category: "speedclimb",
    label: "⏫ SpeedClimb L1→L5",
    hook,
    props: { levels: [1, 2, 3, 4, 5], hook, speed: 1.4, showQr: false },
  };
}

function buildFailBait(seed: number): SelectedVideo {
  const level = 12 + (seed % 14); // L12..L25 (hızlı, gerilim)
  const hook = "Bu paketi kurtarabilir miydin? 😱📦";
  return {
    slot: "evening",
    format: "failbait",
    comp: "FailBait",
    id: `failbait-L${level}-${seed}`,
    category: "failbait",
    label: `😱 FailBait (Seviye ${level})`,
    hook,
    props: { seed: level * 7919, level, hook, label: `SEVİYE ${level}`, showQr: false },
  };
}

function buildBoosterSave(seed: number): SelectedVideo {
  const level = 15 + (seed % 11); // L15..L25 (kaos temposu)
  const hook = "Son saniye kurtarışı ⏳📦";
  return {
    slot: "evening",
    format: "boostersave",
    comp: "GameReplay",
    id: `boostersave-L${level}-${seed}`,
    category: "boostersave",
    label: `⏳ BoosterSave (Seviye ${level})`,
    hook,
    props: { seed: level * 7919, level, mode: "boosterSave", hook, label: `SEVİYE ${level}`, showTimer: false, speed: 1, chrome: "full", showQr: false },
  };
}

function buildAsmr(seed: number): SelectedVideo {
  // L20+ ama 88sn'yi aşmasın — aşarsa seviyeyi küçült.
  let level = 20 + (seed % 8); // L20..L27
  while (level > 18 && simulate(forLevel(level), level * 7919, "clean").totalSec > 88) level--;
  return {
    slot: "evening",
    format: "asmr",
    comp: "GameReplay",
    id: `asmr-L${level}-${seed}`,
    category: "asmr",
    label: `🎧 PerfectRunASMR (Seviye ${level})`,
    hook: "",
    props: { seed: level * 7919, level, mode: "clean", hook: "", label: `SEVİYE ${level}`, showTimer: false, speed: 1, chrome: "asmr", showQr: false },
  };
}

// Akşam rotasyon havuzu (daily hariç 6 format). Gün-endeksli döngü → art arda tekrar yok.
const EVENING_POOL: ((seed: number) => SelectedVideo)[] = [
  buildSeal,
  buildShowcase,
  buildSpeedClimb,
  buildFailBait,
  buildBoosterSave,
  buildAsmr,
];

export function getTodaysVideos(date: Date = new Date()): SelectedVideo[] {
  const seed = todaysSeed(date);
  const morning = buildDaily(seed);
  const eveningBuilder = EVENING_POOL[((dayIndex(date) % EVENING_POOL.length) + EVENING_POOL.length) % EVENING_POOL.length];
  const evening = eveningBuilder(seed);
  return [morning, evening];
}

// ─── CLI önizleme + 14 günlük simülasyon ───────────────────────────────────
if (process.argv.includes("--preview")) {
  const picks = getTodaysVideos();
  console.log(`\n📅 ${new Date().toLocaleDateString("tr-TR")} — Bugünün videoları:\n`);
  for (const p of picks) {
    console.log(`  ${p.slot === "morning" ? "13:00" : "20:00"}  ${p.label}  [${p.comp}]`);
    console.log(`         hook: ${p.hook || "(yok — ASMR rozeti)"}`);
    console.log(`         id: ${p.id}\n`);
  }
}

if (process.argv.includes("--schedule")) {
  const days = Number(process.argv[process.argv.indexOf("--schedule") + 1]) || 14;
  console.log(`\n📆 ${days} günlük rotasyon:\n`);
  console.log("Gün         Sabah          Akşam");
  console.log("─".repeat(70));
  const base = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const [m, e] = getTodaysVideos(d);
    const ds = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", weekday: "short" });
    console.log(`${ds.padEnd(12)}${m.format.padEnd(15)}${e.format}`);
  }
  console.log();
}
