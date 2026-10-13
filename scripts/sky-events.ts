// ═══════════════════════════════════════════════════════════════════════════
// sky-events.ts — "Gök Gündemi": retro / Yeniay / Dolunay / tutulma takvimi
//
// astronomy-engine ile (deterministik, çevrimdışı, ağ yok):
//   • Merkür, Venüs, Mars, Jüpiter, Satürn: görünür jeosantrik ekliptik boylamın
//     (ışık-sapmalı, tarihin gerçek ekliptiği — tropikal burç) değişim hızının
//     işaret değiştirdiği an = durağan (station). − → + düz hareket, + → − retro.
//     Zaman çözünürlüğü: 1 günlük tarama + ikili aramayla saniyeler.
//   • Yeniay / Dolunay: SearchMoonPhase(0|180). Burç = Ay'ın o andaki ekliptik
//     boylamı (yeniayda Güneş'le aynı).
//   • Tutulmalar: yalnız Ay tutulması (kısmi/tam) ve Güneş tutulması (hepsi);
//     yarıgölge Ay tutulması sıradan Dolunay sayılır. Tutulma, aynı gün gelen
//     Yeniay/Dolunay'ın YERİNE geçer (aynı olay).
//
// GÜN = Europe/Istanbul takvim günü (TR yayın saati). Rotasyon da UTC gün
// numarasıyla çalışır; yayın slotları (10:07/18:07 UTC) için UTC günü ile
// İstanbul günü aynıdır. 21:00 UTC'den sonra gecikmiş bir koşu ertesi güne
// düşer — rotasyonun mevcut davranışıyla aynı.
//
// YAYIN KURALI (bkz. planEveningSlot): olay günü AKŞAM slotu SkyEvent olur.
// Aynı güne birden çok olay düşerse öncelik: tutulma > retro başlangıç >
// retro bitiş > "yarın başlıyor" > Dolunay/Yeniay > "sürüyor". Kaybeden o gün
// atılır (olay günlüğe bağlı: ertelenirse içeriği yanlış olur); rotasyondaki
// yerinden edilen öğe ise KAYBOLMAZ, sonraki güne kayar (bkz. rotation.ts).
//
// CLI:  tsx scripts/sky-events.ts [--from YYYY-MM-DD] [--days 90]
// ═══════════════════════════════════════════════════════════════════════════

import {
  Body,
  EclipticGeoMoon,
  GeoVector,
  MakeTime,
  NextGlobalSolarEclipse,
  NextLunarEclipse,
  SearchGlobalSolarEclipse,
  SearchLunarEclipse,
  SearchMoonPhase,
  SunPosition,
  Ecliptic,
  type AstroTime,
} from "astronomy-engine";
import {
  PLANET_COPY,
  MOON_COPY,
  PLANET_ORDER,
  SIGN_NAMES,
  SIGN_IDS,
  type PlanetKey,
} from "../src/data/sky-copy";
import type { SkyCard, SkyKind } from "../src/data/sky-types";

export type { SkyCard, SkyKind } from "../src/data/sky-types";

export const DAY_MS = 86400000;
const BODY: Record<PlanetKey, Body> = {
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
};

