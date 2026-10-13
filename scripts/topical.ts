// ═══════════════════════════════════════════════════════════════════════════
// topical.ts — Güncel / konuya uygun başlık satırı + hashtag seçimi
//
// topicalContext(date, video) → { captionLine?, hashtags[], ... }
//
// SAF ve DETERMİNİSTİK: aynı (tarih, slot, video, trend listesi) → aynı çıktı.
// Ağ yok; gök hesabı sky-events.ts (astronomy-engine, çevrimdışı).
//
// Etiket kaynakları (sıra = öncelik; platform sınırı dolunca alttakiler düşer):
//   video     videonun kendisi: burç / uyum çifti / tarot / rüya sembolü …
//   seed      kategorinin eski sabit etiketleri (metadata.ts), video'dan sonra
//   sky       aktif retro, Dolunay/Yeniay (±1 gün), tutulma, Güneş burcu sezonu
//   calendar  statik takvim (Cadılar Bayramı, yılbaşı, 11.11 …). DİNİ GÜN YOK.
//   trend     Google Trends TR — YALNIZ astro/tarot/rüya sözlüğüne uyan, videoyla
//             ve gök durumuyla çelişmeyen terim (aşağıda classifyTrend)
//   evergreen küçük, günlük döndürülen niş havuzu (kategori yakınlığına göre)
//   brand     #pythia — yalnız bazı gönderilerde
//
// Platformlar alakasız/yanıltıcı trend etiketini cezalandırır; bu yüzden hiçbir
// etiket serbest metinden gelmez: her etiket yukarıdaki kaynaklardan birinin
// `sources` kaydıyla çıkar (verify-topical.ts bunu sınar).
//
// CLI:  tsx scripts/topical.ts [--date YYYY-MM-DD] [--category zodiac --id aries]
// ═══════════════════════════════════════════════════════════════════════════

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Seasons, SunPosition, MakeTime } from "astronomy-engine";
import { SIGN_NAMES, SIGN_IDS, PLANET_COPY, type PlanetKey } from "../src/data/sky-copy";
import { getSymbolById } from "../src/data/dream-symbols";
import { getNumberById } from "../src/data/numbers";
import { getZodiacById } from "../src/data/zodiac-signs";
import { getManifestById } from "../src/data/manifestation";
import { getRankingById } from "../src/data/zodiac-rankings";
import { getBehaviorById } from "../src/data/zodiac-behaviors";
import { getCompatibilityById } from "../src/data/zodiac-compatibility";
import { DAY_MS, dateToDay, dayToDate, istanbulDate, rawEvents, skyCardById } from "./sky-events";

export type Slot = "morning" | "evening";
export type Platform = "instagram" | "tiktok" | "youtube";
export type TagSource = "video" | "seed" | "sky" | "calendar" | "trend" | "evergreen" | "brand";

export interface TopicalVideo {
  category: string;
  id: string;
  slot?: Slot;
  /** Kategorinin eski sabit etiketleri (öncelik sırasıyla); "seed" kaynağı. */
  seedTags?: string[];
}

export interface TopicalOptions {
  /** Trend başlıkları (RSS'ten). Verilmezse dosyadan okunur (readTrends). */
  trends?: string[];
}

export interface TrendUse {
  title: string;
  tag: string;
  mode: "new" | "boost";
}

export interface TopicalContext {
  date: string;
  slot: Slot;
  /** Başlık satırı (caption'ın kanca satırından SONRA girer). Yoksa yok. */
  captionLine?: string;
  /** YouTube başlığı için doğal önek ("Merkür Retrosunda"); çoğu gün yok. */
  titleLead?: string;
  specific: string[];
  topical: string[];
  evergreen: string[];
  /** Bu gönderide #pythia olacak mı (günlerin ~1/3'ü). */
  brand: boolean;
  /** Düz, sıralı liste: specific + topical + evergreen (sınırsız; kırpma topicalHashtags'te). */
  hashtags: string[];
  /** Her etiketin (küçük harf) kaynağı. */
  sources: Record<string, TagSource>;
  /** YouTube "tags" alanı için hashtag'siz anahtar kelimeler. */
  keywords: string[];
  trend?: TrendUse;
  /** Okunabilir izler (günlük / annotation). */
  notes: string[];
}

// ─── Türkçe yardımcılar ──────────────────────────────────────────────────
export const low = (s: string): string => s.toLocaleLowerCase("tr");
const isCombining = (c: string) => c === "̇";
/** "Akrep Burcu" → "#akrepburcu" (yalnız harf/rakam/_; İ→i, I→ı doğru). */
export function tagify(s: string): string {
  const t = [...low(s)].filter((c) => !isCombining(c)).join("").replace(/[^\p{L}\p{N}_]/gu, "");
  return t ? `#${t}` : "";
}
export const TAG_RE = /^#[\p{L}\p{N}_]+$/u;

