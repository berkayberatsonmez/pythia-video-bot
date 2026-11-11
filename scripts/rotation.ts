// ═══════════════════════════════════════════════════════════════════════════
// rotation.ts — Stateless çok-kategorili rotasyon (CI uyumlu)
//
// İKİ DÖNEM: PLANNER_START (2026-11-11) öncesi günler aşağıdaki ESKİ dizidir
// (legacyVideosForDay; geçmiş yayınlar aynen). O günden itibaren getVideosForDay
// PLANLAYICIYI kullanır: performans ağırlığı (src/data/pool-weights.json) +
// gündem (scripts/gundem.ts) + 21 günlük tekrar yasağı. Ayrıntı dosyanın sonunda.
//
// Tarih-tabanlı deterministik: state dosyası YOK → GitHub Actions'ta
// her çalışma aynı/doğru sonucu verir. Round-robin ile kategoriler
// karışık dizilir (peş peşe aynı kategori gelmez → sabah ve akşam slotu
// her zaman FARKLI kategoriden; bkz. verify-rotation.ts).
// ═══════════════════════════════════════════════════════════════════════════

import { DREAM_SYMBOLS } from "../src/data/dream-symbols";
import { TAROT_CARDS } from "../src/data/tarot-cards";
import { NUMBERS } from "../src/data/numbers";
import { ZODIAC_SIGNS } from "../src/data/zodiac-signs";
import { MANIFESTATIONS } from "../src/data/manifestation";
import { ZODIAC_RANKINGS } from "../src/data/zodiac-rankings";
import { ZODIAC_BEHAVIORS } from "../src/data/zodiac-behaviors";
import { ZODIAC_COMPATIBILITY } from "../src/data/zodiac-compatibility";
import { SEASON_RANKINGS } from "../src/data/zodiac-season-rankings";
import { buildSkyCard, dateToDay, dayToDate, skyEventForDay } from "./sky-events";
import { gundemFocus } from "./gundem";
import { readWeightFile } from "./pool-weights";

export type PoolKey =
  | "dream"
  | "tarot"
  | "numerology"
  | "angel"
  | "zodiac"
  | "manifest"
  | "ranking"
  | "behavior"
  | "compat";

type Pool = {
  comp: string;
  key: string; // props key
  category: string; // render-one kategori adı
  ids: string[];
  label: string;
};

// Rüya sembollerini arama hacmine göre sırala (yüksek önce) → en çok aranan
// içerik ("rüyada yılan/diş görmek" gibi) önce ve daha sık paylaşılsın.
const SEARCH_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
const DREAM_IDS_BY_SEARCH = [...DREAM_SYMBOLS]
  .sort((a, b) => SEARCH_RANK[a.searchVolume] - SEARCH_RANK[b.searchVolume])
  .map((s) => s.id);

export const POOLS: Record<PoolKey, Pool> = {
  dream: {
    comp: "DreamSymbolVideo",
    key: "symbolId",
    category: "dream",
    ids: DREAM_IDS_BY_SEARCH,
    label: "🌙 Rüya",
  },
  tarot: {
    comp: "TarotVideo",
    key: "cardId",
    category: "tarot",
    ids: TAROT_CARDS.map((c) => c.id),
    label: "🃏 Tarot",
  },
  numerology: {
    comp: "NumberVideo",
    key: "numberId",
    category: "number",
    ids: NUMBERS.filter((n) => n.kind === "lifepath").map((n) => n.id),
    label: "🔢 Numeroloji",
  },
  angel: {
    comp: "NumberVideo",
    key: "numberId",
    category: "number",
    ids: NUMBERS.filter((n) => n.kind === "angel").map((n) => n.id),
    label: "✨ Melek Sayısı",
  },
  zodiac: {
    comp: "ZodiacVideo",
    key: "signId",
    category: "zodiac",
    ids: ZODIAC_SIGNS.map((z) => z.id),
    label: "⭐ Burç",
  },
  manifest: {
    comp: "ManifestVideo",
    key: "manifestId",
    category: "manifest",
    ids: MANIFESTATIONS.map((m) => m.id),
    label: "🌕 Manifesto",
  },
  ranking: {
    comp: "RankingVideo",
    key: "rankingId",
    category: "ranking",
    ids: ZODIAC_RANKINGS.map((r) => r.id),
    label: "🏆 Sıralama",
  },
  behavior: {
    comp: "BehaviorVideo",
    key: "behaviorId",
    category: "behavior",
    ids: ZODIAC_BEHAVIORS.map((b) => b.id),
    label: "💔 Davranış",
  },
  compat: {
    comp: "CompatibilityVideo",
    key: "compatId",
    category: "compat",
    ids: ZODIAC_COMPATIBILITY.map((c) => c.id),
    label: "💞 Uyum",
  },
};