// ─── Tarih yardımcıları (Europe/Istanbul) ────────────────────────────────
const istFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
export function istanbulParts(d: Date): { date: string; hour: number } {
  const p = Object.fromEntries(istFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}
export const istanbulDate = (d: Date): string => istanbulParts(d).date;

/** "YYYY-MM-DD" ↔ gün numarası (epoch'tan beri UTC gün; rotation.ts ile aynı eksen). */
export const dateToDay = (s: string): number => Math.floor(Date.parse(`${s}T00:00:00Z`) / DAY_MS);
export const dayToDate = (day: number): string => new Date(day * DAY_MS).toISOString().slice(0, 10);

const MONTHS_TR = [
  "OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN",
  "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK",
];
const MONTHS_TITLE = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
export function dateLabel(s: string): string {
  const [, m, d] = s.split("-").map(Number);
  return `${d} ${MONTHS_TR[m - 1]}`;
}
function dateLabelTitle(s: string): string {
  const [, m, d] = s.split("-").map(Number);
  return `${d} ${MONTHS_TITLE[m - 1]}`;
}

// ─── Ham gök hesabı ──────────────────────────────────────────────────────
const signOf = (lon: number): number => Math.floor((((lon % 360) + 360) % 360) / 30);

function planetLon(b: Body, t: AstroTime): number {
  return Ecliptic(GeoVector(b, t, true)).elon;
}
/** Boylam hızı (derece/gün), ±6 saatlik merkezî fark. */
function planetRate(b: Body, t: AstroTime): number {
  let d = planetLon(b, t.AddDays(0.25)) - planetLon(b, t.AddDays(-0.25));
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d * 2;
}

export type Station = { planet: PlanetKey; dir: "retro" | "direct"; at: Date; sign: number };

/** [fromMs, toMs] aralığındaki tüm durağanlar (zamana göre sıralı). */
export function findStations(fromMs: number, toMs: number): Station[] {
  const out: Station[] = [];
  for (const planet of PLANET_ORDER) {
    const b = BODY[planet];
    let t = MakeTime(new Date(fromMs));
    const end = MakeTime(new Date(toMs));
    let prev = planetRate(b, t);
    while (t.ut < end.ut) {
      const n = t.AddDays(1);
      const r = planetRate(b, n);
      if (prev * r < 0) {
        let lo = t;
        let hi = n;
        let rl = prev;
        for (let i = 0; i < 40; i++) {
          const m = lo.AddDays((hi.ut - lo.ut) / 2);
          const rm = planetRate(b, m);
          if (rl * rm <= 0) hi = m;
          else {
            lo = m;
            rl = rm;
          }
        }
        out.push({
          planet,
          dir: prev > 0 ? "retro" : "direct",
          at: hi.date,
          sign: signOf(planetLon(b, hi)),
        });
      }
      prev = r;
      t = n;
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

// ─── Olay modeli ─────────────────────────────────────────────────────────
export type SkyEvent = {
  /** Dedup/yayın günlüğü kimliği: olay + varyant + (İstanbul) olay tarihi. */
  id: string;
  kind: SkyKind;
  body: PlanetKey | "moon" | "sun";
  /** Yayın günü (İstanbul takvimi). retro-pre için olaydan 1 gün önce. */
  postDate: string;
  /** Asıl gök olayının İstanbul günü (durağan / faz / tutulma). */
  eventDate: string;
  /** Olayın anı (UTC ISO) — retro-mid için orta nokta tarihi. */
  at: string;
  /** Olay anında burç (0 Koç … 11 Balık). */
  sign: number;
  /** Olayın İstanbul saati (0-23) — "bu gece" / "bugün" ayrımı için. */
  hour: number;
  /** retro-mid / retro-pre için: retronun bitiş tarihi (İstanbul). */
  endDate?: string;
  /** Tutulma türü (Total/Partial/Annular/Hybrid). */
  eclipse?: string;
};

export const KIND_PRIORITY: Record<SkyKind, number> = {
  "lunar-eclipse": 0,
  "solar-eclipse": 0,
  "retro-start": 1,
  "retro-end": 2,
  "retro-pre": 3,
  "full-moon": 4,
  "new-moon": 4,
  "retro-mid": 5,
};

function mkId(kind: SkyKind, body: string, eventDate: string): string {
  return `${kind}-${body}-${eventDate}`;
}

function moonSignAt(t: AstroTime): number {
  return signOf(EclipticGeoMoon(t).lon);
}
function sunSignAt(t: AstroTime): number {
  return signOf(SunPosition(t).elon);
}

/** [from, to] (UTC ms) içinde postDate'i düşen TÜM ham olaylar (öncelik çözülmeden). */
export function rawEvents(fromMs: number, toMs: number): SkyEvent[] {
  const events: SkyEvent[] = [];
  // Retro dönemlerinin ortası/bitişi için pencereyi geniş tara (Satürn ~140 gün).
  const stations = findStations(fromMs - 260 * DAY_MS, toMs + 260 * DAY_MS);

  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    const p = istanbulParts(s.at);
    if (s.dir === "retro") {
      const next = stations.slice(i + 1).find((x) => x.planet === s.planet && x.dir === "direct");
      const endDate = next ? istanbulDate(next.at) : undefined;
      const base = { body: s.planet, at: s.at.toISOString(), sign: s.sign, hour: p.hour, endDate };
      events.push({
        ...base,
        id: mkId("retro-start", s.planet, p.date),
        kind: "retro-start",
        postDate: p.date,
        eventDate: p.date,
      });
      const pre = dayToDate(dateToDay(p.date) - 1);
      events.push({
        ...base,
        id: mkId("retro-pre", s.planet, p.date),
        kind: "retro-pre",
        postDate: pre,
        eventDate: p.date,
      });
      if (next && endDate) {
        const mid = dayToDate(Math.floor((dateToDay(p.date) + dateToDay(endDate)) / 2));
        const midAt = new Date((s.at.getTime() + next.at.getTime()) / 2);
        events.push({
          ...base,
          id: mkId("retro-mid", s.planet, p.date),
          kind: "retro-mid",
          postDate: mid,
          eventDate: p.date,
          // Orta noktadaki burç: o günkü gerçek konum (durağan burcundan farklı olabilir).
          sign: signOf(planetLon(BODY[s.planet], MakeTime(midAt))),
        });
      }
    } else {
      events.push({
        id: mkId("retro-end", s.planet, p.date),
        kind: "retro-end",
        body: s.planet,
        postDate: p.date,
        eventDate: p.date,
        at: s.at.toISOString(),
        sign: s.sign,
        hour: p.hour,
      });
    }
  }

  // Ay evreleri
  const fromT = MakeTime(new Date(fromMs - 2 * DAY_MS));
  const span = (toMs - fromMs) / DAY_MS + 6;
  for (const [lon, kind] of [[0, "new-moon"], [180, "full-moon"]] as const) {
    let t: AstroTime | null = SearchMoonPhase(lon, fromT, span);
    while (t && t.date.getTime() <= toMs + 3 * DAY_MS) {
      const p = istanbulParts(t.date);
      events.push({
        id: mkId(kind, "moon", p.date),
        kind,
        body: "moon",
        postDate: p.date,
        eventDate: p.date,
        at: t.date.toISOString(),
        sign: moonSignAt(t),
        hour: p.hour,
      });
      t = SearchMoonPhase(lon, t.AddDays(20), 15);
    }
  }

  // Tutulmalar (yalnız kısmi/tam Ay, tüm Güneş)
  let le = SearchLunarEclipse(fromT);
  while (le.peak.date.getTime() <= toMs + 3 * DAY_MS) {
    if (le.kind !== "penumbral") {
      const p = istanbulParts(le.peak.date);
      events.push({
        id: mkId("lunar-eclipse", "moon", p.date),
        kind: "lunar-eclipse",
        body: "moon",
        postDate: p.date,
        eventDate: p.date,
        at: le.peak.date.toISOString(),
        sign: moonSignAt(le.peak),
        hour: p.hour,
        eclipse: le.kind,
      });
    }
    le = NextLunarEclipse(le.peak);
  }
  let se = SearchGlobalSolarEclipse(fromT);
  while (se.peak.date.getTime() <= toMs + 3 * DAY_MS) {
    const p = istanbulParts(se.peak.date);
    events.push({
      id: mkId("solar-eclipse", "sun", p.date),
      kind: "solar-eclipse",
      body: "sun",
      postDate: p.date,
      eventDate: p.date,
      at: se.peak.date.toISOString(),
      sign: sunSignAt(se.peak),
      hour: p.hour,
      eclipse: se.kind,
    });
    se = NextGlobalSolarEclipse(se.peak);
  }

  const lo = istanbulDate(new Date(fromMs));
  const hi = istanbulDate(new Date(toMs));
  return events
    .filter((e) => e.postDate >= lo && e.postDate <= hi)
    .sort((a, b) => (a.postDate < b.postDate ? -1 : a.postDate > b.postDate ? 1 : KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind]));
}

// ─── Gün başına kazanan (akşam slotu) ────────────────────────────────────
export type DayPlan = { date: string; winner: SkyEvent; dropped: SkyEvent[] };

/**
 * Öncelik çözümü: aynı güne düşen olaylardan biri kazanır; tutulma aynı günkü faz
 * olayını yutar. "Sürüyor" (retro-mid) tarih esnektir: günü doluysa en yakın boş
 * güne (+1, −1, +2, −2 … en çok ±6) kayar, retro dönemi dışına çıkmaz.
 */
export function resolveDays(events: SkyEvent[]): DayPlan[] {
  const fixed = events.filter((e) => e.kind !== "retro-mid");
  const mids = events.filter((e) => e.kind === "retro-mid");
  const byDate = new Map<string, SkyEvent[]>();
  const add = (e: SkyEvent) => {
    const arr = byDate.get(e.postDate) ?? [];
    arr.push(e);
    byDate.set(e.postDate, arr);
  };
  fixed.forEach(add);
  for (const m of mids) {
    const d0 = dateToDay(m.postDate);
    const lo = dateToDay(m.eventDate) + 1;
    const hi = m.endDate ? dateToDay(m.endDate) - 1 : d0 + 6;
    let placed = m;
    for (const off of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) {
      const d = d0 + off;
      if (d < lo || d > hi) continue;
      const date = dayToDate(d);
      if (!byDate.has(date)) {
        placed = { ...m, postDate: date };
        break;
      }
    }
    add(placed); // yer bulunamadıysa kendi gününde kaybeder (dropped listesinde görünür)
  }
  const out: DayPlan[] = [];
  for (const [date, list] of [...byDate.entries()].sort()) {
    const sorted = [...list].sort((a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind] || (a.id < b.id ? -1 : 1));
    out.push({ date, winner: sorted[0], dropped: sorted.slice(1) });
  }
  return out;
}

export function planRange(fromDate: string, toDate: string): DayPlan[] {
  // Kenar etkisi olmasın: 8 gün dolgu ile çöz, sonra aralığa kırp.
  const from = Date.parse(`${fromDate}T00:00:00Z`) - 8 * DAY_MS;
  const to = Date.parse(`${toDate}T23:59:59Z`) + 8 * DAY_MS;
  return resolveDays(rawEvents(from, to)).filter((p) => p.date >= fromDate && p.date <= toDate);
}

// Yıl bazlı önbellek (rotasyon her gün tek günü sorar; doğrulama yüzlercesini).
const yearCache = new Map<number, Map<string, DayPlan>>();
function yearPlan(year: number): Map<string, DayPlan> {
  let m = yearCache.get(year);
  if (!m) {
    m = new Map(planRange(`${year}-01-01`, `${year}-12-31`).map((p) => [p.date, p]));
    yearCache.set(year, m);
  }
  return m;
}

/** O İstanbul gününün akşam slotunu alan gök olayı (yoksa null). */
export function skyEventForDate(date: string): SkyEvent | null {
  return yearPlan(Number(date.slice(0, 4))).get(date)?.winner ?? null;
}
export function skyEventForDay(day: number): SkyEvent | null {
  return skyEventForDate(dayToDate(day));
}

/** Kimlikten olayı yeniden kur (tarih kimliğin son 10 karakteri). */
export function skyEventById(id: string): SkyEvent | null {
  const date = id.slice(-10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const kindIsPre = id.startsWith("retro-pre-");
  // retro-pre'nin postDate'i olay gününden 1 gün önce; kimlikteki tarih olay günü.
  const probe = kindIsPre ? dayToDate(dateToDay(date) - 1) : date;
  const probeDay = new Date(`${probe}T12:00:00Z`).getTime();
  const lo = probeDay - 120 * DAY_MS; // retro-mid orta noktası olay gününden uzak olabilir
  const hi = probeDay + 120 * DAY_MS;
  // resolveDays: "sürüyor" günü kaymış olabilir; kimlikten kurulan olay yayın planıyla aynı olmalı.
  for (const d of resolveDays(rawEvents(lo, hi))) {
    const hit = [d.winner, ...d.dropped].find((e) => e.id === id);
    if (hit) return hit;
  }
  return null;
}

// ─── "En çok etkilenen" 3 burç — geleneksel mantık, deterministik ─────────
// Sıra: (1) olayın gerçekleştiği burç, (2) karşıt burç (7 uzakta), (3) gezegenin
// yönettiği burç(lar) (Merkür: İkizler/Başak …), sonra kareler (+3, +9) ve
// üçgenler (+4, +8). İlk 3 BENZERSİZ burç alınır. Ay evreleri için yönetici yok:
// burç, karşıtı, +3, +9. Kural kasıtlı basit ve belgelidir; astrolojik bir iddia
// değil, içerik çeşitliliği için sabit bir seçimdir.
export function affectedSigns(e: SkyEvent): number[] {
  const rulers = e.body in PLANET_COPY ? PLANET_COPY[e.body as PlanetKey].rulers : [];
  const order = [e.sign, (e.sign + 6) % 12, ...rulers, (e.sign + 3) % 12, (e.sign + 9) % 12, (e.sign + 4) % 12, (e.sign + 8) % 12];
  const out: number[] = [];
  for (const s of order) if (!out.includes(s)) out.push(s);
  return out.slice(0, 3);
}

// ─── Kart (Remotion prop'u + metin kaynağı) ──────────────────────────────
const tr = (s: string) => s.toLocaleUpperCase("tr");
const PLANET_TR_UP: Record<PlanetKey, string> = {
  mercury: "MERKÜR",
  venus: "VENÜS",
  mars: "MARS",
  jupiter: "JÜPİTER",
  saturn: "SATÜRN",
};

export function buildSkyCard(e: SkyEvent): SkyCard {
  const signName = SIGN_NAMES[e.sign];
  const isPlanet = e.body !== "moon" && e.body !== "sun";
  const p = isPlanet ? PLANET_COPY[e.body as PlanetKey] : null;
  const affected = affectedSigns(e).map((s) => ({
    signId: SIGN_IDS[s],
    signName: SIGN_NAMES[s],
    line: (p ? p.signLines : e.kind === "new-moon" || e.kind === "solar-eclipse" ? MOON_COPY.new.signLines : MOON_COPY.full.signLines)[s],
  }));
  const evLabel = dateLabel(e.eventDate);
  const nightWord = e.hour >= 12 ? "BU GECE" : "BUGÜN";
  let headline: string[];
  let sub: string;
  let tip: string;
  let theme: { title: string; desc: string };
  let accent: SkyCard["accent"];
  let date = evLabel;
  switch (e.kind) {
    case "retro-pre":
      headline = [`${PLANET_TR_UP[e.body as PlanetKey]} RETROSU`, "YARIN BAŞLIYOR"];
      sub = `${signName} burcunda`;
      tip = p!.tip.start;
      theme = p!.theme;
      accent = "retro";
      break;
    case "retro-start":
      headline = [`${PLANET_TR_UP[e.body as PlanetKey]} RETROSU`, "BAŞLIYOR"];
      sub = `${signName} burcunda`;
      tip = p!.tip.start;
      theme = p!.theme;
      accent = "retro";
      break;
    case "retro-mid":
      headline = [`${PLANET_TR_UP[e.body as PlanetKey]} RETROSU`, "SÜRÜYOR"];
      sub = e.endDate ? `${signName} burcunda · düz hareket: ${dateLabelTitle(e.endDate)}` : `${signName} burcunda`;
      tip = p!.tip.mid;
      theme = p!.theme;
      accent = "retro";
      date = dateLabel(e.postDate);
      break;
    case "retro-end":
      headline = [`${PLANET_TR_UP[e.body as PlanetKey]} RETROSU`, "BİTİYOR"];
      sub = `Düz harekete geçiyor · ${signName} burcunda`;
      tip = p!.tip.end;
      theme = p!.theme;
      accent = "direct";
      break;
    case "full-moon":
      headline = [`${nightWord} DOLUNAY`, `${tr(signName)} BURCUNDA`];
      sub = "Dolunay";
      tip = MOON_COPY.full.tip;
      theme = MOON_COPY.full.theme;
      accent = "full";
      break;
    case "new-moon":
      headline = [`${nightWord} YENİAY`, `${tr(signName)} BURCUNDA`];
      sub = "Yeniay";
      tip = MOON_COPY.new.tip;
      theme = MOON_COPY.new.theme;
      accent = "new";
      break;
    case "lunar-eclipse":
      headline = [`${nightWord} AY TUTULMASI`, `${tr(signName)} BURCUNDA`];
      sub = e.eclipse === "total" ? "Tam Ay tutulması · Dolunay" : "Kısmi Ay tutulması · Dolunay";
      tip = MOON_COPY.lunarEclipse.tip;
      theme = MOON_COPY.lunarEclipse.theme;
      accent = "eclipse";
      break;
    case "solar-eclipse":
      headline = ["GÜNEŞ TUTULMASI", `${tr(signName)} BURCUNDA`];
      sub = `${{ total: "Tam", partial: "Kısmi", annular: "Halkalı", hybrid: "Melez" }[e.eclipse ?? "partial"] ?? "Güneş"} tutulma · Yeniay`;
      tip = MOON_COPY.solarEclipse.tip;
      theme = MOON_COPY.solarEclipse.theme;
      accent = "eclipse";
      break;
  }
  const hookLine = `${headline.join(" ")} · ${date}`;
  return {
    id: e.id,
    kind: e.kind,
    body: e.body,
    accent,
    headline,
    sub,
    dateLabel: date,
    hookLine,
    signId: SIGN_IDS[e.sign],
    signName,
    theme,
    affected,
    tip,
    question: "Senin burcun listede mi?",
    planetName: isPlanet ? PLANET_COPY[e.body as PlanetKey].name : e.body === "sun" ? "Güneş" : "Ay",
    hashtags: isPlanet ? PLANET_COPY[e.body as PlanetKey].hashtags : e.kind.includes("eclipse") ? ["#tutulma", "#astroloji", "#burçlar", "#ay", "#pythia"] : e.kind === "new-moon" ? ["#yeniay", "#astroloji", "#burçlar", "#niyet", "#pythia"] : ["#dolunay", "#astroloji", "#burçlar", "#ay", "#pythia"],
  };
}

export function skyCardById(id: string): SkyCard | null {
  const e = skyEventById(id);
  return e ? buildSkyCard(e) : null;
}

// ─── CLI ─────────────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith("sky-events.ts")) {
  const arg = (k: string) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : undefined);
  const from = arg("--from") ?? istanbulDate(new Date());
  const days = Number(arg("--days") ?? 90);
  const to = dayToDate(dateToDay(from) + days);
  for (const pl of planRange(from, to)) {
    const c = buildSkyCard(pl.winner);
    const drop = pl.dropped.length ? `   (elenen: ${pl.dropped.map((d) => d.id).join(", ")})` : "";
    console.log(`${pl.date}  akşam  ${pl.winner.kind.padEnd(13)} ${c.hookLine}${drop}`);
  }
}