function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const SIGN_LOC = ["ta", "da", "de", "te", "da", "ta", "de", "te", "da", "ta", "da", "ta"]; // Koç'ta, Boğa'da …
const SIGN_EMOJI = ["♈️", "♉️", "♊️", "♋️", "♌️", "♍️", "♎️", "♏️", "♐️", "♑️", "♒️", "♓️"];
const signIdx = (id: string) => SIGN_IDS.indexOf(id);
const signTag = (i: number) => tagify(`${SIGN_NAMES[i]}burcu`);

const PLANET_TR: Record<PlanetKey, string> = {
  mercury: "Merkür",
  venus: "Venüs",
  mars: "Mars",
  jupiter: "Jüpiter",
  saturn: "Satürn",
};
const PLANET_EMOJI: Record<PlanetKey, string> = { mercury: "🌀", venus: "💞", mars: "🔥", jupiter: "✨", saturn: "⏳" };
/** Başlık satırı / YT öneki alan gezegenler; yavaşlar yalnız başlangıç/bitiş gününde konuşur. */
const FAST: PlanetKey[] = ["mercury", "venus", "mars"];

// ─── Gök durumu (sky-events.ts üzerinden) ────────────────────────────────
type RetroPhase = "pre" | "start" | "active" | "end";
interface RetroState {
  planet: PlanetKey;
  phase: RetroPhase;
}
type MoonKind = "full-moon" | "new-moon" | "lunar-eclipse" | "solar-eclipse";
interface MoonState {
  kind: MoonKind;
  /** Olay günü − bugün (−1, 0, +1). */
  diff: number;
  sign: number;
}
export interface SkyState {
  retro: RetroState[];
  moon: MoonState[];
  sunSign: number;
  /** Güneş bu burca bugün (ya da son 2 günde) girdi mi. */
  seasonEarly: boolean;
  seasonIngress: boolean;
}

const skyCache = new Map<string, SkyState>();
export function skyState(date: string): SkyState {
  const hit = skyCache.get(date);
  if (hit) return hit;
  const day = dateToDay(date);
  // 180 gün geri: en uzun retro (Satürn ~140 gün) başlangıcı pencerede kalsın.
  const evs = rawEvents((day - 180) * DAY_MS, (day + 3) * DAY_MS);
  const retro: RetroState[] = [];
  for (const e of evs) {
    if (!(e.body in PLANET_COPY)) continue;
    const planet = e.body as PlanetKey;
    if (e.kind === "retro-pre" && e.postDate === date) retro.push({ planet, phase: "pre" });
    else if (e.kind === "retro-start") {
      if (e.eventDate === date) retro.push({ planet, phase: "start" });
      else if (e.eventDate < date && (!e.endDate || date < e.endDate)) retro.push({ planet, phase: "active" });
    } else if (e.kind === "retro-end" && e.postDate === date) retro.push({ planet, phase: "end" });
  }
  const eclipseDays = new Set(evs.filter((e) => e.kind.endsWith("eclipse")).map((e) => e.postDate));
  const moon: MoonState[] = [];
  for (const e of evs) {
    if (e.kind !== "full-moon" && e.kind !== "new-moon" && !e.kind.endsWith("eclipse")) continue;
    const diff = dateToDay(e.postDate) - day;
    if (Math.abs(diff) > 1) continue;
    // Tutulma aynı günkü faz olayını yutar (sky-events ile aynı kural).
    if ((e.kind === "full-moon" || e.kind === "new-moon") && eclipseDays.has(e.postDate)) continue;
    moon.push({ kind: e.kind as MoonKind, diff, sign: e.sign });
  }
  const sunAt = (d: string) => Math.floor((((SunPosition(MakeTime(new Date(`${d}T20:59:00Z`))).elon % 360) + 360) % 360) / 30);
  const sunSign = sunAt(date);
  const s1 = sunAt(dayToDate(day - 1));
  const s3 = sunAt(dayToDate(day - 3));
  const st = { retro, moon, sunSign, seasonIngress: s1 !== sunSign, seasonEarly: s3 !== sunSign };
  skyCache.set(date, st);
  return st;
}

// ─── Statik takvim ───────────────────────────────────────────────────────
const LOVE_CATS = ["compat", "behavior", "ranking", "zodiac", "tarot"];
interface CalMoment {
  line: string;
  tags: string[];
  kw?: string;
  cats?: string[];
}
const seasonCache = new Map<number, Record<string, string>>();
function astroSeasonDates(year: number): Record<string, string> {
  let s = seasonCache.get(year);
  if (!s) {
    const x = Seasons(year);
    s = {
      mar: istanbulDate(x.mar_equinox.date),
      jun: istanbulDate(x.jun_solstice.date),
      sep: istanbulDate(x.sep_equinox.date),
      dec: istanbulDate(x.dec_solstice.date),
    };
    seasonCache.set(year, s);
  }
  return s;
}

