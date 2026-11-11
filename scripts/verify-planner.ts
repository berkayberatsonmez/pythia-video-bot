// verify-planner.ts — yeni planlayıcının değişmezleri (ağ yok, saat yok).
//   1) PLANNER_START öncesi günler eski rotasyonla BİREBİR aynı (geçmiş yayınlar).
//   2) 400 gün: komşu slotlar (sabah/akşam, akşam/ertesi sabah, Gök Gündemi dahil)
//      farklı kategori; hiçbir öğe NO_REPEAT_DAYS gün içinde iki kez (geçişteki
//      eski yayınlar dahil); pencere hiç gevşetilmedi; deterministik.
//   3) Ağırlık değişimi GEÇMİŞİ değiştirmez: yeni kayıt eklenince `from` öncesi
//      günler aynı kalır; uç ağırlıklarda ve haftalık değişen ağırlıkta da 2) geçer.
//   4) Dağılım: her kategori yayınlanır (keşif), paylar hedefe yakın, tek pool ≤ %40.
//   5) Gündem: 11.11 → 1111, sezon başında sezon sıralaması, Sevgililer Günü,
//      yılbaşı, Ay evreleri; tüm gündem id'leri mevcut; günde en çok bir odak.
//   6) Sezon sıralaması metinleri: biçim, uzunluk, yasak kelime yok.
// Çalıştır: npm run verify:planner
import {
  createPlanner,
  focusItemExists,
  getVideosForDay,
  legacyVideosForDay,
  loadWeightSchedule,
  MAX_POOL_SHARE,
  NO_REPEAT_DAYS,
  PLANNER_START,
  PLANNER_START_DATE,
  poolShares,
  POOLS,
  SKY_ANCHOR_DAY,
  type PoolKey,
  type SelectedVideo,
  type WeightSchedule,
} from "./rotation";
import { dateToDay, dayToDate, skyEventForDay } from "./sky-events";
import { gundemFocus, seasonDay, sunSignOn } from "./gundem";
import { readWeightFile } from "./pool-weights";
import { SEASON_RANKINGS, seasonRankingId } from "../src/data/zodiac-season-rankings";
import { getRankingById } from "../src/data/zodiac-rankings";

let fail = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✅" : "❌"} ${msg}`);
  if (!ok) fail++;
};
const key = (v: SelectedVideo) => `${v.poolKey}:${v.id}`;
const POOL_KEYS = Object.keys(POOLS) as PoolKey[];
const DAYS = 400;

// ─── 1) Geçmiş ───────────────────────────────────────────────────────────
{
  let diff = 0;
  for (let d = SKY_ANCHOR_DAY; d < PLANNER_START; d++) {
    if (getVideosForDay(d).map(key).join() !== legacyVideosForDay(d).map(key).join()) diff++;
  }
  check(diff === 0, `${dayToDate(SKY_ANCHOR_DAY)}…${dayToDate(PLANNER_START - 1)}: eski rotasyonla aynı (fark=${diff})`);
  const f = readWeightFile();
  check(!!f && f.entries[0]?.from === PLANNER_START_DATE, `pool-weights.json ilk kaydı PLANNER_START (${PLANNER_START_DATE})`);
}

// ─── 2) Değişmezler ──────────────────────────────────────────────────────
type Run = { slots: { slotNo: number; v: SelectedVideo }[]; relaxed: number; focusDays: string[]; days: SelectedVideo[][] };
function run(schedule: WeightSchedule, days = DAYS): Run {
  const p = createPlanner(schedule);
  const slots: Run["slots"] = [];
  // geçişten önceki gerçek (eski) yayınlar: tekrar kontrolüne dahil
  for (let d = PLANNER_START - NO_REPEAT_DAYS - 1; d < PLANNER_START; d++)
    legacyVideosForDay(d).forEach((v, i) => slots.push({ slotNo: d * 2 + i, v }));
  let relaxed = 0;
  const focusDays: string[] = [];
  const out: SelectedVideo[][] = [];
  for (let d = PLANNER_START; d < PLANNER_START + days; d++) {
    const pd = p.plan(d);
    relaxed += pd.relaxed;
    if (pd.focus) focusDays.push(`${dayToDate(d)} ${pd.focus}`);
    pd.videos.forEach((v, i) => slots.push({ slotNo: d * 2 + i, v }));
    out.push(pd.videos);
  }
  return { slots, relaxed, focusDays, days: out };
}
function invariants(name: string, r: Run, days = DAYS) {
  let adj = 0;
  for (let i = 1; i < r.slots.length; i++) if (r.slots[i].v.poolKey === r.slots[i - 1].v.poolKey) adj++;
  const lastAt = new Map<string, number>();
  let rep = 0;
  let repMsg = "";
  for (const { slotNo, v } of r.slots) {
    if (v.poolKey === "sky") continue;
    const l = lastAt.get(key(v));
    if (l !== undefined && slotNo - l < NO_REPEAT_DAYS * 2) {
      rep++;
      repMsg ||= ` ilk: ${key(v)} ${dayToDate(Math.floor(l / 2))}→${dayToDate(Math.floor(slotNo / 2))}`;
    }
    lastAt.set(key(v), slotNo);
  }
  let shape = 0;
  r.days.forEach((vs, i) => {
    const ev = skyEventForDay(PLANNER_START + i);
    const ok =
      vs.length === 2 &&
      vs[0].slot === "morning" &&
      vs[1].slot === "evening" &&
      vs[0].poolKey !== "sky" &&
      (ev ? vs[1].poolKey === "sky" && vs[1].id === ev.id : vs[1].poolKey !== "sky");
    if (!ok) shape++;
  });
  check(adj === 0 && rep === 0 && r.relaxed === 0 && shape === 0,
    `${name}: ${days} gün — komşu aynı kategori=${adj}, ${NO_REPEAT_DAYS} gün içinde tekrar=${rep}${repMsg}, gevşetme=${r.relaxed}, biçim/gök hatası=${shape}`);
}