export type SelectedVideo = {
  slot: "morning" | "evening";
  poolKey: PoolKey | "sky";
  /** Render'a ek prop (Gök Gündemi: tam `sky` kartı). */
  extraProps?: Record<string, unknown>;
  label: string;
  comp: string;
  category: string;
  propKey: string;
  id: string;
};

// ─── Round-robin master sequence ─────────────────────────────────────────
// Her pooldan sırayla birer eleman al → kategoriler karışır.
// Pool bitince atla. Sonuç: 75 videoluk karışık, deterministik dizi.
const POOL_ORDER: PoolKey[] = [
  "dream",
  "tarot",
  "zodiac",
  "ranking",
  "behavior",
  "compat",
  "numerology",
  "angel",
  "manifest",
];

// İzlenme için ağırlık: popüler/yüksek-aramalı kategoriler daha sık paylaşılır.
// (Rüya/tarot/burç = en çok aranan mistik konular >> numeroloji/melek/manifest)
// ⚠️ ESKİ dizide (buildSequence) yalnız SIRAYI etkiler — geçmiş günleri yeniden
// kurmak için DEĞİŞTİRME. Planlayıcı (aşağıda) bunları yalnız
// src/data/pool-weights.json yoksa varsayılan çarpan olarak kullanır.
const POOL_WEIGHTS: Record<PoolKey, number> = {
  dream: 2,
  tarot: 2,
  zodiac: 2,
  ranking: 2,
  behavior: 2,
  compat: 3, // ilişki içeriği en iyi performans: dizide öne çekilir (2→3)
  numerology: 1,
  angel: 1,
  manifest: 1,
};

// Ağırlıklı, KOMŞUSU FARKLI dizi. Günlük iki slot dizide yan yana iki eleman
// (day*2, day*2+1) olduğundan, sabah ve akşamın FARKLI kategoriden çıkması için
// dizide hiçbir iki komşu (dairesel, son→ilk dahil) aynı pooldan olmamalı.
//
// Her adımda, bir önceki elemanın poolu HARİÇ, "ağırlık × kalan oran"ı en
// yüksek pool seçilir (eşitlikte POOL_ORDER). Ağırlığı 2 olan popüler poollar
// ağırlığı 1 olanlardan önce/sık tüketilir; büyük pool (ör. compat) sona
// yığılmaz çünkü oran poolun kendi boyuna göre ölçülür. Deterministik: Random
// ve tarih yok. Tüm id'ler döngüde tam bir kez geçer.
export function buildSequence(): SelectedVideo[] {
  const seq: SelectedVideo[] = [];
  const cursor: Record<string, number> = {};
  for (const k of POOL_ORDER) cursor[k] = 0;
  const total = POOL_ORDER.reduce((s, k) => s + POOLS[k].ids.length, 0);
  const remainingScore = (k: PoolKey): number => {
    const n = POOLS[k].ids.length;
    return n === 0 ? 0 : (POOL_WEIGHTS[k] * (n - cursor[k])) / n;
  };
  // Kuyruğun sonu ilk elemanla da komşu (dairesel) → ilk poolu sona kadar
  // yasaklama: son eleman ilk elemanın poolundan olamaz.
  let first: PoolKey | null = null;
  while (seq.length < total) {
    const prev = seq.length ? seq[seq.length - 1].poolKey : null;
    const left = total - seq.length;
    let best: PoolKey | null = null;
    let bestScore = 0;
    // Zorunlu seçim: bir poolun kalanı, kalan yuvaların yarısından fazlaysa
    // (kalan*2 > left) komşu çakışması önlenemez hâle gelir → onu şimdi seç.
    // Büyük poolun (compat) dizinin sonuna yığılmasını bu kural engeller.
    const forced = POOL_ORDER.find(
      (k) =>
        k !== prev &&
        (POOLS[k].ids.length - cursor[k]) * 2 > left &&
        cursor[k] < POOLS[k].ids.length,
    );
    for (const k of forced ? [forced] : POOL_ORDER) {
      const pool = POOLS[k];
      if (cursor[k] >= pool.ids.length || k === prev) continue;
      // Son eleman: ilk elemanın poolunu seçme (dairesel komşuluk).
      if (left === 1 && k === first) continue;
      const sc = remainingScore(k);
      if (sc > bestScore) {
        best = k;
        bestScore = sc;
      }
    }
    // Uygulanabilir pool kalmadıysa (kalan hepsi aynı pool) komşu çakışmasını
    // kabul et — verify-rotation bunu yakalar; mevcut veri boyutlarında olmaz.
    if (best === null) {
      best = POOL_ORDER.find((k) => cursor[k] < POOLS[k].ids.length)!;
    }
    const pool = POOLS[best];
    seq.push({
      slot: "morning", // slot sonradan atanır
      poolKey: best,
      label: pool.label,
      comp: pool.comp,
      category: pool.category,
      propKey: pool.key,
      id: pool.ids[cursor[best]],
    });
    cursor[best]++;
    if (first === null) first = best;
  }
  return repairAdjacency(seq);
}