export function calendarMoments(date: string): CalMoment[] {
  const out: CalMoment[] = [];
  const [y, m, d] = date.split("-").map(Number);
  const md = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay(); // 0 Paz … 5 Cum … 6 Cmt

  if (md === "10-31") out.push({ line: "Cadılar Bayramı gecesi 🎃", tags: ["#cadılarbayramı"], kw: "cadılar bayramı" });
  else if (md === "10-29" || md === "10-30")
    out.push({ line: "Cadılar Bayramı yaklaşırken 🎃", tags: ["#cadılarbayramı"], kw: "cadılar bayramı" });

  if (md === "12-31" || md === "01-01")
    out.push({ line: "Yeni yıl enerjisi ✨", tags: ["#yeniyıl", "#yılbaşı"], kw: "yeni yıl enerjisi" });
  else if (m === 12 && d >= 26)
    out.push({ line: "Yeni yıl enerjisi yaklaşırken ✨", tags: ["#yeniyıl", "#yılbaşı"], kw: "yeni yıl enerjisi" });

  if (md === "02-14") out.push({ line: "Sevgililer Günü 💞", tags: ["#sevgililergünü"], kw: "sevgililer günü", cats: LOVE_CATS });
  else if (md === "02-12" || md === "02-13")
    out.push({ line: "Sevgililer Günü yaklaşırken 💞", tags: ["#sevgililergünü"], kw: "sevgililer günü", cats: LOVE_CATS });

  const ss = astroSeasonDates(y);
  if (date === ss.dec) out.push({ line: "Kış gündönümü: yılın en uzun gecesi 🌙", tags: ["#kışgündönümü"], kw: "kış gündönümü" });
  if (date === ss.mar) out.push({ line: "İlkbahar ekinoksu: gün ile gece eşitleniyor ⚖️", tags: ["#ilkbaharekinoksu", "#ekinoks"], kw: "ilkbahar ekinoksu" });
  if (date === ss.jun) out.push({ line: "Yaz gündönümü: yılın en uzun günü ☀️", tags: ["#yazgündönümü"], kw: "yaz gündönümü" });
  if (date === ss.sep) out.push({ line: "Sonbahar ekinoksu: gün ile gece eşitleniyor ⚖️", tags: ["#sonbaharekinoksu", "#ekinoks"], kw: "sonbahar ekinoksu" });

  if (dow === 5 && d === 13) out.push({ line: "Cuma 13 🖤", tags: ["#cuma13"], kw: "cuma 13" });

  // Portal günleri. Rakamdan ibaret etiket Instagram'da tıklanmaz → harfli eş önce gelir.
  if (md === "11-11") out.push({ line: "11.11 portal günü ✨", tags: ["#1111portalı", "#1111"], kw: "11.11 portal" });
  if (md === "12-12") out.push({ line: "12.12 portal günü ✨", tags: ["#1212portalı", "#1212"], kw: "12.12 portal" });
  return out;
}

function weekdayMoment(date: string): CalMoment | null {
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (dow === 1) return { line: "Yeni haftanın enerjisi 🌙", tags: ["#haftanınenerjisi"], kw: "haftanın enerjisi" };
  if (dow === 5) return { line: "Hafta sonuna girerken 🌙", tags: [] };
  return null;
}

// ─── Evergreen havuz (kategori yakınlığıyla) ─────────────────────────────
const ASTRO_CATS = ["zodiac", "ranking", "behavior", "compat", "sky"];
const EVERGREEN: { tag: string; cats: string[] | "all" }[] = [
  { tag: "#burçlar", cats: ASTRO_CATS },
  { tag: "#astroloji", cats: [...ASTRO_CATS, "number"] },
  { tag: "#tarot", cats: ["tarot"] },
  { tag: "#rüyatabiri", cats: ["dream"] },
  { tag: "#burcyorumu", cats: ASTRO_CATS },
  { tag: "#falbak", cats: "all" },
];
export const EVERGREEN_POOL = EVERGREEN.map((e) => e.tag);
export const BRAND_TAG = "#pythia";

