// verify-weights.ts — performans ağırlığı hesabı (saf; sentetik günlükle, ağ yok).
//   örnek seçimi (en son ölçüm, IG, 28 gün, ≥3 günlük), shrinkage, [1,4] sınırı,
//   veri yoksa nötr 2, sky ağırlık almaz, deterministik, dosya şeması ve ekleme kuralı.
// Çalıştır: npm run verify:weights
import type { Event } from "./analytics/ledger";
import {
  appendEntry,
  computePoolWeights,
  MAX_WEIGHT,
  MIN_WEIGHT,
  NEUTRAL_WEIGHT,
  readWeightFile,
  validateWeightFile,
  WEIGHT_POOLS,
  type WeightEntry,
} from "./pool-weights";
import { PLANNER_START_DATE } from "./rotation";

let fail = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✅" : "❌"} ${msg}`);
  if (!ok) fail++;
};

const AS_OF = Date.parse("2026-11-06T00:00:00Z");
const D = 86400000;
let seq = 0;
function snap(format: string, views: number, o: { pubDaysAgo?: number; ageDays?: number; id?: string; platform?: Event["platform"]; shares?: number; saves?: number } = {}): Event {
  const pub = AS_OF - (o.pubDaysAgo ?? 10) * D;
  seq++;
  return {
    schema: 1,
    eventId: `e${String(seq).padStart(5, "0")}`,
    at: new Date(pub + (o.ageDays ?? 5) * D).toISOString(),
    runId: "t",
    kind: "snapshot",
    platform: o.platform ?? "instagram",
    provider: "instagram",
    attemptId: `a${seq}`,
    content: { contentId: `${format}-${seq}`, format, title: "" },
    state: "published",
    platformId: o.id ?? `p${seq}`,
    publishedAt: new Date(pub).toISOString(),
    metrics: { views, likes: 0, comments: 0, shares: o.shares ?? 0, saves: o.saves ?? 0, reach: null },
  };
}
const many = (format: string, views: number, n: number) => Array.from({ length: n }, () => snap(format, views));
const allPools = (views: number, n = 3) => WEIGHT_POOLS.flatMap((p) => many(p, views, n));