// Açgözlü kurulum, büyük poolun (compat, ağırlık 3) ağırlıkla öne çekilmesinde
// kuyrukta dairesel bir çakışma (son = ilk pool) bırakabiliyor. Çakışan elemanı,
// komşuları kendi poolundan olmayan ilk uygun boşluğa taşır (deterministik:
// soldan sağa ilk uygun yer). Çakışma yoksa dizi aynen döner.
function repairAdjacency(seq: SelectedVideo[]): SelectedVideo[] {
  const n = seq.length;
  const bad = (a: SelectedVideo[], i: number) => a[i].poolKey === a[(i + 1) % a.length].poolKey;
  for (let guard = 0; guard < n; guard++) {
    const i = seq.findIndex((_, k) => bad(seq, k));
    if (i < 0) return seq;
    const j = (i + 1) % n; // taşınacak eleman
    const rest = seq.filter((_, k) => k !== j);
    const m = rest.length;
    let placed = false;
    for (let p = 0; p < m; p++) {
      // rest[p-1] ile rest[p] arasına ekle (dairesel)
      const left = rest[(p - 1 + m) % m];
      const right = rest[p];
      if (left.poolKey !== seq[j].poolKey && right.poolKey !== seq[j].poolKey && left.poolKey !== right.poolKey) {
        rest.splice(p, 0, seq[j]);
        placed = true;
        break;
      }
    }
    if (!placed) return seq; // mevcut veri boyutlarında olmaz; verify-rotation yakalar
    seq = rest;
  }
  return seq;
}

const SEQUENCE = buildSequence();

// Tek seferlik geçiş kaydırması (2026-10-13). Dizi yeniden kurulunca hangi
// id'nin hangi güne düştüğü değişti; hiçbir şey yapılmasaydı eski dizinin son
// 30 günde yayınladığı id'lerin önemli kısmı tekrar çıkardı (yayın tarafında 30
// günlük bir mükerrer koruması yok; worker/dedup yalnız 20 saatlik aynı-başlık
// penceresi). Ofset, geçmiş = eski (round-robin) dizinin 2026-09-13…10-12
// yayınları; gelecek = 2026-10-13…11-11 (Gök Gündemi kaymasıyla, rotasyona
// kalan 54 slot) üzerinden 0..188 tümü denenerek seçildi:
//   uyum ağırlığı 2 → 3 sonrası: ofset 49 → 7/54 çakışma, ofset 54 → 5/54 (en iyi).
// (Önceki seçim, ağırlık 2 ve Gök Gündemi yokken: 49 → 5/60.)
// Komşuluk dairesel olduğundan kaydırma "farklı kategori" değişmezini bozmaz.
// Değiştirme: yeni kaydırma yayın geçmişini yeniden tekrar ettirir.
export const SEQUENCE_OFFSET = 54;

// Gün numarası — epoch'tan bu yana gün sayısı (UTC)
export function dayNumber(): number {
  return Math.floor(Date.now() / 86400000);
}

