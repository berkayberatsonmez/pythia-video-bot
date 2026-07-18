// ═══════════════════════════════════════════════════════════════════════════
// speedProfile.ts — Zaman-değişken bant hızı (Yavaşlat booster'ı — effectiveBeltSpeed portu)
//
// Oyunda booster hız çarpanı belt+item'ı yavaşlatır (conveyor_game.effectiveBeltSpeed).
// Video için bant hızını zamanla değişen bir profil olarak modelleriz. Varsayılan
// (NO_SLOWDOWN) kimlik → booster'sız formatların render'ı DEĞİŞMEZ.
// ═══════════════════════════════════════════════════════════════════════════

export type SpeedSeg = { from: number; factor: number };
export type SpeedProfile = SpeedSeg[]; // from'a göre sıralı, ilk from = 0

export const NO_SLOWDOWN: SpeedProfile = [{ from: 0, factor: 1 }];

/** Belirli t'deki hız çarpanı (from<=t olan son segment). */
export function speedAt(profile: SpeedProfile, t: number): number {
  let f = profile[0]?.factor ?? 1;
  for (const s of profile) {
    if (s.from <= t) f = s.factor;
    else break;
  }
  return f;
}

/**
 * spawnT → t arası "etkin geçen süre" (çarpanla ağırlıklı). Bant mesafesi =
 * bs * effElapsed. Kimlik profilde effElapsed = t - spawnT (yani mevcut davranış).
 */
export function effElapsed(profile: SpeedProfile, spawnT: number, t: number): number {
  if (t <= spawnT) return 0;
  let eff = 0;
  for (let i = 0; i < profile.length; i++) {
    const segStart = profile[i].from;
    const segEnd = i + 1 < profile.length ? profile[i + 1].from : Infinity;
    const lo = Math.max(spawnT, segStart);
    const hi = Math.min(t, segEnd);
    if (hi > lo) eff += (hi - lo) * profile[i].factor;
  }
  return eff;
}
