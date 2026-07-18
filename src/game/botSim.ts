// ═══════════════════════════════════════════════════════════════════════════
// botSim.ts — Bot oyuncu → izlenebilir eylem zaman çizelgesi
//
// sequence_validator'daki greedy planı (bin açma/mühür/dock kararları) BİREBİR
// izler → aynı kayıp sayısı (adalet doğrulaması garantisi korunur). Üstüne
// tek-el, insansı zamanlama giydirir: gerçekçi sürükleme süreleri (250-450ms,
// easing), hamleler arası mikro beklemeler, nearMiss modunda 1-2 paketi tehlike
// bölgesine kadar bekletme. Varsayılan mod ("clean") 3★ temiz el: ASLA kayıp.
//
// Çıktı GameReplay.tsx tarafından kare kare render edilir; determinizm: aynı
// seed + config + mod → aynı çizelge (humanization mulberry32 ile seed'li).
// ═══════════════════════════════════════════════════════════════════════════

import {
  ITEM_SPAWN_X,
  beltSpeed as beltSpeedFor,
  beltCenterY,
  binSlotX,
  binY,
  dockSlotCenters,
  ITEM_LOST_X,
} from "./layout";
import { buildSpawnSequence, type LevelConfig } from "./levelConfig";
import { effElapsed, NO_SLOWDOWN, type SpeedProfile } from "./speedProfile";

export type BotMode = "clean" | "nearMiss" | "failBait" | "boosterSave";

// Yavaşlat booster'ı (BoosterSave): t anında tetiklenir, dur boyunca bant 0.5×.
export type BoosterEvent = { t: number; dur: number; coinBefore: number; coinCost: number };

// ─── Render segmentleri (item hareketi) ─────────────────────────────────────
export type Seg =
  | { k: "belt"; t0: number; t1: number } // bantta akar (x formülle)
  | { k: "drag"; t0: number; t1: number; x0: number; y0: number; x1: number; y1: number }
  | { k: "absorb"; t0: number; t1: number; x: number; y: number } // kutuya emilir
  | { k: "dockIn"; t0: number; t1: number; x0: number; y0: number; x1: number; y1: number }
  | { k: "dockHold"; t0: number; t1: number; x: number; y: number }
  | { k: "lost"; t0: number; t1: number }; // bant sonundan düşer

export type ItemTrack = {
  id: number;
  color: number;
  spawnT: number;
  bs: number; // belt hızı (px/sn)
  segs: Seg[];
  fate: "binned" | "lost";
};

export type BinLife = {
  slot: number;
  x: number;
  y: number;
  color: number;
  openT: number;
  fills: number[]; // paket bırakma zamanları (0..3)
  sealStartT?: number; // mühür animasyonu başlangıcı (dolunca)
  closeT: number; // slottan kalktığı an (sealStart + seal süresi) ya da Infinity
};

export type AudioEvent = { t: number; sfx: "drop" | "seal" | "dock" | "lost" | "win" };

export type SimResult = {
  config: LevelConfig;
  seed: number;
  mode: BotMode;
  sequence: number[];
  tracks: ItemTrack[];
  bins: BinLife[];
  dockSlotCount: number;
  audio: AudioEvent[];
  finishTimeSec: number; // son paket çözülme anı (hook "0:XX" bunu kullanır)
  totalSec: number; // videonun oyun kısmı toplam süresi (win pad dahil)
  sealedCount: number;
  lostCount: number;
  resolvedCount: number;
  speedProfile: SpeedProfile; // zaman-değişken bant hızı (booster; kimlik = değişmez)
  tensionT?: number; // FailBait: dondurma anı (paket tehlikede, düşmeye ~0.4sn kala)
  booster?: BoosterEvent; // BoosterSave: yavaşlat tetiği + coin düşüşü
};

// Seal animasyonu: büyü (0.15) + küçül (0.2) = 0.35 sn (bin_component _seal).
const SEAL_DUR = 0.35;
const ABSORB_DUR = 0.12; // accept MoveToEffect
const WIN_PAD = 1.3; // son çözülmeden sonra kutlama payı

/**
 * En mühür-yoğun `dur` saniyelik pencereyi bulur (SealCompilation kesitleri için).
 * Mühür başlangıç zamanlarına bakar; en çok mühür içeren pencereyi döndürür.
 */