/**
 * Bugünün 2 videosunu döndürür (sabah + akşam).
 * Tamamen stateless & deterministik — aynı gün her çağrıda aynı sonuç.
 */
export function getTodaysVideos(): SelectedVideo[] {
  return getVideosForDay(dayNumber());
}

// ─── Gök Gündemi (SkyEvent) — akşam slotu ────────────────────────────────
// Gök olayı olan günün AKŞAM slotu SkyEvent videosu olur (sabah rotasyonda
// kalır; olay seçimi/önceliği scripts/sky-events.ts). Yerinden edilen rotasyon
// öğesi KAYBOLMAZ, KAYAR: o gün rotasyondan yalnız 1 öğe tüketilir, dizi
// indeksi ertesi güne 1 eksik ilerler → atlanan akşam öğesi ertesi sabah olur.
// Kayma yalnız SKY_ANCHOR_DAY'den (2026-10-13, devreye alma günü) itibaren
// sayılır; öncesi eski formülle birebir aynı (geçmiş yayınlar etkilenmez, dizi
// geriye gitmediği için geçmişte yayınlanan hiçbir öğe tekrar çıkmaz).
// Komşuluk dairesel farklı olduğundan ardışık iki indeks hep farklı kategoridir:
// "sabah ≠ akşam" ve "ertesi sabah ≠ dünkü sabah" değişmezleri kaymada da geçer.
export const SKY_ANCHOR_DAY = dateToDay("2026-10-13");

function skyVideo(ev: NonNullable<ReturnType<typeof skyEventForDay>>): SelectedVideo {
  return {
    slot: "evening",
    poolKey: "sky",
    label: "🌌 Gök Gündemi",
    comp: "SkyEvent",
    category: "sky",
    propKey: "skyId",
    id: ev.id,
    extraProps: { sky: buildSkyCard(ev) },
  };
}
const shiftAt = new Map<number, number>([[SKY_ANCHOR_DAY, 0]]);
let shiftFilled = SKY_ANCHOR_DAY;

/** [SKY_ANCHOR_DAY, day) arasında akşamı SkyEvent'e giden gün sayısı (artımlı önbellek). */
export function skyShiftBefore(day: number): number {
  if (day <= SKY_ANCHOR_DAY) return 0;
  while (shiftFilled < day) {
    shiftAt.set(shiftFilled + 1, shiftAt.get(shiftFilled)! + (skyEventForDay(shiftFilled) ? 1 : 0));
    shiftFilled++;
  }
  return shiftAt.get(day)!;
}

/**
 * ESKİ (durumsuz dizi) rotasyon: PLANNER_START'tan önceki günler bununla
 * yayınlandı ve aynen böyle kalır. Yeni günler için getVideosForDay kullan.
 */
export function legacyVideosForDay(
  day: number,
  sequence: SelectedVideo[] = SEQUENCE,
  withSky = true,
): SelectedVideo[] {
  const len = sequence.length;
  const base = day * 2 + SEQUENCE_OFFSET - (withSky ? skyShiftBefore(day) : 0);
  const morning = { ...sequence[base % len], slot: "morning" as const };
  const ev = withSky ? skyEventForDay(day) : null;
  if (ev) return [morning, skyVideo(ev)];
  const evening = { ...sequence[(base + 1) % len], slot: "evening" as const };
  return [morning, evening];
}