// Eşit performans → herkes nötr.
{
  const r = computePoolWeights(allPools(200), AS_OF);
  check(WEIGHT_POOLS.every((p) => r.weights[p] === NEUTRAL_WEIGHT), `eşit performans → hepsi ${NEUTRAL_WEIGHT}`);
}
// Güçlü pool yükselir, zayıf düşer; sınırlar.
{
  const ev = [...allPools(200, 6), ...many("compat", 20000, 6), ...many("dream", 5, 6)];
  const r = computePoolWeights(ev, AS_OF);
  check(r.weights.compat === MAX_WEIGHT, `çok güçlü pool → ${MAX_WEIGHT} (compat=${r.weights.compat})`);
  check(r.weights.dream === MIN_WEIGHT, `çok zayıf pool → ${MIN_WEIGHT}, sıfır değil (dream=${r.weights.dream})`);
  check(WEIGHT_POOLS.every((p) => r.weights[p] >= MIN_WEIGHT && r.weights[p] <= MAX_WEIGHT && (r.weights[p] * 4) % 1 === 0), "hepsi [1,4] ve 0,25 adım");
}
// Shrinkage: tek viral video az örnekli pool'u tavana taşımaz.
{
  const one = computePoolWeights([...allPools(200, 6).filter((e) => e.content.format !== "zodiac"), snap("zodiac", 9000)], AS_OF);
  const many6 = computePoolWeights([...allPools(200, 6).filter((e) => e.content.format !== "zodiac"), ...many("zodiac", 9000, 6)], AS_OF);
  check(one.weights.zodiac < many6.weights.zodiac, `shrinkage: 1 viral video (${one.weights.zodiac}) < 6 viral video (${many6.weights.zodiac})`);
}
// Veri yoksa nötr.
{
  const r = computePoolWeights(allPools(200).filter((e) => e.content.format !== "angel"), AS_OF);
  check(r.weights.angel === NEUTRAL_WEIGHT && r.samples.angel === 0, "verisi olmayan pool → nötr 2");
  const empty = computePoolWeights([], AS_OF);
  check(WEIGHT_POOLS.every((p) => empty.weights[p] === NEUTRAL_WEIGHT) && empty.total === 0, "boş günlük → hepsi 2, örnek 0");
}
// Örnek seçimi.
{
  const base = allPools(200);
  const r0 = computePoolWeights(base, AS_OF);
  const withNoise = [
    ...base,
    snap("dream", 99999, { platform: "youtube" }), // IG değil
    snap("dream", 99999, { pubDaysAgo: 40 }), // pencere dışı
    snap("dream", 99999, { pubDaysAgo: 2, ageDays: 1 }), // çok taze
    snap("dream", 99999, { pubDaysAgo: -1 }), // gelecekte
  ];
  check(JSON.stringify(computePoolWeights(withNoise, AS_OF).weights) === JSON.stringify(r0.weights), "YouTube, 28 gün dışı, <3 günlük ve gelecekteki ölçümler sayılmaz");
  const sky = computePoolWeights([...base, ...many("sky", 50000, 5)], AS_OF);
  check(JSON.stringify(sky.weights) === JSON.stringify(r0.weights) && sky.samples.sky === 5 && !("sky" in sky.weights), "sky raporlanır ama ağırlık almaz, genel ortalamayı etkilemez");
  // Aynı gönderinin iki ölçümü: en sonuncusu sayılır (tek örnek).
  const early = snap("tarot", 10, { id: "same", ageDays: 4 });
  const late = snap("tarot", 50000, { id: "same", ageDays: 9 });
  const r = computePoolWeights([...base, early, late], AS_OF);
  check(r.samples.tarot === 4 && r.weights.tarot > r0.weights.tarot, "aynı gönderi → yalnız EN SON ölçüm, tek örnek");
  const eng = computePoolWeights([...base.filter((e) => e.content.format !== "behavior"), ...Array.from({ length: 3 }, () => snap("behavior", 200, { shares: 30, saves: 30 }))], AS_OF);
  check(eng.weights.behavior > r0.weights.behavior, `paylaşım/kaydetme bonusu (behavior ${r0.weights.behavior} → ${eng.weights.behavior})`);
  check(JSON.stringify(computePoolWeights([...withNoise].reverse(), AS_OF)) === JSON.stringify(computePoolWeights(withNoise, AS_OF)), "deterministik (olay sırasından bağımsız)");
}
// Dosya.
{
  const f = readWeightFile();
  check(!!f && f.entries.length >= 1 && f.entries[0].from === PLANNER_START_DATE, "src/data/pool-weights.json geçerli, ilk kayıt PLANNER_START");
  const e: WeightEntry = { ...f!.entries[f!.entries.length - 1] };
  check(!appendEntry(f, { ...e, from: "2099-01-01" }).added, "aynı ağırlıklar → yeni kayıt eklenmez");
  check(!appendEntry(f, { ...e, from: e.from, weights: { ...e.weights, dream: 4 } }).added, "from son kayıttan sonra değilse eklenmez");
  const ok = appendEntry(f, { ...e, from: "2099-01-01", weights: { ...e.weights, dream: e.weights.dream === 4 ? 1 : 4 } });
  check(ok.added && ok.file.entries.length === f!.entries.length + 1 && ok.file.entries[0] === f!.entries[0], "farklı ağırlık → sona eklenir, eski kayıtlar korunur");
  let threw = 0;
  for (const bad of [{ schema: 2, entries: [] }, { schema: 1, entries: [{ ...e, weights: { ...e.weights, compat: 5 } }] }, { schema: 1, entries: [e, e] }]) {
    try {
      validateWeightFile(bad);
    } catch {
      threw++;
    }
  }
  check(threw === 3, "geçersiz şema / aralık dışı ağırlık / sırasız from reddedilir");
}

if (fail) {
  console.error(`\n${fail} kontrol başarısız`);
  process.exit(1);
}
console.log("\n✓ verify:weights");