// ─── Videoya özgü etiketler ──────────────────────────────────────────────
const MAX_SYMBOL_TAG = 22; // "#rüyada" + sembol: çok uzun sembol etiketi atılır
function videoTags(category: string, id: string): { tags: string[]; signs: number[] } {
  const tags: string[] = [];
  const signs: number[] = [];
  const addSign = (sid?: string) => {
    const i = sid ? signIdx(sid) : -1;
    if (i >= 0 && !signs.includes(i)) {
      signs.push(i);
      tags.push(signTag(i));
    }
  };
  switch (category) {
    case "dream": {
      const s = getSymbolById(id);
      tags.push("#rüyatabiri");
      if (s) {
        const t = tagify(`rüyada ${s.symbolName}`);
        if (t && t.length - 1 <= MAX_SYMBOL_TAG) tags.push(t);
      }
      break;
    }
    case "tarot":
      tags.push("#tarot", "#tarotfalı", "#günlüktarot");
      break;
    case "zodiac":
      addSign(getZodiacById(id)?.id);
      break;
    case "ranking": {
      const r = getRankingById(id);
      tags.push("#burçsıralaması");
      if (r) addSign(r.ranks[2].signId); // ranks = [3.,2.,1.]
      break;
    }
    case "behavior": {
      const b = getBehaviorById(id);
      if (b) addSign(b.signId);
      break;
    }
    case "compat": {
      const c = getCompatibilityById(id);
      if (c) {
        addSign(c.sign1Id);
        addSign(c.sign2Id);
      }
      tags.push("#burçuyumu");
      break;
    }
    case "number": {
      const n = getNumberById(id);
      if (n?.kind === "angel") {
        tags.push("#meleksayıları");
        const t = tagify(`melek sayısı ${n.number}`);
        if (t) tags.push(t);
      } else {
        tags.push("#numeroloji", "#yaşamyolu");
      }
      break;
    }
    case "manifest": {
      const m = getManifestById(id);
      tags.push("#manifest");
      if (m) {
        const t = tagify(m.theme);
        if (t && t.length <= 20) tags.push(t);
      }
      break;
    }
    case "sky": {
      const c = skyCardById(id);
      if (c) for (const h of c.hashtags) tags.push(h);
      break;
    }
  }
  return { tags, signs };
}
/** Sözlük dışı/belirsiz etiketler (ör. #retro = retro tarz) ve marka etiketi seed'den çıkar. */
const SEED_DROP = new Set(["#retro", "#pythia", "#shorts", "#keşfet", "#koç", "#boğa", "#ay", "#su"]);

// ─── Trend (Google Trends TR RSS) ────────────────────────────────────────
export const TRENDS_FILE = join(process.cwd(), "out", "trends", "google-tr.rss");
const TRENDS_MAX_AGE_MS = 18 * 3600 * 1000;