// ═══════════════════════════════════════════════════════════════════════════
// PLANLAYICI (PLANNER_START'tan itibaren) — performans ağırlığı + gündem
//
// Neden yeni bir yapı: eski dizide ağırlık yalnız SIRAYI değiştiriyordu (her öğe
// döngüde tam bir kez → sıklık pool boyuyla sabit) ve ağırlık değişince dizi
// baştan kuruluyor, yakın geçmişte yayınlanan öğeler tekrar çıkabiliyordu
// (SEQUENCE_OFFSET yorumu). Planlayıcı bunun yerine günleri SIRAYLA simüle eder:
//
//   • Durum: pool kredileri (SWRR) + her öğenin en son yayınlandığı slot + önceki
//     slotun pool'u + gündem kotaları. Başlangıç durumu ESKİ rotasyonun son 120
//     gününden kurulur (gerçek yayın geçmişi) → geçişte tekrar yok.
//   • Pool seçimi: smooth weighted round-robin. Etkin ağırlık = ağırlık × pool
//     boyu (2 = eski sıklık), tek pool payı ≤ %40. Her slotta bütün pool'lar
//     etkin ağırlığı kadar kredi kazanır; UYGUN olanlardan en yüksek kredili
//     seçilir ve toplam kadar kredisi düşer.
//   • Uygunluk: önceki slotla (dünkü akşam / Gök Gündemi dahil) aynı pool değil
//     VE pool'da son NO_REPEAT_DAYS günde yayınlanmamış öğe var.
//   • Öğe: pool'un EN UZUN SÜREDİR yayınlanmamış öğesi (eşitlikte veri sırası).
//   • Gündem (scripts/gundem.ts): günde en çok bir slot odak içeriğine gider
//     (önce sabah — TikTok da sabahı kullanır); aynı uygunluk kuralları geçerli.
//   • Ağırlıklar src/data/pool-weights.json'dan, GÜN BAZINDA: her kaydın `from`
//     günü var, geçmiş günler o gün yürürlükteki ağırlıkla yeniden kurulur →
//     haftalık ağırlık değişimi geçmişi değiştirmez, tekrar önleme bozulmaz.
//
// Saf ve deterministik: girdiler = gün, ağırlık dosyası, gök/takvim (astronomy-
// engine). Ağ, saat, trend dosyası, rastgelelik YOK → IG sabah, IG akşam,
// YouTube ve TikTok koşuları aynı gün aynı seçimi bulur.
// ═══════════════════════════════════════════════════════════════════════════

/** Planlayıcının ilk günü. Bu günden ÖNCE main'e alınmalı (yoksa ileri al). */
export const PLANNER_START_DATE = "2026-11-11";
export const PLANNER_START = dateToDay(PLANNER_START_DATE);
/** Aynı öğe bu kadar gün içinde iki kez yayınlanmaz. */
export const NO_REPEAT_DAYS = 21;
/** Tek pool'un rotasyon slotlarındaki en büyük payı. */
export const MAX_POOL_SHARE = 0.4;
const SEED_DAYS = 120;
/** Gündem öğesini kaç gün önceden normal rotasyondan sakla. */
const RESERVE_DAYS = 14;

export type WeightSchedule = { from: number; weights: Record<PoolKey, number> }[];

/** Dosya yoksa: eski sabitler (POOL_WEIGHTS) — çarpan olarak, 2 = eski sıklık. */
export function loadWeightSchedule(file?: string): WeightSchedule {
  const f = readWeightFile(file);
  const sched: WeightSchedule = [{ from: PLANNER_START, weights: { ...POOL_WEIGHTS } }];
  for (const e of f?.entries ?? []) {
    const from = Math.max(PLANNER_START, dateToDay(e.from));
    while (sched.length && sched[sched.length - 1].from >= from) sched.pop();
    sched.push({ from, weights: { ...e.weights } });
  }
  return sched;
}

/** Ağırlık → pool payı (ağırlık × boy, tek pool ≤ MAX_POOL_SHARE; fazlası diğerlerine orantılı). */
export function poolShares(weights: Record<PoolKey, number>): Record<PoolKey, number> {
  const raw = POOL_ORDER.map((k) => Math.max(0, weights[k]) * POOLS[k].ids.length);
  const share = Object.fromEntries(POOL_ORDER.map((k) => [k, 0])) as Record<PoolKey, number>;
  let free = POOL_ORDER.map((_, i) => i);
  let mass = 1;
  for (let guard = 0; guard < POOL_ORDER.length && free.length; guard++) {
    const tot = free.reduce((a, i) => a + raw[i], 0);
    const over = free.filter((i) => (raw[i] / tot) * mass > MAX_POOL_SHARE);
    if (!over.length) {
      for (const i of free) share[POOL_ORDER[i]] = (raw[i] / tot) * mass;
      break;
    }
    for (const i of over) share[POOL_ORDER[i]] = MAX_POOL_SHARE;
    mass -= over.length * MAX_POOL_SHARE;
    free = free.filter((i) => !over.includes(i));
  }
  return share;
}

export type PlannedDay = { day: number; videos: SelectedVideo[]; focus?: string; relaxed: number };

const itemKey = (pool: string, id: string) => `${pool}:${id}`;

