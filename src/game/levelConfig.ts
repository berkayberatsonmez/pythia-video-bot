// ═══════════════════════════════════════════════════════════════════════════
// levelConfig.ts — level_config.dart birebir portu (elle tablo + prosedürel + spawn)
//
// buildSpawnSequence Dart'la BİREBİR aynı diziyi üretir (aynı seed → aynı dizilim);
// scripts/verify-determinism.ts ground-truth ile doğrular. Palet + zamanlama
// (crossTime/spawnInterval) GameReplay görsel/ses senkronu için buradan gelir.
// ═══════════════════════════════════════════════════════════════════════════

import { DartRandom, dartShuffle } from "./dartRandom";
import { simulateSequence } from "./sequenceValidator";

export type LevelConfig = {
  level: number;
  colorCount: number;
  crossTime: number; // sn — paketin ekranı geçme süresi
  spawnInterval: number; // sn — paket doğma aralığı
  targetItems: number;
  windowTriplets: number;
  maxLost: number;
  dockSlots: number;
};

// Renk paleti — "Gündüz Kargo" teması (theme.dart / level_config.dart palette).
export const PALETTE = [
  "#E74C3C", // kırmızı
  "#3498DB", // mavi
  "#2ECC71", // yeşil
  "#F39C12", // turuncu
  "#9B59B6", // mor
] as const;

const _maxRunAttempts = 24;
const _maxValidationAttempts = 20;
const _seedStride = 104729; // asal adım (level*7919 çakışmalarını önler)

// ─── Elle tanımlı L1-7 (GDD §5) ────────────────────────────────────────────
const LEVELS: LevelConfig[] = [
  mk({ level: 1, colorCount: 2, crossTime: 7.0, spawnInterval: 2.4, targetItems: 12, windowTriplets: 2 }),
  mk({ level: 2, colorCount: 2, crossTime: 6.5, spawnInterval: 2.1, targetItems: 12, windowTriplets: 2 }),
  mk({ level: 3, colorCount: 3, crossTime: 6.0, spawnInterval: 1.9, targetItems: 18, windowTriplets: 3 }),
  mk({ level: 4, colorCount: 4, crossTime: 5.5, spawnInterval: 1.7, targetItems: 24, windowTriplets: 4 }),
  mk({ level: 5, colorCount: 4, crossTime: 5.0, spawnInterval: 1.6, targetItems: 24, dockSlots: 2, windowTriplets: 4 }),
  mk({ level: 6, colorCount: 4, crossTime: 4.5, spawnInterval: 1.4, targetItems: 24, dockSlots: 2, windowTriplets: 5 }),
  mk({ level: 7, colorCount: 5, crossTime: 4.0, spawnInterval: 1.2, targetItems: 30, dockSlots: 2, windowTriplets: 5 }),
];

function mk(p: Partial<LevelConfig> & Pick<LevelConfig, "level" | "colorCount" | "crossTime" | "spawnInterval" | "targetItems" | "windowTriplets">): LevelConfig {
  return { maxLost: 3, dockSlots: 0, ...p };
}

// ─── Türetilmiş nitelikler (Dart getter'ları) ──────────────────────────────
export function effectiveWindowTriplets(c: LevelConfig): number {
  return Math.min(c.windowTriplets, c.colorCount);
}
export function maxRun(c: LevelConfig): number {
  return c.colorCount >= 3 ? 2 : 3;
}
export function fairnessBudget(c: LevelConfig): number {
  return c.dockSlots > 0 ? 1 : 2;
}
export function activeColors(c: LevelConfig): string[] {
  return PALETTE.slice(0, c.colorCount);
}

// ─── L8+ prosedürel üretim (kapalı-form, RNG yok) ──────────────────────────
export function generateProcedural(level: number): LevelConfig {
  const k = level - 7;
  const crossTime = Math.max(3.2, 4.0 * Math.pow(0.98, k));
  const spawnInterval = Math.max(1.0, 1.2 * Math.pow(0.98, k));
  const targetItems = 30 + Math.floor((level - 7) / 3) * 6;
  return {
    level,
    colorCount: 5,
    crossTime,
    spawnInterval,
    targetItems,
    windowTriplets: 5,
    maxLost: 3,
    dockSlots: 2,
  };
}

export function forLevel(level: number): LevelConfig {
  if (level <= LEVELS.length) {
    const idx = Math.min(Math.max(level - 1, 0), LEVELS.length - 1);
    return LEVELS[idx];
  }
  return generateProcedural(level);
}

export const dailyChallengeMaxLevelLike = LEVELS.length;

// ═══════════════════════════════════════════════════════════════════════════
// buildSpawnSequence — Katman 1-3 (triplet + pencere + max-run + adalet doğrulaması)
// ═══════════════════════════════════════════════════════════════════════════
export function buildSpawnSequence(c: LevelConfig, seed?: number): number[] {
  const baseSeed = seed ?? c.level * 7919;

  let best: number[] = [];
  let bestLoss = 1 << 30;
  for (let attempt = 0; attempt < _maxValidationAttempts; attempt++) {
    const candidate = generateSequence(c, baseSeed + attempt * _seedStride);
    const result = simulateSequence(candidate, c.dockSlots);
    if (result.totalLost <= fairnessBudget(c)) return candidate;
    if (result.totalLost < bestLoss) {
      bestLoss = result.totalLost;
      best = candidate;
    }
  }
  return best;
}