function xmlText(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}
/** RSS metninden <item><title> başlıkları (sırayla). Bozuk/boş girdi → []. */
export function parseTrendsRss(xml: string): string[] {
  const out: string[] = [];
  const re = /<item\b[\s\S]*?<\/item>/gi;
  for (const item of xml.match(re) ?? []) {
    const m = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(item);
    if (m) {
      const t = xmlText(m[1]);
      if (t) out.push(t);
    }
  }
  return out;
}
/** Dosya yok / bayat (>18 sa) / okunamaz / bozuk → [] (sessizce). */
export function readTrends(file = process.env.PYTHIA_TRENDS_FILE || TRENDS_FILE, nowMs = Date.now()): string[] {
  try {
    if (!existsSync(file)) return [];
    if (nowMs - statSync(file).mtimeMs > TRENDS_MAX_AGE_MS) return [];
    return parseTrendsRss(readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

const MONTHS = ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"];
const PLANET_WORDS = ["merkür", "venüs", "mars", "jüpiter", "satürn", "neptün", "plüton", "uranüs"];
const FILLER = new Set([
  "bugün", "yarın", "bu", "gece", "akşam", "saat", "kaçta", "ne", "zaman", "nedir", "nasıl", "hangi", "günü", "tarihi", "tam",
  "etkileri", "etkisi", "yorumu", "yorumları", "yorum", "günlük", "haftalık", "aylık", "yıllık", "anlamı", "anlamları",
  "enerjisi", "niyet", "niyetleri", "ritüeli", "başlıyor", "bitiyor", "başladı", "bitti", "sezonu", "burcunda", "burcu",
  "ve", "ile", "mi", "mı", "da", "de", "olacak", "olur", "gezegen", "gezegenler", "ay", "güneş", "yeni", "dolunay", "yeniay",
  "kart", "kartı", "tabiri", "tabirleri", "rüya", "rüyada", "rüyalar", "görmek", "portal",
]);
const SIGN_WORDS = SIGN_NAMES.map((s) => low(s));

const PLANET_TR_LOW_TO_KEY: Record<string, PlanetKey> = {
  merkür: "mercury",
  venüs: "venus",
  mars: "mars",
  jüpiter: "jupiter",
  satürn: "saturn",
};

type TrendClass = "retro" | "moon" | "tarot" | "dream" | "astro" | "portal" | "season";
interface TrendParse {
  cls: TrendClass;
  tokens: string[];
  planet?: PlanetKey;
  moonKind?: "full" | "new" | "eclipse";
  signs: number[];
}
/**
 * Başlığı SÖZLÜĞE göre çözer. Başlıktaki HER sözcük sözlükte olmak zorunda
 * (anahtar kelime, dolgu, ay adı, sayı, burç/gezegen adı); aksi hâlde null.
 * Bu yüzden "Dolunay Soysert", "Burcu Biricik", "Aslan transfer", "Mars çikolata"
 * gibi başlıklar kendiliğinden elenir. "burcu" yalnız bir burç adından sonra geçerli.
 */
export function parseTrend(title: string): TrendParse | null {
  const norm = low(title).replace(/[’'`]/g, "").replace(/[^\p{L}\p{N}.\s]/gu, " ").replace(/\s+/g, " ").trim();
  if (!norm) return null;
  const tokens = norm.split(" ");
  if (tokens.length > 6) return null;
  const signs: number[] = [];
  let planet: PlanetKey | undefined;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const base = t.replace(/(un|ün|ın|in|da|de|ta|te)$/u, ""); // "akrepte" → "akrep" kaba kök
    const sIdx = SIGN_WORDS.findIndex((s) => t === s || base === s);
    if (sIdx >= 0) {
      if (!signs.includes(sIdx)) signs.push(sIdx);
      continue;
    }
    if (t === "burcu" || t === "burcunda") {
      // yalnız bir burç adından hemen sonra
      if (i > 0 && SIGN_WORDS.some((s) => tokens[i - 1] === s || tokens[i - 1].replace(/(un|ün|ın|in|da|de|ta|te)$/u, "") === s)) continue;
      return null;
    }
    const pw = PLANET_WORDS.find((p) => t === p);
    if (pw) {
      if (pw in PLANET_TR_LOW_TO_KEY) planet = PLANET_TR_LOW_TO_KEY[pw];
      continue;
    }
    if (/^\d+$/.test(t) || /^\d{1,2}\.\d{1,2}$/.test(t)) continue;
    if (MONTHS.includes(t) || FILLER.has(t)) continue;
    if (/^(retro|retrosu|retrosunda|retrolar)$/.test(t)) continue;
    if (/^(burç|burçlar|burçlarda|astroloji|astrolog|tarot|falı|fal|tutulma|tutulması|tutulmasi)$/.test(t)) continue;
    if (/^(11\.11|12\.12|1111|1212)$/.test(t)) continue;
    return null;
  }
  const has = (w: string) => tokens.some((t) => t === w);
  const any = (re: RegExp) => tokens.some((t) => re.test(t));
  let cls: TrendClass | null = null;
  let moonKind: TrendParse["moonKind"];
  if (any(/^retro/)) cls = "retro";
  else if (has("dolunay") || has("yeniay") || any(/^tutulma/)) {
    cls = "moon";
    moonKind = has("dolunay") ? "full" : has("yeniay") ? "new" : "eclipse";
  } else if (has("tarot")) cls = "tarot";
  else if (any(/^(rüya|rüyada|rüyalar|tabiri|tabirleri)$/)) cls = "dream";
  else if (any(/^(11\.11|12\.12|1111|1212)$/)) cls = "portal";
  else if (has("sezonu") && signs.length === 1) cls = "season";
  else if (any(/^(burç|burçlar|burçlarda|astroloji|astrolog)$/) || (signs.length >= 1 && (has("burcu") || has("burcunda")))) cls = "astro";
  if (!cls) return null;
  return { cls, tokens, planet, moonKind, signs };
}
// ─── Ana fonksiyon ───────────────────────────────────────────────────────
interface Item {
  tag: string;
  src: TagSource;
  kw?: string;
}
interface Cand {
  tier: number;
  line?: string;
  lead?: string;
  items: Item[];
  note: string;
}

const dedupe = (xs: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const k = low(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
};

export function topicalContext(date: string, video: TopicalVideo, opts: TopicalOptions = {}): TopicalContext {
  const slot: Slot = video.slot ?? "morning";
  const h = fnv(`${date}|${slot}`);
  const sky = skyState(date);
  const cat = video.category;
  const sources: Record<string, TagSource> = {};
  const notes: string[] = [];
  const note = (s: string) => notes.push(s);
  const reg = (tag: string, src: TagSource) => {
    const k = low(tag);
    if (!(k in sources)) sources[k] = src;
  };

  // a) video-özel + seed
  const vt = videoTags(cat, video.id);
  const specific = dedupe([
    ...vt.tags.filter((t) => !SEED_DROP.has(t)),
    ...(video.seedTags ?? []).filter((t) => !SEED_DROP.has(t) && TAG_RE.test(t)),
  ]);
  vt.tags.forEach((t) => reg(t, "video"));
  (video.seedTags ?? []).forEach((t) => reg(t, "seed"));

  // b) gök + takvim adayları
  const cands: Cand[] = [];
  const isSky = cat === "sky";
  const addCand = (c: Cand) => cands.push(c);

  const planetRank = (p: PlanetKey) => ["mercury", "venus", "mars", "jupiter", "saturn"].indexOf(p);
  for (const r of [...sky.retro].sort((a, b) => planetRank(a.planet) - planetRank(b.planet))) {
    const nm = PLANET_TR[r.planet];
    const emoji = PLANET_EMOJI[r.planet];
    const tag = tagify(`${nm}retrosu`);
    const kw = low(`${nm} retrosu`);
    const fast = FAST.includes(r.planet);
    if (r.phase === "active") {
      addCand({
        // Hızlı gezegenler (Merkür/Venüs/Mars) öne; yavaşlar etiket olarak geride kalır.
        tier: fast ? 2 : 3,
        line: fast ? `${nm} retrosu sürerken ${emoji}` : undefined,
        lead: fast && h % 2 === 0 ? `${nm} Retrosunda` : undefined,
        items: [{ tag, src: "sky", kw }],
        note: `${r.planet} retro aktif`,
      });
    } else {
      const when = { pre: "yarın başlıyor", start: "bugün başlıyor", end: "bugün bitiyor" }[r.phase];
      addCand({
        tier: 1,
        line: `${nm} retrosu ${when} ${emoji}`,
        lead: r.phase === "pre" ? undefined : `${nm} Retrosunda`,
        items: [{ tag, src: "sky", kw }],
        note: `${r.planet} retro ${r.phase}`,
      });
    }
  }
  for (const mo of sky.moon) {
    const sn = SIGN_NAMES[mo.sign];
    const loc = `${low(sn)}${SIGN_LOC[mo.sign]}`; // "akrepte"
    const day0 = mo.diff === 0;
    if (mo.kind === "full-moon" || mo.kind === "new-moon") {
      const full = mo.kind === "full-moon";
      const w = full ? "Dolunay" : "Yeniay";
      const wl = low(w);
      const line = day0
        ? `${sn} burcunda ${w} ${full ? "🌕" : "🌑"}`
        : mo.diff === -1
          ? `${w} yarın, ${sn} burcunda ${full ? "🌕" : "🌑"}`
          : `${w} etkisi sürerken ${full ? "🌕" : "🌑"}`;
      addCand({
        tier: day0 ? 1 : 2,
        line,
        lead: day0 ? `${w}da` : undefined,
        items: [
          { tag: `#${wl}`, src: "sky", kw: wl },
          { tag: tagify(`${loc}${wl}`), src: "sky", kw: `${low(sn)} burcunda ${wl}` },
        ],
        note: `${mo.kind} ${mo.diff >= 0 ? "+" : ""}${mo.diff}`,
      });
    } else {
      const lunar = mo.kind === "lunar-eclipse";
      const w = lunar ? "Ay tutulması" : "Güneş tutulması";
      addCand({
        tier: day0 ? 1 : 2,
        line: day0 ? `${sn} burcunda ${w} 🌘` : mo.diff === -1 ? `${w} yarın, ${sn} burcunda 🌘` : `${w} etkisi sürerken 🌘`,
        lead: day0 ? (lunar ? "Ay Tutulmasında" : "Güneş Tutulmasında") : undefined,
        items: [
          { tag: "#tutulma", src: "sky", kw: "tutulma" },
          { tag: tagify(w), src: "sky", kw: low(w) },
        ],
        note: `${mo.kind} ${mo.diff >= 0 ? "+" : ""}${mo.diff}`,
      });
    }
  }
  for (const cm of calendarMoments(date)) {
    if (cm.cats && !cm.cats.includes(cat)) continue;
    addCand({
      // Tek günlük özel anlar (11.11, Cadılar Bayramı …) gök olay günleriyle aynı kademe; "yaklaşırken" 2.
      tier: /yaklaşırken/.test(cm.line) ? 2 : 1,
      line: cm.line,
      items: cm.tags.map((t) => ({ tag: t, src: "calendar" as const, kw: cm.kw })),
      note: `takvim: ${cm.line}`,
    });
  }
  // Güneş burcu sezonu: etiket her gün; başlık satırı yalnız ilk 3 gün
  const sn = SIGN_NAMES[sky.sunSign];
  const seasonTag = tagify(`${sn}sezonu`);
  addCand({
    tier: sky.seasonEarly ? 4 : 6,
    line: sky.seasonEarly ? `${sn} sezonu ${sky.seasonIngress ? "başladı" : "sürüyor"} ${SIGN_EMOJI[sky.sunSign]}` : undefined,
    items: [{ tag: seasonTag, src: "sky", kw: low(`${sn} sezonu`) }],
    note: `Güneş ${sn} burcunda`,
  });
  const wd = weekdayMoment(date);
  if (wd)
    addCand({
      tier: 5,
      line: wd.line,
      items: wd.tags.map((t) => ({ tag: t, src: "calendar" as const, kw: wd.kw })),
      note: `hafta içi: ${wd.line}`,
    });

  // Aynı kademede dönüşümlü seç (ör. Merkür/Venüs retrosu iki slotta sırayla)
  const sorted = [...cands].sort((a, b) => a.tier - b.tier);
  // Başlık satırı olmayan aday (yavaş gezegen retro, sezon ortası) satır seçiminde atlanır.
  const lineable = sorted.filter((c) => c.line);
  const topTier = lineable.length ? lineable[0].tier : -1;
  const lineCands = lineable.filter((c) => c.tier === topTier);
  const chosen = lineCands.length ? lineCands[h % lineCands.length] : undefined;

  // Etiket sırası: seçilen adayın etiketleri önce, sonra kademe sırası
  const ordered = chosen ? [chosen, ...sorted.filter((c) => c !== chosen)] : sorted;
  const topicalItems: Item[] = [];
  for (const c of ordered) for (const it of c.items) if (TAG_RE.test(it.tag)) topicalItems.push(it);

  // YouTube öneki: aday listesinden, kademe sırasıyla ilk lead
  const leadCand = sorted.find((c) => c.lead);
  let titleLead = leadCand?.lead;

  // Gök Gündemi videosunda satır kancanın kendisi → tekrar etme
  let captionLine = chosen?.line;
  if (isSky) {
    captionLine = undefined;
    titleLead = undefined;
  }
  if (chosen) note(`satır: ${chosen.note}`);

  // c) trend (yalnız sözlük + video + gök uyumlu)
  let trend: TrendUse | undefined;
  const trends = opts.trends ?? readTrends();
  const have = new Set(topicalItems.map((i) => low(i.tag)));
  for (const raw of trends.slice(0, 25)) {
    const p = parseTrend(raw);
    if (!p) continue;
    const use = trendTag(p, raw, date, cat, vt.signs, sky, have);
    if (!use) continue;
    trend = use.use;
    if (use.mode === "boost") {
      const idx = topicalItems.findIndex((i) => low(i.tag) === low(use.use.tag));
      if (idx > 0) topicalItems.unshift(...topicalItems.splice(idx, 1));
    } else {
      topicalItems.unshift({ tag: use.use.tag, src: "trend", kw: low(raw) });
    }
    note(`trend: "${raw}" → ${use.use.tag} (${use.mode})`);
    break;
  }

  // Retro etiketleri en çok 2 (seçilen + bir tane); 3 gezegen etiketi dolgusu alakayı bulandırır.
  let retroTags = 0;
  const trimmed = topicalItems.filter((i) => {
    if (!/retrosu$/.test(i.tag)) return true;
    return ++retroTags <= 2;
  });
  topicalItems.length = 0;
  topicalItems.push(...trimmed);
  const topical = dedupe(topicalItems.map((i) => i.tag));
  topicalItems.forEach((i) => reg(i.tag, i.src));
  const keywords = dedupe(topicalItems.map((i) => i.kw ?? "").filter(Boolean));

  // d) evergreen — kategori yakınlığı, günlük döndürme
  const eligible = EVERGREEN.filter((e) => e.cats === "all" || e.cats.includes(cat)).map((e) => e.tag);
  const rot = eligible.length ? h % eligible.length : 0;
  const evergreen = [...eligible.slice(rot), ...eligible.slice(0, rot)];
  evergreen.forEach((t) => reg(t, "evergreen"));

  const brand = fnv(`brand|${date}|${slot}`) % 3 === 0;
  reg(BRAND_TAG, "brand");

  const hashtags = dedupe([...specific, ...topical, ...evergreen]);
  return {
    date,
    slot,
    captionLine,
    titleLead,
    specific,
    topical,
    evergreen,
    brand,
    hashtags,
    sources,
    keywords,
    trend,
    notes,
  };
}

function trendTag(
  p: TrendParse,
  raw: string,
  date: string,
  cat: string,
  videoSigns: number[],
  sky: SkyState,
  have: Set<string>,
): { use: TrendUse; mode: "new" | "boost" } | null {
  const astroCat = ASTRO_CATS.includes(cat);
  const mk = (tag: string): { use: TrendUse; mode: "new" | "boost" } | null => {
    if (!tag || !TAG_RE.test(tag) || tag.length > 26) return null;
    return { use: { title: raw, tag, mode: have.has(low(tag)) ? "boost" : "new" }, mode: have.has(low(tag)) ? "boost" : "new" };
  };
  switch (p.cls) {
    case "retro": {
      // Gök doğrulaması: o gezegenin retrosu aktif/yakın değilse trend yok sayılır.
      if (!p.planet || !sky.retro.some((r) => r.planet === p.planet)) return null;
      return mk(tagify(`${PLANET_TR[p.planet]}retrosu`));
    }
    case "moon": {
      const want = p.moonKind;
      const m = sky.moon.find((x) => (want === "full" ? x.kind === "full-moon" : want === "new" ? x.kind === "new-moon" : x.kind.endsWith("eclipse")));
      if (!m) return null;
      return mk(want === "full" ? "#dolunay" : want === "new" ? "#yeniay" : "#tutulma");
    }
    case "tarot":
      return cat === "tarot" ? mk(tagify(p.tokens.join(""))) : null;
    case "dream":
      return cat === "dream" ? mk(tagify(p.tokens.join(""))) : null;
    case "portal": {
      const md = date.slice(5);
      const want = p.tokens.some((t) => /1111|11\.11/.test(t)) ? "11-11" : p.tokens.some((t) => /1212|12\.12/.test(t)) ? "12-12" : "";
      if (!want || md !== want) return null;
      return mk(want === "11-11" ? "#1111portalı" : "#1212portalı");
    }
    case "season": {
      if (p.signs[0] !== sky.sunSign) return null;
      return mk(tagify(`${SIGN_NAMES[sky.sunSign]}sezonu`));
    }
    case "astro": {
      if (!astroCat) return null;
      // Burç adı geçiyorsa yalnız videonun kendi burcu(ları) için.
      if (p.signs.length) {
        const own = p.signs.filter((s) => videoSigns.includes(s));
        if (own.length !== p.signs.length) return null;
        return mk(signTag(own[0]));
      }
      const t = tagify(p.tokens.join(""));
      return mk(t);
    }
  }
  return null;
}

// ─── Kırpma: platform sınırı + garantili sky/takvim payı ─────────────────
export const TAG_CAP: Record<Platform, number> = { instagram: 5, tiktok: 5, youtube: 3 };

/**
 * Sıralı listeden `cap` etiket seçer.
 *  • Sky/takvim/trend için 1 (cap ≥ 5 ise 2) yer AYRILIR — yoksa özellik hiç görünmez;
 *    videoya özgü etiketler kalan yerleri doldurur (video > sky > evergreen sırası korunur).
 *  • #pythia yalnız `ctx.brand` ve `allowBrand` iken, bir yer alır.
 *  • Artan yerler sırayla: kalan topical → kalan specific → evergreen.
 */
export function topicalHashtags(ctx: TopicalContext, cap: number, allowBrand = false): string[] {
  const brand = allowBrand && ctx.brand && cap >= 5 ? 1 : 0;
  const reserve = Math.min(ctx.topical.length, cap >= 5 ? 2 : 1);
  const specTake = Math.max(0, cap - brand - reserve);
  const picked: string[] = [];
  const has = (t: string) => picked.some((x) => low(x) === low(t));
  const push = (t: string) => {
    if (picked.length < cap - brand && !has(t)) picked.push(t);
  };
  ctx.specific.slice(0, specTake).forEach(push);
  ctx.topical.slice(0, reserve).forEach(push);
  const rest = [...ctx.topical.slice(reserve), ...ctx.specific.slice(specTake), ...ctx.evergreen];
  rest.forEach(push);
  if (brand) picked.push(BRAND_TAG);
  return picked.slice(0, cap);
}

/** Günlük/annotation için tek satır. */
export function describeTopical(ctx: TopicalContext, tags: string[]): string {
  return `topikal ${ctx.date}/${ctx.slot}: satır=${ctx.captionLine ?? "-"} | etiket=${tags.join(" ")}${
    ctx.trend ? ` | trend="${ctx.trend.title}"→${ctx.trend.tag}(${ctx.trend.mode})` : ""
  }`;
}

// ─── CLI ─────────────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith("topical.ts")) {
  const arg = (k: string) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : undefined);
  const date = arg("--date") ?? istanbulDate(new Date());
  const category = arg("--category") ?? "zodiac";
  const id = arg("--id") ?? "scorpio";
  for (const slot of ["morning", "evening"] as Slot[]) {
    const c = topicalContext(date, { category, id, slot });
    console.log(`${date} ${slot}: ${c.captionLine ?? "(satır yok)"}`);
    for (const p of ["instagram", "tiktok", "youtube"] as Platform[])
      console.log(`  ${p.padEnd(9)} ${topicalHashtags(c, TAG_CAP[p], p === "instagram").join(" ")}`);
    if (c.notes.length) console.log(`  ${c.notes.join(" · ")}`);
  }
}
