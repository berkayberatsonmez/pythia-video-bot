// ═══════════════════════════════════════════════════════════════════════════
// dartRandom.ts — dart:math Random(seed) + List.shuffle bit-exact portu
//
// Oyunun spawn dizilimi Dart'ın `Random(seed)` + `List.shuffle(rng)` ile üretilir.
// Video botunun "bugünün GERÇEK bulmacasını" göstermesi için dizilim Dart'la
// BİREBİR aynı olmalı. Bu dosya Dart VM `_Random`'ı (Flutter SDK
// _internal/vm/lib/math_patch.dart) birebir çoğaltır — ground-truth ile
// doğrulanmıştır (scripts/verify-determinism.ts).
//
// Algoritma: Multiply-With-Carry (A=0xffffda61, taban 2^32), 64-bit tek durum.
// Tohum: Thomas Wang 64-bit mix + kurucuda 4 kez _nextState "çevirme".
// ═══════════════════════════════════════════════════════════════════════════

const M64 = (1n << 64n) - 1n;
const M32 = 0xffffffffn;
const A = 0xffffda61n;
const POW2_32 = 0x100000000; // 2^32 (number)

// Thomas Wang 64-bit karıştırma (Dart _Random._setupSeed birebir).
function setupSeed(seed: bigint): bigint {
  let n = BigInt.asUintN(64, seed); // işaretsiz 64-bit
  n = (~n + (n << 21n)) & M64;
  n = (n ^ (n >> 24n)) & M64;
  n = (n * 265n) & M64;
  n = (n ^ (n >> 14n)) & M64;
  n = (n * 21n) & M64;
  n = (n ^ (n >> 28n)) & M64;
  n = (n + (n << 31n)) & M64;
  if (n === 0n) n = 0x5a17n;
  return n;
}

export class DartRandom {
  private s: bigint;

  constructor(seed: number | bigint) {
    this.s = setupSeed(BigInt(seed));
    // Kurucu tohum bitlerini dağıtmak için 4 kez çevirir (Dart factory).
    for (let i = 0; i < 4; i++) this.nextState();
  }

  private nextState(): void {
    const lo = this.s & M32;
    const hi = (this.s >> 32n) & M32;
    this.s = (A * lo + hi) & M64;
  }

  /** Dart Random.nextInt(max) — 0 <= sonuç < max. */
  nextInt(max: number): number {
    // 2'nin kuvveti için hızlı yol (Dart: (max & -max) == max).
    if ((max & (max - 1)) === 0) {
      this.nextState();
      return Number(this.s & M32) & (max - 1);
    }
    let rnd32: number;
    let result: number;
    do {
      this.nextState();
      rnd32 = Number(this.s & M32);
      result = rnd32 % max;
    } while (rnd32 - result + max > POW2_32);
    return result;
  }
}

/**
 * Dart `List.shuffle(random)` birebir — sondan Fisher-Yates.
 * Diziyi YERİNDE karıştırır ve döndürür (Dart semantiği: aynı rng durumu akışı).
 */
export function dartShuffle<T>(list: T[], rng: DartRandom): T[] {
  let length = list.length;
  while (length > 1) {
    const pos = rng.nextInt(length);
    length -= 1;
    const tmp = list[length];
    list[length] = list[pos];
    list[pos] = tmp;
  }
  return list;
}
