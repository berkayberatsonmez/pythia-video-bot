// ═══════════════════════════════════════════════════════════════════════════
// gundem.ts — Güncel duruma göre içerik ODAĞI (saf, deterministik, ağ yok)
//
// gundemFocus(tarih) → o gün öne alınabilecek içerikler, öncelik sırasıyla.
// Seçimi rotation.ts'teki planlayıcı yapar: günde EN FAZLA BİR odak seçimi,
// tekrar penceresi ve "komşu slot farklı kategori" kuralları aynen geçerli.
// Odak bir slotu doldurursa o pool'un ağırlık kredisinden düşülür (SWRR), yani
// gündem toplam kategori dağılımını kalıcı olarak kaydırmaz, yalnız ZAMANLAR.
//
// Kaynaklar (hepsi tarihin saf fonksiyonu → IG / TikTok / YouTube aynı seçimi görür):
//   takvim  11.11 / 12.12 portal günü, Sevgililer Günü, yılbaşı haftası. DİNİ GÜN YOK.
//   ay      Dolunay / Yeniay / tutulma (±1 gün; sky-events → topical.skyState)
//   sezon   Güneş burç değiştirince ilk 10 gün: sezon sıralaması, o burcun
//           burç/davranış/uyum videoları
//   retro   Merkür / Venüs / Mars retrosu (önce, başında, sürerken): ilgili
//           hazır davranış/sıralama/rüya içerikleri (iletişim, eski sevgili…)
//
// Google Trends BİLEREK YOK: trend dosyası her iş akışında ayrı indiriliyor
// (TikTok 09:00, IG 10:07 UTC), aynı gün farklı olabilir → TikTok = IG sabah
// değişmezi bozulurdu; ayrıca planlayıcının geçmişi yeniden kurulabilir olmalı
// (dünkü seçimi bugünün koşusu da aynı bulmalı). Trend yalnız etiket/satıra girer.
//
// CLI: tsx scripts/gundem.ts [--from YYYY-MM-DD] [--days 60]
// ═══════════════════════════════════════════════════════════════════════════

import { MakeTime, SunPosition } from "astronomy-engine";
import { SIGN_IDS, SIGN_NAMES, type PlanetKey } from "../src/data/sky-copy";
import { ZODIAC_BEHAVIORS } from "../src/data/zodiac-behaviors";
import { ZODIAC_COMPATIBILITY } from "../src/data/zodiac-compatibility";
import { seasonRankingId } from "../src/data/zodiac-season-rankings";
import { dateToDay, dayToDate } from "./sky-events";
import { skyState } from "./topical";

/** rotation.ts PoolKey ile aynı küme (döngüsel import olmasın diye burada tekrar). */
export type FocusPool =
  | "dream"
  | "tarot"
  | "numerology"
  | "angel"
  | "zodiac"
  | "manifest"
  | "ranking"
  | "behavior"
  | "compat";

/** id yoksa pool düzeyinde odak: o pool'un sıradaki öğesi. */
export type FocusPick = { pool: FocusPool; id?: string };

export type Focus = {
  /** Kota anahtarı (aynı anahtar `window` gün içinde en çok `cap` kez seçilir). */
  key: string;
  reason: string;
  picks: FocusPick[];
  cap: number;
  window: number;
};

/** Gün sonu (İstanbul 23:59) Güneş burcu — topical.skyState ile aynı an. */
const sunCache = new Map<string, number>();
export function sunSignOn(date: string): number {
  let s = sunCache.get(date);
  if (s === undefined) {
    const lon = SunPosition(MakeTime(new Date(`${date}T20:59:00Z`))).elon;
    s = Math.floor((((lon % 360) + 360) % 360) / 30);
    sunCache.set(date, s);
  }
  return s;
}

/** Güneş bu burçta kaçıncı gününde (giriş günü = 0). */
export function seasonDay(date: string): number {
  const day = dateToDay(date);
  const sign = sunSignOn(date);
  let n = 0;
  while (n < 40 && sunSignOn(dayToDate(day - n - 1)) === sign) n++;
  return n;
}

export const SEASON_FOCUS_DAYS = 10;

const RETRO_PICKS: Partial<Record<PlanetKey, FocusPick[]>> = {
  // İletişim / geçmişten dönenler
  mercury: [
    { pool: "behavior", id: "ikizler-cevapsiz" },
    { pool: "ranking", id: "tehlikeli-eski" },
    { pool: "dream", id: "ex" },
  ],
  // Aşk / eski sevgili
  venus: [
    { pool: "ranking", id: "tehlikeli-eski" },
    { pool: "dream", id: "ex" },
    { pool: "ranking", id: "kalp-kiran" },
    { pool: "behavior", id: "kova-uzaklasinca" },
  ],
  // Cesaret / inat
  mars: [
    { pool: "ranking", id: "cesur" },
    { pool: "ranking", id: "inatci" },
    { pool: "behavior", id: "koc-asik" },
  ],
};
const RETRO_LABEL: Partial<Record<PlanetKey, string>> = { mercury: "Merkür", venus: "Venüs", mars: "Mars" };