export function bestSealWindow(sim: SimResult, dur: number): { start: number; dur: number } {
  const seals = sim.bins
    .filter((b) => b.sealStartT != null)
    .map((b) => b.sealStartT as number)
    .sort((a, b) => a - b);
  if (seals.length === 0) return { start: 0, dur: Math.min(dur, sim.totalSec) };
  let best = { start: Math.max(0, seals[0] - 0.8), count: 0 };
  for (const s of seals) {
    const start = Math.max(0, s - 0.8);
    const count = seals.filter((x) => x >= start && x < start + dur).length;
    if (count > best.count) best = { start, count };
  }
  return { start: best.start, dur: Math.min(dur, sim.totalSec - best.start) };
}

// ─── Seed'li PRNG (humanization) — mulberry32, determinizm için ────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type SimBin = { color: number; filled: number; sealing: boolean; life: BinLife };

export function simulate(
  config: LevelConfig,
  seed: number,
  mode: BotMode = "clean",
): SimResult {
  const sequence = buildSpawnSequence(config, seed);
  const n = sequence.length;
  const bs = beltSpeedFor(config.crossTime);
  const modeSalt = { clean: 0, nearMiss: 0x9e3779b9, failBait: 0x85ebca6b, boosterSave: 0xc2b2ae35 }[mode];
  const rnd = mulberry32((seed ^ modeSalt) >>> 0);

  // Zamanlama: spawn[i] = (i+1)*spawnInterval; item lostT = bant sonuna varış.
  const spawnT = (i: number) => (i + 1) * config.spawnInterval;
  const travelToLost = (ITEM_LOST_X - ITEM_SPAWN_X) / bs;
  const lostT = (i: number) => spawnT(i) + travelToLost;

  // ── Hız profili (BoosterSave yavaşlatması) — kimlik varsayılan ────────────
  let speedProfile: SpeedProfile = NO_SLOWDOWN;
  let booster: BoosterEvent | undefined;
  if (mode === "boosterSave") {
    const boosterT = 0.4 * n * config.spawnInterval;
    const dur = 3.5;
    speedProfile = [
      { from: 0, factor: 1 },
      { from: boosterT, factor: 0.5 },
      { from: boosterT + dur, factor: 1 },
    ];
    booster = { t: boosterT, dur, coinBefore: 340, coinCost: 150 };
  }

  const dockCenters = dockSlotCenters(config.dockSlots);

  // nearMiss: 1-2 paketi bilerek geç kap (tehlike bölgesi). Erken paketleri seç
  // (izleyici gerilimi görsün, sonda telaş olmasın).
  const nearMissIds = new Set<number>();
  if ((mode === "nearMiss" || mode === "failBait") && n > 6) {
    const count = 1 + (rnd() < 0.5 ? 0 : 1);
    for (let k = 0; k < count; k++) {
      nearMissIds.add(3 + Math.floor(rnd() * Math.min(6, n - 4)));
    }
  }

  // ── item durumları ────────────────────────────────────────────────────────
  type IState = "unspawned" | "belt" | "dock" | "binned" | "lost";
  const state: IState[] = sequence.map(() => "unspawned");
  const tracks: ItemTrack[] = sequence.map((color, id) => ({
    id,
    color,
    spawnT: spawnT(id),
    bs,
    segs: [],
    fate: "binned",
  }));
  const binLives: BinLife[] = [];
  const audio: AudioEvent[] = [];

  const remaining = (color: number): number => {
    let c = 0;
    for (let i = 0; i < n; i++) {
      if (sequence[i] === color && state[i] !== "binned" && state[i] !== "lost") c++;
    }
    return c;
  };

  // Ekrandaki 3 slot. null = boş (renk yok).
  const slots: (SimBin | null)[] = [null, null, null];

  const onScreenColors = (): Set<number> => {
    const s = new Set<number>();
    for (const b of slots) if (b && !b.sealing) s.add(b.color);
    return s;
  };

  // nextBinColor — conveyor_game._nextBinColor / validator nextBinColor birebir mantık.
  const nextBinColor = (): number | null => {
    const onScreen = onScreenColors();
    for (let i = 0; i < n; i++) {
      const st = state[i];
      if (st === "binned" || st === "lost") continue;
      if (!onScreen.has(sequence[i]) && remaining(sequence[i]) > 0) return sequence[i];
    }
    // duplicate fallback: kalan paketi olan (ekranda) renk
    for (let c = 0; c < config.colorCount; c++) {
      if (remaining(c) > 0) return c;
    }
    return null;
  };

  const openBinAt = (slotIdx: number, color: number, t: number): SimBin => {
    const life: BinLife = {
      slot: slotIdx,
      x: binSlotX(slotIdx),
      y: binY,
      color,
      openT: t,
      fills: [],
      closeT: Infinity,
    };
    binLives.push(life);
    const b: SimBin = { color, filled: 0, sealing: false, life };
    slots[slotIdx] = b;
    return b;
  };

  // Açılış: 3 slot nextBinColor ile (t=0).
  for (let s = 0; s < 3; s++) {
    const c = nextBinColor();
    if (c === null) break;
    openBinAt(s, c, 0);
  }

  // ── el (hand) zamanlaması ──────────────────────────────────────────────────
  let handFreeAt = 0;
  let sealedCount = 0;
  let lostCount = 0;
  let resolvedCount = 0;
  let lastResolveT = 0;

  const microWait = () => 0.05 + rnd() * 0.13;
  const dragDur = (dist: number) => Math.min(0.45, Math.max(0.25, 0.2 + dist / 2600));

  // "Satisfying flow": paketi hemen kapma — bandın ortasına (%48-66) gelene dek
  // beklet. Böylece aynı anda 2-3 paket akar. Güvenli son an clamp'i kayıp önler.
  const grabZoneT = (id: number) => spawnT(id) + (0.48 + rnd() * 0.18) * config.crossTime;
  const safeLatest = (id: number) => lostT(id) - 0.9;

  const dist = (x0: number, y0: number, x1: number, y1: number) =>
    Math.hypot(x1 - x0, y1 - y0);
  // Bant konumu hız profiliyle (kimlik profilde = spawnX + bs*(t-spawnT)).
  const beltX = (i: number, t: number) =>
    ITEM_SPAWN_X + bs * effElapsed(speedProfile, spawnT(i), t);

  // Bir belt/dock paketini kutuya YERLEŞTİR (drag + drop + gerekiyorsa mühür).
  const placeItem = (id: number, slotIdx: number) => {
    const b = slots[slotIdx]!;
    const fromDock = state[id] === "dock";
    // grab zamanı — banttaki paketi ortaya gelene dek beklet (akış), dock'taki hemen.
    let grabT = fromDock
      ? handFreeAt + microWait()
      : Math.max(handFreeAt + microWait(), grabZoneT(id));
    if (!fromDock && nearMissIds.has(id)) {
      // tehlike bölgesine kadar beklet (ama güvenli: 0.7-0.95 sn pay)
      const grace = 0.7 + rnd() * 0.25;
      grabT = Math.max(grabT, lostT(id) - grace - 0.3);
    }
    // güvenli son an: asla kayıp verme (banttaki paketler için)
    if (!fromDock) grabT = Math.min(grabT, safeLatest(id));
    // paketin o an konumu
    let x0: number, y0: number;
    if (fromDock) {
      const dc = dockCenters[dockSlotOf(id)];
      x0 = dc.x;
      y0 = dc.y;
      freeDock(id);
    } else {
      x0 = beltX(id, grabT);
      y0 = beltCenterY;
      // belt segmenti (spawn → grab)
      tracks[id].segs.push({ k: "belt", t0: spawnT(id), t1: grabT });
    }
    const x1 = b.life.x;
    const y1 = b.life.y;
    const dur = dragDur(dist(x0, y0, x1, y1));
    const dropT = grabT + dur;
    tracks[id].segs.push({ k: "drag", t0: grabT, t1: dropT, x0, y0, x1, y1 });
    tracks[id].segs.push({ k: "absorb", t0: dropT, t1: dropT + ABSORB_DUR, x: x1, y: y1 });
    tracks[id].fate = "binned";
    state[id] = "binned";
    resolvedCount++;
    lastResolveT = Math.max(lastResolveT, dropT + ABSORB_DUR);
    handFreeAt = dropT;
    audio.push({ t: dropT, sfx: "drop" });

    b.filled++;
    b.life.fills.push(dropT);
    if (b.filled >= 3) {
      // mühür
      b.sealing = true;
      b.life.sealStartT = dropT + ABSORB_DUR;
      b.life.closeT = b.life.sealStartT + SEAL_DUR;
      audio.push({ t: b.life.sealStartT, sfx: "seal" });
      sealedCount++;
      slots[slotIdx] = null;
      const nc = nextBinColor();
      if (nc !== null) openBinAt(slotIdx, nc, b.life.closeT);
    }
  };

  // dock yardımcıları
  const dockArr: (number | null)[] = new Array(config.dockSlots).fill(null);
  const dockSlotOf = (id: number) => dockArr.indexOf(id);
  const freeDock = (id: number) => {
    const k = dockArr.indexOf(id);
    if (k !== -1) dockArr[k] = null;
  };
  const dockItem = (id: number) => {
    const k = dockArr.indexOf(null);
    if (k === -1) return false;
    let grabT = Math.max(handFreeAt + microWait(), grabZoneT(id));
    grabT = Math.min(grabT, safeLatest(id));
    const x0 = beltX(id, grabT);
    const y0 = beltCenterY;
    const c = dockCenters[k];
    const dur = dragDur(dist(x0, y0, c.x, c.y));
    const parkT = grabT + dur;
    tracks[id].segs.push({ k: "belt", t0: spawnT(id), t1: grabT });
    tracks[id].segs.push({ k: "dockIn", t0: grabT, t1: parkT, x0, y0, x1: c.x, y1: c.y });
    tracks[id].segs.push({ k: "dockHold", t0: parkT, t1: Infinity, x: c.x, y: c.y });
    dockArr[k] = id;
    state[id] = "dock";
    handFreeAt = parkT;
    audio.push({ t: parkT, sfx: "dock" });
    return true;
  };

  const matchingOpenSlot = (color: number): number => {
    for (let s = 0; s < 3; s++) {
      const b = slots[s];
      if (b && !b.sealing && b.color === color && b.filled < 3) return s;
    }
    return -1;
  };

  // ── ana döngü: validator plan sırası (arrival order) + dock flush ──────────
  const flushDock = () => {
    let progressed = true;
    while (progressed) {
      progressed = false;
      for (let k = 0; k < dockArr.length; k++) {
        const id = dockArr[k];
        if (id === null) continue;
        const slotIdx = matchingOpenSlot(sequence[id]);
        if (slotIdx !== -1) {
          placeItem(id, slotIdx);
          progressed = true;
          break;
        }
      }
    }
  };

  for (let i = 0; i < n; i++) {
    state[i] = "belt";
    flushDock();
    const color = sequence[i];
    const slotIdx = matchingOpenSlot(color);
    if (slotIdx !== -1) {
      placeItem(i, slotIdx);
      continue;
    }
    if (dockItem(i)) continue;
    // kutu yok, dock dolu → kayıp (clean/adil dizilimde OLMAZ; showcase bütçesinde olabilir)
    tracks[i].segs.push({ k: "belt", t0: spawnT(i), t1: lostT(i) });
    tracks[i].segs.push({ k: "lost", t0: lostT(i), t1: lostT(i) + 0.25 });
    tracks[i].fate = "lost";
    state[i] = "lost";
    lostCount++;
    audio.push({ t: lostT(i), sfx: "lost" });
  }
  flushDock();

  // ── FailBait: bir "yem" paketi tehlike bölgesine sokup dondurma anı belirle ──
  let tensionT: number | undefined;
  if (mode === "failBait") {
    // 0.6n civarında, banttan kutuya giden (belt→drag) bir paket seç.
    const target = Math.floor(n * 0.6);
    let baitId = -1;
    for (let d = 0; d < n; d++) {
      for (const cand of [target + d, target - d]) {
        if (cand < 0 || cand >= n) continue;
        const t = tracks[cand];
        if (t.segs[0]?.k === "belt" && t.segs.some((s) => s.k === "drag")) {
          baitId = cand;
          break;
        }
      }
      if (baitId !== -1) break;
    }
    if (baitId !== -1) {
      const bait = tracks[baitId];
      // Belt segmentini tehlikeye kadar uzat (drag segmenti asla gösterilmez).
      const beltSeg = bait.segs.find((s) => s.k === "belt");
      if (beltSeg) beltSeg.t1 = lostT(baitId) - 0.12;
      tensionT = lostT(baitId) - 0.42;
    }
  }

  const finishTimeSec = lastResolveT;
  const totalSec = Math.max(lastResolveT, ...audio.map((a) => a.t), 0) + WIN_PAD;
  audio.push({ t: finishTimeSec + 0.15, sfx: "win" });

  return {
    config,
    seed,
    mode,
    sequence,
    tracks,
    bins: binLives,
    dockSlotCount: config.dockSlots,
    audio: audio.sort((a, b) => a.t - b.t),
    finishTimeSec,
    totalSec,
    sealedCount,
    lostCount,
    resolvedCount,
    speedProfile,
    tensionT,
    booster,
  };
}
