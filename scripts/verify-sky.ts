// verify-sky.ts — Gök Gündemi doğrulaması (ağ yok; astronomy-engine çevrimdışı).
//   1) Bilinen referans tarihler (±1 gün, İstanbul günü).
//   2) Bugünden itibaren 90 günün olayları: hangi gün / hangi slot.
//   3) Kimlikler benzersiz (olay + varyant); kimlikten yeniden kurulum aynı olayı verir.
//   4) Kart sağlığı: 3 benzersiz burç, kanca 0. karede, yasak/korkutucu kelime yok.
//   5) Rotasyon kayması: yerinden edilen öğe kaybolmaz, değişmezler korunur.
// Çalıştır: npm run verify:sky
import { PLANET_COPY, MOON_COPY } from "../src/data/sky-copy";
import {
  buildSkyCard,
  dateToDay,
  dayToDate,
  findStations,
  istanbulDate,
  planRange,
  rawEvents,
  skyEventById,
  DAY_MS,
} from "./sky-events";
import { buildSequence, getVideosForDay, SEQUENCE_OFFSET, SKY_ANCHOR_DAY } from "./rotation";

let fail = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✅" : "❌"} ${msg}`);
  if (!ok) fail++;
};

// ─── 1) Referanslar (genel bilgi; ±1 gün) ────────────────────────────────
const ref: [string, "retro" | "direct", string][] = [
  ["mercury", "retro", "2026-02-26"],
  ["mercury", "direct", "2026-03-20"],
  ["mercury", "retro", "2026-06-29"],
  ["mercury", "direct", "2026-07-23"],
  ["mercury", "retro", "2026-10-24"],
  ["mercury", "direct", "2026-11-13"],
  ["venus", "retro", "2026-10-03"],
  ["venus", "direct", "2026-11-14"],
];
const st = findStations(Date.parse("2026-01-01T00:00:00Z"), Date.parse("2026-12-31T00:00:00Z"));
for (const [planet, dir, date] of ref) {
  const hit = st.find((s) => s.planet === planet && s.dir === dir && Math.abs(dateToDay(istanbulDate(s.at)) - dateToDay(date)) <= 1);
  const got = st.filter((s) => s.planet === planet && s.dir === dir).map((s) => istanbulDate(s.at)).join(",");
  check(!!hit, `${planet} ${dir} ≈ ${date} (hesap: ${got})`);
}

// ─── 2) Önümüzdeki 90 gün ────────────────────────────────────────────────
const today = process.env.SKY_FROM ?? istanbulDate(new Date());
const to = dayToDate(dateToDay(today) + 90);
const plan = planRange(today, to);
console.log(`\nÖnümüzdeki 90 gün (${today} → ${to}): ${plan.length} akşam slotu SkyEvent`);
for (const p of plan) {
  const c = buildSkyCard(p.winner);
  console.log(`  ${p.date}  akşam (20:30 TR)  ${p.winner.id}  «${c.hookLine}»${p.dropped.length ? `  [elenen: ${p.dropped.map((d) => d.id).join(", ")}]` : ""}`);
}
console.log("\nİstasyonlar (retro/düz) — 90 gün:");
for (const s of findStations(Date.parse(`${today}T00:00:00Z`), Date.parse(`${to}T00:00:00Z`))) {
  console.log(`  ${s.planet.padEnd(8)} ${s.dir.padEnd(6)} ${istanbulDate(s.at)}  burç #${s.sign}`);
}