function videoFor(pool: PoolKey, id: string, slot: "morning" | "evening"): SelectedVideo {
  const p = POOLS[pool];
  return { slot, poolKey: pool, label: p.label, comp: p.comp, category: p.category, propKey: p.key, id };
}

/** Geçerli bir odak öğesi mi (verify-planner tüm gündem id'lerini sınar). */
export function focusItemExists(pool: PoolKey, id: string): boolean {
  if (POOLS[pool].ids.includes(id)) return true;
  return pool === "ranking" && SEASON_RANKINGS.some((r) => r.id === id);
}

export function createPlanner(schedule: WeightSchedule = loadWeightSchedule(), start = PLANNER_START) {
  const blockSlots = NO_REPEAT_DAYS * 2;
  const last = new Map<string, number>(); // öğe → son yayın slot no (gün*2+slot)
  const credits = Object.fromEntries(POOL_ORDER.map((k) => [k, 0])) as Record<PoolKey, number>;
  const focusLog: { key: string; day: number }[] = [];
  let prevPool: string | null = null;
  const days: PlannedDay[] = [];

  // Başlangıç durumu: eski rotasyonun gerçek yayınları.
  for (let d = start - SEED_DAYS; d < start; d++) {
    const vs = legacyVideosForDay(d);
    vs.forEach((v, i) => {
      if (v.poolKey !== "sky") last.set(itemKey(v.poolKey, v.id), d * 2 + i);
    });
    prevPool = vs[vs.length - 1].poolKey;
  }

  const weightsOn = (d: number) => {
    let w = schedule[0].weights;
    for (const e of schedule) if (e.from <= d) w = e.weights;
    return w;
  };
  const sharesCache = new Map<Record<PoolKey, number>, Record<PoolKey, number>>();
  const sharesOn = (d: number) => {
    const w = weightsOn(d);
    let s = sharesCache.get(w);
    if (!s) sharesCache.set(w, (s = poolShares(w)));
    return s;
  };

  const blocked = (pool: string, id: string, slotNo: number) => {
    const l = last.get(itemKey(pool, id));
    return l !== undefined && slotNo - l < blockSlots;
  };
  /**
   * Önümüzdeki RESERVE_DAYS gündeki gündem odaklarının ilk (kota+1) öğesi:
   * normal rotasyon bunları mümkünse ATLAR ki odak günü geldiğinde tekrar
   * penceresine takılmasınlar (ör. Yay sezonundan 6 gün önce "Yay" burç videosu).
   */
  const reservedCache = new Map<number, Set<string>>();
  const reservedOn = (d: number): Set<string> => {
    let r = reservedCache.get(d);
    if (!r) {
      r = new Set<string>();
      for (let x = d + 1; x <= d + RESERVE_DAYS; x++)
        for (const f of gundemFocus(dayToDate(x)))
          for (const p of f.picks.filter((q) => q.id).slice(0, f.cap + 1)) r.add(itemKey(p.pool, p.id!));
      reservedCache.set(d, r);
      reservedCache.delete(d - 2);
    }
    return r;
  };
  /** Pool'un en uzun süredir yayınlanmamış uygun öğesi (yoksa null); ayrılmış öğeler en sona. */
  const lru = (pool: PoolKey, slotNo: number, ignoreBlock = false): string | null => {
    const reserved = reservedOn(Math.floor(slotNo / 2));
    let best: string | null = null;
    let bestRank = Infinity;
    for (const id of POOLS[pool].ids) {
      if (!ignoreBlock && blocked(pool, id, slotNo)) continue;
      const at = last.get(itemKey(pool, id)) ?? -1e9;
      const rank = at + (reserved.has(itemKey(pool, id)) ? 1e12 : 0);
      if (rank < bestRank) {
        best = id;
        bestRank = rank;
      }
    }
    return best;
  };

  const focusPick = (d: number, slotNo: number): { pool: PoolKey; id: string; key: string; reason: string } | null => {
    for (const f of gundemFocus(dayToDate(d))) {
      const used = focusLog.filter((x) => x.key === f.key && d - x.day < f.window).length;
      if (used >= f.cap) continue;
      for (const p of f.picks) {
        if (p.pool === prevPool) continue;
        const id = p.id ?? lru(p.pool, slotNo);
        if (!id || blocked(p.pool, id, slotNo)) continue;
        return { pool: p.pool, id, key: f.key, reason: f.reason };
      }
    }
    return null;
  };

  const take = (d: number, slot: "morning" | "evening", pool: PoolKey, id: string, shares: Record<PoolKey, number>) => {
    for (const k of POOL_ORDER) credits[k] += shares[k];
    credits[pool] -= 1;
    // Uzun süre seçilemeyen pool'un kredisi şişip ardışık patlama yapmasın.
    for (const k of POOL_ORDER) credits[k] = Math.max(-2, Math.min(2, credits[k]));
    last.set(itemKey(pool, id), d * 2 + (slot === "morning" ? 0 : 1));
    prevPool = pool;
    return videoFor(pool, id, slot);
  };

  const planDay = (d: number): PlannedDay => {
    const shares = sharesOn(d);
    const ev = skyEventForDay(d);
    const slots: ("morning" | "evening")[] = ev ? ["morning"] : ["morning", "evening"];
    const videos: SelectedVideo[] = [];
    let focus: string | undefined;
    let relaxed = 0;
    for (const slot of slots) {
      const slotNo = d * 2 + (slot === "morning" ? 0 : 1);
      if (!focus) {
        const f = focusPick(d, slotNo);
        if (f) {
          focusLog.push({ key: f.key, day: d });
          focus = `${f.reason} → ${f.pool}:${f.id} (${slot})`;
          videos.push(take(d, slot, f.pool, f.id, shares));
          continue;
        }
      }
      let pick: { pool: PoolKey; id: string } | null = null;
      let bestC = -Infinity;
      for (const k of POOL_ORDER) {
        if (k === prevPool) continue;
        const c = credits[k] + shares[k];
        if (c <= bestC) continue;
        const id = lru(k, slotNo);
        if (!id) continue;
        pick = { pool: k, id };
        bestC = c;
      }
      if (!pick) {
        // Mevcut veri boyutlarında olmaz (verify-planner sınar): pencereyi gevşet.
        relaxed++;
        for (const k of POOL_ORDER) {
          if (k === prevPool) continue;
          const c = credits[k] + shares[k];
          if (c > bestC) {
            pick = { pool: k, id: lru(k, slotNo, true)! };
            bestC = c;
          }
        }
      }
      videos.push(take(d, slot, pick!.pool, pick!.id, shares));
    }
    if (ev) {
      videos.push(skyVideo(ev));
      prevPool = "sky";
    }
    return { day: d, videos, focus, relaxed };
  };

  return {
    start,
    /** d ≥ start için o günün planı (artımlı önbellek; geriye gitmez). */
    plan(d: number): PlannedDay {
      if (d < start) throw new Error(`planner: ${dayToDate(d)} < ${dayToDate(start)}`);
      while (days.length <= d - start) days.push(planDay(start + days.length));
      return days[d - start];
    },
  };
}

