// ═══════════════════════════════════════════════════════════════════════════
// metadata.ts — Conveyor Sort metadata (7 sentetik format, formata özel havuzlar)
//
// (category, id) imzaları KORUNUR → upload-* değişmez. İçerik id'den deterministik
// türetilir. Her formatın kendi başlık/açıklama/hashtag tonu var (FailBait =
// engagement-bait, ASMR = #asmr/#satisfying ağırlıklı).
// ═══════════════════════════════════════════════════════════════════════════

import { simulate } from "../src/game/botSim";
import { dailyConfig } from "../src/game/dailyConfig";
import { APP } from "../src/appConfig";

export type VideoMeta = { title: string; description: string; tags: string[] };

const GAME_CTA = ["", `📦 ${APP.name} — ${APP.storeName}'de ücretsiz`, `👉 ${APP.storeUrl}`, ""];

// ─── Hashtag havuzları ─────────────────────────────────────────────────────
const YT_TAGS: Record<string, string> = {
  default: "#satisfying #oddlysatisfying #mobilegame #puzzle #gaming #mobiloyun #bulmaca #shorts",
  failbait: "#satisfying #mobilegame #gaming #closecall #oyun #mobiloyun #shorts",
  asmr: "#asmr #satisfying #oddlysatisfying #relaxing #mobilegame #shorts",
};
const IG_TAGS: Record<string, string[]> = {
  default: ["#satisfying", "#mobilegame", "#puzzlegame", "#oddlysatisfying", "#keşfet"],
  failbait: ["#satisfying", "#mobilegame", "#gaming", "#closecall", "#keşfet"],
  asmr: ["#asmr", "#satisfying", "#oddlysatisfying", "#relaxing", "#keşfet"],
};

function clampTitle(t: string): string {
  return t.length > 100 ? t.substring(0, 97) + "..." : t;
}
function clampTags(tags: string[]): string[] {
  const out: string[] = [];
  let total = 0;
  for (const raw of tags) {
    const t = raw.trim();
    if (!t || t.length > 30) continue;
    if (total + t.length + 1 > 480) break;
    if (out.some((x) => x.toLowerCase() === t.toLowerCase())) continue;
    out.push(t);
    total += t.length + 1;
  }
  return out;
}
function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function dailyFinish(seed: number): string {
  return mmss(simulate(dailyConfig, seed, "clean").finishTimeSec);
}

type Parsed = { format: string; seed: number; level?: number };
function parseId(category: string, id: string): Parsed {
  const lvl = id.match(/-L(\d+)-(\d+)/); // showcase/failbait/boostersave/asmr
  if (lvl) return { format: category, level: Number(lvl[1]), seed: Number(lvl[2]) };
  const simple = id.match(/-(\d+)$/); // daily/seal/speedclimb
  return { format: category, seed: simple ? Number(simple[1]) : 0 };
}

const BASE_TAGS = [
  APP.name, "conveyor sort", "satisfying", "oddly satisfying", "mobile game",
  "mobil oyun", "puzzle game", "bulmaca oyunu", "sorting game", "sıralama oyunu", "gaming", "shorts",
];

// Formata özel içerik parçaları.
function content(p: Parsed): { hook: string; body: string; tagKey: string; extra: string[] } {
  switch (p.format) {
    case "daily":
      return { hook: `Bugünün bulmacası — ben ${dailyFinish(p.seed)}'te bitirdim, sen? 📦`, body: "Herkese aynı günlük bulmaca. Süreni yorumlara yaz 👇", tagKey: "default", extra: ["daily challenge", "günlük bulmaca"] };
    case "showcase":
      return { hook: `Seviye ${p.level} — bu tempoyu kaldırabilir misin? 📦`, body: "Paketleri doğru banda sırala, kutuları mühürle 📦", tagKey: "default", extra: [`level ${p.level}`, "hard level"] };
    case "seal":
      return { hook: "Oddly satisfying mühür yağmuru 📦", body: "En tatmin edici mühür anları arka arkaya 😌", tagKey: "default", extra: ["compilation", "satisfying compilation"] };
    case "speedclimb":
      return { hook: "1. seviye kolay dedin... 5.'ye gel 📦", body: "Seviye 1'den 5'e — her seviye biraz daha hızlı 😮‍💨", tagKey: "default", extra: ["speedrun", "level up"] };
    case "failbait":
      return { hook: "Bu paketi kurtarabilir miydin? 😱📦", body: "Son anda... sence kurtuldu mu, kaçtı mı? 👀 Yorumlara yaz 👇", tagKey: "failbait", extra: ["close call", "kurtarış"] };
    case "boostersave":
      return { hook: "Son saniye kurtarışı ⏳📦", body: "Bant doldu, dock doldu — tam o anda Yavaşlat! 😮‍💨", tagKey: "default", extra: ["clutch", "booster"] };
    case "asmr":
      return { hook: "Oddly satisfying paket sıralama 🎧 (ASMR)", body: "🎧 Sesi aç — sadece oyun sesleri. Rahatla 😌", tagKey: "asmr", extra: ["asmr", "relaxing", "sesli izle"] };
    default:
      return { hook: "Conveyor Sort 📦", body: "Paketleri sırala 📦", tagKey: "default", extra: [] };
  }
}

// ─── YouTube ───────────────────────────────────────────────────────────────
export function buildMetadata(category: string, id: string): VideoMeta {
  const p = parseId(category, id);
  const c = content(p);
  const title = clampTitle(`${c.hook} #shorts`);
  const description = [c.hook, "", c.body, ...GAME_CTA, YT_TAGS[c.tagKey] ?? YT_TAGS.default].join("\n");
  return { title, description, tags: clampTags([...BASE_TAGS, ...c.extra]) };
}

// ─── Instagram / TikTok caption ────────────────────────────────────────────
const IG_BRAND = [`📦 ${APP.name} — ${APP.storeName}'de ücretsiz`, "👇 Profildeki linke dokun · bio"];

export function buildInstagramCaption(category: string, id: string): string {
  const p = parseId(category, id);
  const c = content(p);
  const shareLine = p.format === "failbait" ? "📤 Bunu birine göster — o kurtarabilir miydi?" : "📤 Bunu sevecek birine gönder";
  const lines = [
    c.hook, "", c.body, "",
    "🔖 Kaydet — sonra dene", shareLine, "💬 Sen ne yapardın? Yorumlara yaz",
    "", ...IG_BRAND, "",
    (IG_TAGS[c.tagKey] ?? IG_TAGS.default).slice(0, 5).join(" "),
  ];
  const caption = lines.join("\n");
  return caption.length > 2150 ? caption.slice(0, 2150) : caption;
}

export function buildFirstComment(category: string, id: string): string {
  const p = parseId(category, id);
  switch (p.format) {
    case "daily":
      return `Ben ${dailyFinish(p.seed)}'te bitirdim ⏱️ Sen kaç saniyede? 👇 Herkese aynı bulmaca 📦`;
    case "failbait":
      return "Kurtuldu mu, kaçtı mı? 👀 Sen ne yapardın? 👇 Tahminini yaz 😏";
    case "asmr":
      return "🎧 Sesi aç — en tatmin edici kısım hangisiydi? 👇";
    case "seal":
      return "En tatmin edici mühür hangisiydi? 👇 Bence sonu 😌📦";
    case "boostersave":
      return "Booster'sız kurtarabilir miydin? 😅👇";
    default:
      return "Sen kaç saniyede geçerdin? ⏱️👇 Deneyip yaz — herkes görsün 📦";
  }
}
