// ═══════════════════════════════════════════════════════════════════════════
// variety.ts — Görsel tema + TTS sesi çeşitliliği (deterministik, state yok)
//
// Her yayın slotu (gün, sabah/akşam) için ardışık bir sıra numarası n =
// gün*2 + slot (sabah 0, akşam 1) alınır:
//   • ses   = n % 2           → Emel / Ahmet SIKI dönüşümlü (ardışık videolar hep farklı)
//   • tema  = (n + ⌊n/4⌋) % 4 → ardışık videolar hep farklı tema; 4'lük blok sınırında
//                                kayar, böylece ses–tema eşleşmesi sabit kalmaz
// Tema bileşeni src/components/shared.tsx (ThemedBackdrop, müzik ofseti).
// ═══════════════════════════════════════════════════════════════════════════

export const THEME_COUNT = 4; // shared.tsx ile aynı olmalı (verify-variety sınar)
export const VOICES = ["tr-TR-EmelNeural", "tr-TR-AhmetNeural"] as const;
export type Voice = (typeof VOICES)[number];

export const slotIndex = (slot: "morning" | "evening"): number => (slot === "morning" ? 0 : 1);
export const seqNumber = (day: number, slot: "morning" | "evening"): number => day * 2 + slotIndex(slot);

export function themeFor(day: number, slot: "morning" | "evening"): number {
  const n = seqNumber(day, slot);
  return (n + Math.floor(n / 4)) % THEME_COUNT;
}
export function voiceFor(day: number, slot: "morning" | "evening"): Voice {
  return VOICES[seqNumber(day, slot) % 2];
}
