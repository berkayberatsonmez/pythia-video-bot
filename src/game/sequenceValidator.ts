// ═══════════════════════════════════════════════════════════════════════════
// sequenceValidator.ts — sequence_validator.dart birebir portu (adalet + bot temeli)
//
// simulateSequence: bir spawn dizilimini greedy botla oynar, kaç paket kaybedildiğini
// döndürür. LevelConfig.buildSpawnSequence adalet doğrulaması için kullanır.
// Aynı greedy mantık botPlayer.ts'te "izlenebilir" (zaman çizelgeli) hâle getirilir.
// ═══════════════════════════════════════════════════════════════════════════

export type SolverResult = {
  lost: number; // bant sonundan kaçan paket (kutu yok, dock dolu)
  strandedInDock: number; // dizilim bitince dock'ta kalan
  get totalLost(): number;
};

class Bin {
  color: number;
  filled = 0;
  constructor(color: number) {
    this.color = color;
  }
}

/**
 * Dizilimi greedy botla oynar (sequence_validator.dart:simulateSequence birebir).
 * sequence: renk indeksleri, dockSlots: 0 → dock kapalı.
 */
export function simulateSequence(
  sequence: number[],
  dockSlots: number,
  binCount = 3,
  capacity = 3,
): SolverResult {
  const bins: Bin[] = [];
  const dock: number[] = [];

  // En erken ihtiyaç duyulan, ekranda kutusu olmayan renk; yoksa dock'ta bekleyen.
  function nextBinColor(fromIndex: number): number | null {
    const onScreen = new Set(bins.map((b) => b.color));
    for (let j = fromIndex; j < sequence.length; j++) {
      if (!onScreen.has(sequence[j])) return sequence[j];
    }
    for (const color of dock) {
      if (!onScreen.has(color)) return color;
    }
    return null;
  }

  function place(color: number, fromIndex: number): boolean {
    for (let b = 0; b < bins.length; b++) {
      const bin = bins[b];
      if (bin.color !== color || bin.filled >= capacity) continue;
      bin.filled++;
      if (bin.filled >= capacity) {
        bins.splice(b, 1);
        const next = nextBinColor(fromIndex);
        if (next !== null) bins.push(new Bin(next));
      }
      return true;
    }
    return false;
  }

  function flushDock(fromIndex: number): void {
    let progressed = true;
    while (progressed) {
      progressed = false;
      for (let i = 0; i < dock.length; i++) {
        if (place(dock[i], fromIndex)) {
          dock.splice(i, 1);
          progressed = true;
          break;
        }
      }
    }
  }

  // Açılış kutuları: dizilim başındaki ilk binCount farklı renk.
  for (let i = 0; i < binCount; i++) {
    const color = nextBinColor(0);
    if (color === null) break;
    bins.push(new Bin(color));
  }

  let lost = 0;
  for (let i = 0; i < sequence.length; i++) {
    flushDock(i);
    const color = sequence[i];
    if (place(color, i + 1)) continue;
    if (dock.length < dockSlots) {
      dock.push(color);
      continue;
    }
    lost++;
  }
  flushDock(sequence.length);

  return {
    lost,
    strandedInDock: dock.length,
    get totalLost() {
      return this.lost + this.strandedInDock;
    },
  };
}
