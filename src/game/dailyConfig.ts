// ═══════════════════════════════════════════════════════════════════════════
// dailyConfig.ts — daily_challenge_service.dart'ın günlük bulmaca özü (port)
//
// Oyundaki günlük bulmaca: SABİT özel config + seed = yyyyMMdd (LOKAL gün).
// Video botu "bugünün GERÇEK bulmacasını" göstermek için tam bunu kullanır.
// ═══════════════════════════════════════════════════════════════════════════

import type { LevelConfig } from "./levelConfig";

// daily_challenge_service.dart:dailyConfig birebir.
export const dailyConfig: LevelConfig = {
  level: 0,
  colorCount: 4,
  crossTime: 4.5,
  spawnInterval: 1.4,
  targetItems: 24,
  windowTriplets: 4,
  maxLost: 3,
  dockSlots: 2,
};

// Kayıp başına süre cezası (GDD §6.1: +15 sn) — etkin süre hesabında.
export const lossPenaltyMs = 15000;

/** yyyyMMdd (LOKAL) — hem dizilim seed'i hem gün kimliği (Dart _dayInt birebir). */
export function todaysSeed(d: Date = new Date()): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Etkin süre (ms) = ham süre + kayıp × 15 sn. */
export function effectiveTimeMs(durationMs: number, lostCount: number): number {
  return durationMs + lostCount * lossPenaltyMs;
}