let defaultPlanner: ReturnType<typeof createPlanner> | null = null;

/**
 * Verilen gün numarası (epoch'tan bu yana UTC gün) için sabah+akşam.
 * PLANNER_START öncesi: eski dizi (geçmiş yayınlar aynen). Sonrası: planlayıcı.
 */
export function getVideosForDay(day: number): SelectedVideo[] {
  if (day < PLANNER_START) return legacyVideosForDay(day);
  defaultPlanner ??= createPlanner();
  return defaultPlanner.plan(day).videos;
}

// ─── CLI önizleme ────────────────────────────────────────────────────────
// Ayrıntılı eski/yeni karşılaştırma: npm run plan:preview (scripts/plan-preview.ts)
if (process.argv.includes("--preview")) {
  const picks = getTodaysVideos();
  const stamp = new Date().toLocaleDateString("tr-TR");
  console.log(`\n📅 ${stamp} — Bugünün videoları:\n`);
  for (const p of picks) {
    const slotTime = p.slot === "morning" ? "13:00" : "20:30";
    console.log(`  ${slotTime}  ${p.label}  →  ${p.id}`);
    console.log(`         npm run video -- ${p.category} ${p.id}\n`);
  }
  if (dayNumber() >= PLANNER_START) {
    const f = createPlanner().plan(dayNumber()).focus;
    if (f) console.log(`🗞️  Gündem: ${f}\n`);
  }
}