const fileSched = loadWeightSchedule();
const base = run(fileSched);
invariants("dosyadaki ağırlıklar", base);
check(JSON.stringify(run(fileSched).days) === JSON.stringify(base.days), "deterministik (iki ayrı planlayıcı aynı sonuç)");
{
  // Varsayılan planlayıcı (getVideosForDay) dosyadakiyle aynı.
  let diff = 0;
  for (let i = 0; i < 60; i++) if (getVideosForDay(PLANNER_START + i).map(key).join() !== base.days[i].map(key).join()) diff++;
  check(diff === 0, "getVideosForDay = planlayıcı (60 gün)");
}

// ─── 3) Ağırlık değişimi geçmişi değiştirmez + uç ağırlıklar ───────────
const W = (f: (k: PoolKey) => number) => Object.fromEntries(POOL_KEYS.map((k) => [k, f(k)])) as Record<PoolKey, number>;
{
  const X = PLANNER_START + 45;
  const changed: WeightSchedule = [...fileSched, { from: X, weights: W((k) => (k === "dream" ? 4 : 1)) }];
  const r2 = run(changed);
  const same = base.days.slice(0, 45).every((vs, i) => vs.map(key).join() === r2.days[i].map(key).join());
  const after = base.days.slice(45).some((vs, i) => vs.map(key).join() !== r2.days[45 + i].map(key).join());
  check(same && after, `yeni ağırlık kaydı (from=${dayToDate(X)}): öncesi 45 gün AYNI, sonrası değişti`);
  invariants("geçişli ağırlık", r2);
}
for (const p of POOL_KEYS) invariants(`uç: ${p}=4, diğerleri 1`, run([{ from: PLANNER_START, weights: W((k) => (k === p ? 4 : 1)) }], 200), 200);
invariants("uç: hepsi 4", run([{ from: PLANNER_START, weights: W(() => 4) }], 200), 200);
{
  const weekly: WeightSchedule = [];
  for (let i = 0; i < 30; i++) weekly.push({ from: PLANNER_START + i * 7, weights: W((k) => 1 + ((POOL_KEYS.indexOf(k) + i) % 4)) });
  invariants("haftalık değişen ağırlık", run(weekly, 210), 210);
}

// ─── 4) Dağılım ──────────────────────────────────────────────────────────
{
  const shares = poolShares(fileSched[fileSched.length - 1].weights);
  const sum = POOL_KEYS.reduce((a, k) => a + shares[k], 0);
  check(Math.abs(sum - 1) < 1e-9 && POOL_KEYS.every((k) => shares[k] > 0 && shares[k] <= MAX_POOL_SHARE + 1e-9),
    `hedef paylar: toplam 1, hepsi > 0, en büyük ≤ %${MAX_POOL_SHARE * 100}`);
  const capped = poolShares(W((k) => (k === "compat" ? 4 : 1)));
  check(Math.abs(capped.compat - MAX_POOL_SHARE) < 1e-9, `üst sınır: compat=4, diğerleri 1 → compat payı %${Math.round(capped.compat * 100)}`);
  const n: Record<string, number> = {};
  let total = 0;
  for (const vs of base.days) for (const v of vs) if (v.poolKey !== "sky") ((n[v.poolKey] = (n[v.poolKey] ?? 0) + 1), total++);
  const devs = POOL_KEYS.map((k) => ({ k, got: (n[k] ?? 0) / total, want: shares[k] }));
  const worst = devs.reduce((a, b) => (Math.abs(b.got - b.want) > Math.abs(a.got - a.want) ? b : a));
  check(POOL_KEYS.every((k) => (n[k] ?? 0) > 0), `keşif: ${DAYS} günde her kategori yayınlandı (en az: ${Math.min(...POOL_KEYS.map((k) => n[k] ?? 0))})`);
  check(Math.abs(worst.got - worst.want) <= 0.04,
    `paylar hedefe yakın (en büyük sapma ${worst.k}: %${(worst.got * 100).toFixed(1)} / hedef %${(worst.want * 100).toFixed(1)})`);
  console.log("   " + devs.map((d) => `${d.k} %${(d.got * 100).toFixed(0)}/${(d.want * 100).toFixed(0)}`).join(" · "));
}