// ─── 3) Kimlik benzersizliği + gidiş-dönüş (yaklaşık 14 ay) ──────────────
const from2 = "2026-10-01";
const to2 = "2027-12-31";
const all = rawEvents(Date.parse(`${from2}T00:00:00Z`), Date.parse(`${to2}T00:00:00Z`));
const ids = all.map((e) => e.id);
check(new Set(ids).size === ids.length, `olay kimlikleri benzersiz (${ids.length} olay/varyant, ${from2}…${to2})`);
let rt = 0;
for (const e of all.slice(0, 40)) {
  const back = skyEventById(e.id);
  if (!back || back.eventDate !== e.eventDate || back.kind !== e.kind) rt++;
}
check(rt === 0, `kimlikten yeniden kurulum tutarlı (ilk 40 olay, hatalı=${rt})`);
const days = planRange(from2, to2);
check(new Set(days.map((d) => d.date)).size === days.length, "her güne en çok bir akşam olayı");
check(days.every((d) => d.winner.postDate === d.date), "kazanan olayın postDate'i gün anahtarıyla aynı");

// ─── 4) Kart sağlığı ─────────────────────────────────────────────────────
const BAD = /\b(felaket|kesinlikle|mutlaka|asla|ölüm|hastalık|yatırım yap|ilaç|korku)\b/i;
let badCard = 0;
for (const d of days) {
  const c = buildSkyCard(d.winner);
  const okSigns = new Set(c.affected.map((a) => a.signId)).size === 3;
  const text = [c.hookLine, c.theme.desc, c.tip, ...c.affected.map((a) => a.line)].join(" ");
  if (!okSigns || BAD.test(text) || !c.headline[0] || !c.dateLabel || c.hashtags.length !== 5) badCard++;
}
check(badCard === 0, `${days.length} kart: 3 benzersiz burç, 5 etiket, yasak kelime yok (hatalı=${badCard})`);
const lineCount = [...Object.values(PLANET_COPY).map((p) => p.signLines), MOON_COPY.full.signLines, MOON_COPY.new.signLines];
check(lineCount.every((l) => l.length === 12 && l.every((x) => x.length > 20)), "her gezegen/ay evresi için 12 burç satırı");
check(buildSkyCard(skyEventById("retro-start-mercury-2026-10-24")!).hookLine === "MERKÜR RETROSU BAŞLIYOR · 24 EKİM", "kanca: MERKÜR RETROSU BAŞLIYOR · 24 EKİM");

// ─── 5) Rotasyon kayması ─────────────────────────────────────────────────
const seq = buildSequence();
const N = 500;
let skyDays = 0;
let bad = 0;
let nextIdx = SKY_ANCHOR_DAY * 2 + SEQUENCE_OFFSET; // eski formülün çapa günündeki indeksi
for (let d = SKY_ANCHOR_DAY; d < SKY_ANCHOR_DAY + N; d++) {
  const [m, e] = getVideosForDay(d, seq);
  const used: string[] = [`${m.category}:${m.id}`];
  if (m.id !== seq[nextIdx % seq.length].id) bad++; // sabah = sıradaki öğe
  nextIdx++;
  if (e.poolKey === "sky") {
    skyDays++;
  } else {
    used.push(`${e.category}:${e.id}`);
    if (e.id !== seq[nextIdx % seq.length].id) bad++; // akşam = sıradaki öğe (öğe kaybolmadı)
    if (m.poolKey === e.poolKey) bad++; // sabah ≠ akşam kategori
    nextIdx++;
  }
}
check(bad === 0, `rotasyon ${N} gün: öğe atlanmadı/kaybolmadı, sabah≠akşam (SkyEvent'li gün: ${skyDays})`);
const pre = getVideosForDay(SKY_ANCHOR_DAY - 5, seq);
check(pre[0].id === seq[((SKY_ANCHOR_DAY - 5) * 2 + SEQUENCE_OFFSET) % seq.length].id, "çapa öncesi gün eski formülle aynı");
check(getVideosForDay(SKY_ANCHOR_DAY + 3, seq, false)[1].poolKey !== "sky", "withSky=false SkyEvent üretmez");

// ─── Özet ────────────────────────────────────────────────────────────────
console.log(`\n(${((N * DAY_MS) / DAY_MS).toFixed(0)} günlük kayma testi tamam)`);
if (fail) {
  console.error(`\n${fail} kontrol başarısız`);
  process.exit(1);
}