// ─── Tek aday dizilim (Katman 1-2) ─────────────────────────────────────────
function generateSequence(c: LevelConfig, seed: number): number[] {
  const rng = new DartRandom(seed);
  const tripletCount = Math.floor(c.targetItems / 3);
  const limit = maxRun(c);

  const triplets = Array.from({ length: tripletCount }, (_, i) => i % c.colorCount);
  dartShuffle(triplets, rng);

  const step = effectiveWindowTriplets(c);
  const windows: number[][] = [];
  for (let i = 0; i < triplets.length; i += step) {
    windows.push(triplets.slice(i, Math.min(i + step, triplets.length)));
  }

  ensureWindowsArrangeable(windows, limit);

  const sequence: number[] = [];
  for (const window of windows) {
    const packages: number[] = [];
    for (const color of window) {
      packages.push(color, color, color);
    }
    const arranged = arrangeWithMaxRun(packages, sequence, limit, rng);
    for (const x of arranged) sequence.push(x);
  }
  return sequence;
}

// f <= maxRun * (n - f + 1) → pencere paket düzeyinde dizilebilir mi?
function windowArrangeable(window: number[], mr: number): boolean {
  if (window.length === 0) return true;
  const byColor = new Map<number, number>();
  let maxTriplets = 0;
  for (const cc of window) {
    const v = (byColor.get(cc) ?? 0) + 1;
    byColor.set(cc, v);
    if (v > maxTriplets) maxTriplets = v;
  }
  const n = window.length * 3;
  const f = maxTriplets * 3;
  return f <= mr * (n - f + 1);
}

function mostFrequent(values: number[]): number {
  const byColor = new Map<number, number>();
  let best = values[0];
  let bestCount = 0;
  for (const cc of values) {
    const v = (byColor.get(cc) ?? 0) + 1;
    byColor.set(cc, v);
    if (v > bestCount) {
      bestCount = v;
      best = cc;
    }
  }
  return best;
}

function ensureWindowsArrangeable(windows: number[][], mr: number): void {
  for (const window of windows) {
    let guard = 0;
    while (!windowArrangeable(window, mr) && guard++ < 64) {
      const dominant = mostFrequent(window);
      let swapped = false;
      for (const donor of windows) {
        if (donor === window) continue;
        const k = donor.findIndex((cc) => cc !== dominant);
        if (k === -1) continue;
        const j = window.indexOf(dominant);
        window[j] = donor[k];
        donor[k] = dominant;
        swapped = true;
        break;
      }
      if (!swapped) break;
    }
  }
}

function arrangeWithMaxRun(
  packages: number[],
  before: number[],
  mr: number,
  rng: DartRandom,
): number[] {
  const tail =
    before.length <= mr ? [...before] : before.slice(before.length - mr);

  const candidate = [...packages];
  for (let attempt = 0; attempt < _maxRunAttempts; attempt++) {
    dartShuffle(candidate, rng);
    if (runWithinLimit(tail, candidate, mr)) return candidate;
  }
  return greedyArrange(packages, tail, mr);
}

function runWithinLimit(tail: number[], candidate: number[], mr: number): boolean {
  let run = 0;
  let prev = -1;
  for (const cc of tail) {
    run = cc === prev ? run + 1 : 1;
    prev = cc;
    if (run > mr) return false;
  }
  for (const cc of candidate) {
    run = cc === prev ? run + 1 : 1;
    prev = cc;
    if (run > mr) return false;
  }
  return true;
}

function greedyArrange(packages: number[], tail: number[], mr: number): number[] {
  const counts = new Map<number, number>();
  for (const cc of packages) counts.set(cc, (counts.get(cc) ?? 0) + 1);
  const colors = [...counts.keys()].sort((a, b) => a - b);

  let lastColor = tail.length > 0 ? tail[tail.length - 1] : -1;
  let runLength = 0;
  for (let i = tail.length - 1; i >= 0 && tail[i] === lastColor; i--) {
    runLength++;
  }

  const result: number[] = [];
  for (let placed = 0; placed < packages.length; placed++) {
    let pick = -1;
    let bestCount = -1;
    for (const color of colors) {
      const cnt = counts.get(color)!;
      if (cnt <= 0) continue;
      if (color === lastColor && runLength >= mr) continue;
      if (cnt > bestCount) {
        bestCount = cnt;
        pick = color;
      }
    }
    if (pick === -1) {
      for (const color of colors) {
        const cnt = counts.get(color)!;
        if (cnt > bestCount) {
          bestCount = cnt;
          pick = color;
        }
      }
    }
    result.push(pick);
    counts.set(pick, counts.get(pick)! - 1);
    if (pick === lastColor) {
      runLength++;
    } else {
      lastColor = pick;
      runLength = 1;
    }
  }
  return result;
}