const RELEASE: FocusPick[] = ["release-fear", "forgiveness", "gratitude", "healing"].map((id) => ({ pool: "manifest", id }));
const BEGIN: FocusPick[] = ["newbeginning", "attraction", "abundance", "success"].map((id) => ({ pool: "manifest", id }));

function seasonPicks(sign: number): FocusPick[] {
  const sid = SIGN_IDS[sign];
  return [
    { pool: "ranking", id: seasonRankingId(sign) },
    { pool: "zodiac", id: sid },
    ...ZODIAC_BEHAVIORS.filter((b) => b.signId === sid).map((b) => ({ pool: "behavior" as const, id: b.id })),
    ...ZODIAC_COMPATIBILITY.filter((c) => c.sign1Id === sid || c.sign2Id === sid).map((c) => ({ pool: "compat" as const, id: c.id })),
  ];
}

const focusCache = new Map<string, Focus[]>();

/** O günün odakları, öncelik sırasıyla: takvim > Ay > sezon > retro. */
export function gundemFocus(date: string): Focus[] {
  const hit = focusCache.get(date);
  if (hit) return hit;
  const out: Focus[] = [];
  const [, m, d] = date.split("-").map(Number);
  const md = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // ─── Takvim (statik, dini gün yok) ──────────────────────────────────────
  if (md === "11-11") out.push({ key: "cal-1111", reason: "11.11 portal günü", picks: [{ pool: "angel", id: "a1111" }], cap: 1, window: 5 });
  if (md === "12-12") out.push({ key: "cal-1212", reason: "12.12 portal günü", picks: [{ pool: "angel", id: "a1212" }], cap: 1, window: 5 });
  if (md === "02-12" || md === "02-13" || md === "02-14")
    out.push({
      key: "cal-sevgililer",
      reason: "Sevgililer Günü",
      picks: [{ pool: "compat" }, { pool: "manifest", id: "love" }],
      cap: 2,
      window: 5,
    });
  if ((m === 12 && d >= 26) || md === "01-01")
    out.push({
      key: "cal-yilbasi",
      reason: "yeni yıl",
      picks: ["newbeginning", "abundance", "success", "confidence"].map((id) => ({ pool: "manifest" as const, id })),
      cap: 2,
      window: 10,
    });

  const sky = skyState(date);

  // ─── Ay evresi / tutulma (olay günü ve bir gün öncesi/sonrası) ─────────
  for (const mo of sky.moon) {
    const full = mo.kind === "full-moon" || mo.kind === "lunar-eclipse";
    const label = { "full-moon": "Dolunay", "new-moon": "Yeniay", "lunar-eclipse": "Ay tutulması", "solar-eclipse": "Güneş tutulması" }[mo.kind];
    out.push({
      key: `moon-${dayToDate(dateToDay(date) + mo.diff)}`,
      reason: `${label} (${SIGN_NAMES[mo.sign]})`,
      picks: full ? RELEASE : BEGIN,
      cap: 1,
      window: 5,
    });
  }

  // ─── Güneş burç sezonu (ilk 10 gün) ────────────────────────────────────
  const sd = seasonDay(date);
  if (sd < SEASON_FOCUS_DAYS) {
    const sign = sunSignOn(date);
    out.push({ key: `season-${SIGN_IDS[sign]}`, reason: `${SIGN_NAMES[sign]} sezonu (${sd + 1}. gün)`, picks: seasonPicks(sign), cap: 3, window: 30 });
  }

  // ─── Retro (Merkür / Venüs / Mars) ─────────────────────────────────────
  for (const r of sky.retro) {
    const picks = RETRO_PICKS[r.planet];
    if (!picks || r.phase === "end") continue;
    out.push({ key: `retro-${r.planet}`, reason: `${RETRO_LABEL[r.planet]} retrosu`, picks, cap: 2, window: 40 });
  }

  focusCache.set(date, out);
  return out;
}

// ─── CLI ─────────────────────────────────────────────────────────────────
if (process.argv[1] && /gundem\.ts$/.test(process.argv[1])) {
  const a = process.argv.slice(2);
  const from = a.includes("--from") ? a[a.indexOf("--from") + 1] : dayToDate(Math.floor(Date.now() / 86400000));
  const days = a.includes("--days") ? Number(a[a.indexOf("--days") + 1]) : 60;
  for (let i = 0; i < days; i++) {
    const date = dayToDate(dateToDay(from) + i);
    const f = gundemFocus(date);
    if (f.length) console.log(`${date}  ${f.map((x) => `${x.reason} [${x.key}]`).join(" · ")}`);
  }
}