// ─── 5) Gündem ───────────────────────────────────────────────────────────
{
  const at = (date: string) => base.days[dateToDay(date) - PLANNER_START];
  check(at("2026-11-11")[0].id === "a1111", `11.11 sabah = melek sayısı 1111 (${key(at("2026-11-11")[0])})`);
  check(at("2026-12-12").some((v) => v.id === "a1212"), `12.12 = 1212 (${at("2026-12-12").map(key).join(", ")})`);
  // Her sezon girişinden sonraki ilk 10 günde o sezonun sıralaması yayınlanır.
  let seasonMiss = 0;
  let seasons = 0;
  for (let d = PLANNER_START; d < PLANNER_START + DAYS - 10; d++) {
    const date = dayToDate(d);
    if (seasonDay(date) !== 0) continue;
    seasons++;
    const id = seasonRankingId(sunSignOn(date));
    if (!base.days.slice(d - PLANNER_START, d - PLANNER_START + 10).some((vs) => vs.some((v) => v.id === id))) seasonMiss++;
  }
  check(seasons >= 12 && seasonMiss === 0, `${seasons} sezon girişinin hepsinde ilk 10 günde sezon sıralaması (eksik=${seasonMiss})`);
  const win = (from: string, n: number) => base.days.slice(dateToDay(from) - PLANNER_START, dateToDay(from) - PLANNER_START + n).flat();
  check(win("2027-02-12", 3).some((v) => v.poolKey === "compat" || v.id === "love"), "Sevgililer Günü (12–14 Şub): uyum / aşk içeriği");
  check(win("2026-12-26", 7).some((v) => ["newbeginning", "abundance", "success", "confidence"].includes(v.id)), "yılbaşı haftası: yeni başlangıç / bolluk manifestosu");
  const moonFocus = base.focusDays.filter((f) => /Dolunay|Yeniay|tutulma/.test(f)).length;
  check(moonFocus >= 15, `Ay evresi odakları: ${moonFocus} (${DAYS} gün)`);
  check(base.focusDays.length / DAYS < 0.35, `odaklı gün oranı %${Math.round((base.focusDays.length / DAYS) * 100)} (< %35; rotasyon baskın)`);
  let bad = 0;
  for (let d = PLANNER_START; d < PLANNER_START + 800; d++)
    for (const f of gundemFocus(dayToDate(d))) for (const p of f.picks) if (p.id && !focusItemExists(p.pool, p.id)) bad++;
  check(bad === 0, `800 günün tüm gündem öğeleri mevcut (eksik=${bad})`);
  const ALLOWED = /^(cal-(1111|1212|sevgililer|yilbasi)|moon-\d{4}-\d{2}-\d{2}|season-[a-z]+|retro-(mercury|venus|mars))$/;
  const keys = new Set<string>();
  for (let d = PLANNER_START; d < PLANNER_START + 800; d++) for (const f of gundemFocus(dayToDate(d))) keys.add(f.key);
  const odd = [...keys].filter((k) => !ALLOWED.test(k));
  check(odd.length === 0, `gündem kaynakları yalnız portal / Sevgililer / yılbaşı / Ay / sezon / retro — dini gün yok (beklenmeyen: ${odd.join(",") || "yok"})`);
  console.log("   ilk odaklar: " + base.focusDays.slice(0, 6).join(" | "));
}

// ─── 6) Sezon sıralaması metinleri ───────────────────────────────────────
{
  const BAD = /\b(kesinlikle|mutlaka|garanti|kesin|para kazan|zengin|hastalık|ilaç|tedavi|ölüm|felaket)\b/i;
  const ok = SEASON_RANKINGS.every((r, i) =>
    r.id === seasonRankingId(i) &&
    getRankingById(r.id) === r &&
    r.trait.length <= 32 &&
    new Set(r.ranks.map((x) => x.signId)).size === 3 &&
    r.ranks.every((x) => x.blurb.length <= 47 && !BAD.test(x.blurb)) &&
    !BAD.test(r.trait + r.question) &&
    !POOLS.ranking.ids.includes(r.id));
  check(ok && SEASON_RANKINGS.length === 12, "12 sezon sıralaması: 3 farklı burç, ≤47 karakter, yasak kelime yok, normal havuzda değil");
}

if (fail) {
  console.error(`\n${fail} kontrol başarısız`);
  process.exit(1);
}
console.log("\n✓ verify:planner");
