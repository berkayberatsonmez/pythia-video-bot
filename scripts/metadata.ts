// ═══════════════════════════════════════════════════════════════════════════
// metadata.ts — Kategori-bilinçli YouTube metadata üretici
//
// buildMetadata(category, id) → { title, description, tags }
// 6 kategori: dream, tarot, number(lifepath/angel), zodiac, manifest
//
// Tasarım ilkeleri (Shorts için optimize):
//   • Başlık = merak boşluğu ("X yaşadıysan → bilinçaltın BUNU söylüyor")
//   • Etiketler = TR long-tail + EN (8 dil / 175 ülke kitlesi için) ~12 adet
//   • Açıklama = 3 anlam + soru (yorum yemi) + CTA + hashtag satırı + disclaimer
// ═══════════════════════════════════════════════════════════════════════════

import { getSymbolById } from "../src/data/dream-symbols";
import { getTarotById } from "../src/data/tarot-cards";
import { getNumberById } from "../src/data/numbers";
import { getZodiacById } from "../src/data/zodiac-signs";
import { getManifestById } from "../src/data/manifestation";
import { getRankingById } from "../src/data/zodiac-rankings";
import { getBehaviorById } from "../src/data/zodiac-behaviors";
import { getCompatibilityById } from "../src/data/zodiac-compatibility";
import { skyCardById } from "./sky-events";
import type { SkyCard } from "../src/data/sky-types";
import { istanbulDate } from "./sky-events";
import {
  TAG_CAP,
  topicalContext,
  topicalHashtags,
  type Slot,
  type TopicalContext,
} from "./topical";

/**
 * Güncel bağlam seçenekleri. Verilmezse tarih = bugün (İstanbul), slot = sabah.
 * Yayın yolu slotu geçirir (aynı gün sabah/akşam farklı etiket setleri için).
 */
export interface MetaOpts {
  date?: string;
  slot?: Slot;
  /** Trend başlıkları (test/verify için enjekte; yoksa out/trends dosyasından). */
  trends?: string[];
}

/** Kategorinin eski sabit etiketleri → topical.ts'te "seed" kaynağı (video-özel etiketlerden sonra). */
function seedsFor(category: string, id: string): string[] {
  switch (category) {
    case "dream":
      return ["#rüyayorumu", "#bilinçaltı", "#rüya"];
    case "tarot":
      return ["#günlükkart", "#kehanet"];
    case "number":
      return getNumberById(id)?.kind === "angel"
        ? ["#numeroloji", "#ruhsalfarkındalık"]
        : ["#ruhsalfarkındalık", "#mistik"];
    case "manifest":
      return ["#olumlama", "#çekimyasası", "#manifestasyon"];
    case "behavior":
    case "compat":
      return ["#ilişki"];
    default:
      return [];
  }
}

/** Yayın bağlamındaki slot adını (serbest string) MetaOpts'a çevirir. */
export function optsFromContext(ctx?: { slot?: string }): MetaOpts {
  const slot = ctx?.slot === "evening" ? "evening" : ctx?.slot === "morning" ? "morning" : undefined;
  return { slot };
}

export function topicalFor(category: string, id: string, o?: MetaOpts): TopicalContext {
  return topicalContext(
    o?.date ?? istanbulDate(new Date()),
    { category, id, slot: o?.slot, seedTags: seedsFor(category, id) },
    { trends: o?.trends },
  );
}

/** Başlık: doğal bir önek varsa ve 100 karaktere sığıyorsa kullan; sığmazsa KIRPMADAN düz başlık. */
function leadTitle(lead: string | undefined, plain: string, led: (l: string) => string): string {
  if (!lead) return clampTitle(plain);
  const t = led(lead);
  return t.length <= 100 ? t : clampTitle(plain);
}

/** YouTube açıklaması: en çok 3 hashtag (ilk üçü başlığın üstünde görünür); #shorts başlıkta. */
function ytHashtags(T: TopicalContext): string {
  return topicalHashtags(T, TAG_CAP.youtube).join(" ");
}

/** Açıklamada kanca satırından hemen sonra güncel satırı ekler. */
function withTopicalLine(lines: string[], line?: string): string[] {
  return line ? [lines[0], line, ...lines.slice(1)] : lines;
}

export type VideoMeta = {
  title: string;
  description: string;
  tags: string[];
};

const PYTHIA_CTA = [
  "",
  "📱 Pythia — AI ile rüya tabiri, tarot, burç, numeroloji",
  "🌍 8 dilde, 175 ülkede",
  "🎁 3 gün ücretsiz dene",
  "👇 Profil bio'da link",
  "",
];

const DISCLAIMER = "* Yalnızca eğlence amaçlıdır.";

function clampTitle(t: string): string {
  return t.length > 100 ? t.substring(0, 97) + "..." : t;
}

// YouTube tag toplamı 500 karakteri geçemez — güvenli kırpma
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

// ─── DREAM ───────────────────────────────────────────────────────────────
function dreamMeta(id: string, o?: MetaOpts): VideoMeta | null {
  const s = getSymbolById(id);
  if (!s) return null;
  const T = topicalFor("dream", id, o);
  const upper = s.symbolNameUpper.replace(/\n/g, " ");
  const title = leadTitle(
    T.titleLead,
    `Rüyanda ${upper} Gördüysen 🌙 Bilinçaltın Bu 3 Şeyi Söylüyor #shorts`,
    (l) => `${l} Rüyanda ${upper} Gördüysen 🌙 Bilinçaltın Bu 3 Şeyi Söylüyor #shorts`,
  );
  const desc = withTopicalLine([
    `Rüyanda ${s.symbolName} gördüysen bilinçaltın bunu söylüyor 🌙`,
    "",
    ...s.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${s.questionBody.replace(/\n/g, " ")} ${s.questionFooter}`,
    "",
    "Seninki nasıldı? 👇 Yorumlara yaz, beraber yorumlayalım 🌙",
    ...PYTHIA_CTA,
    ytHashtags(T),
    "",
    DISCLAIMER,
  ], T.captionLine).join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      ...T.keywords.slice(0, 2),
      "rüya tabiri",
      "rüya yorumu",
      `rüyada ${s.symbolName} görmek`,
      s.symbolName,
      "rüya anlamı",
      "bilinçaltı",
      "mistik",
      "psikoloji",
      "dream meaning",
      "dream interpretation",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── TAROT ───────────────────────────────────────────────────────────────
function tarotMeta(id: string, o?: MetaOpts): VideoMeta | null {
  const c = getTarotById(id);
  if (!c) return null;
  const T = topicalFor("tarot", id, o);
  const title = leadTitle(
    T.titleLead,
    `Bugün Senin Kartın: ${c.cardName} 🔮 Evren Sana Bunu Söylüyor #shorts`,
    (l) => `${l} Bugün Senin Kartın: ${c.cardName} 🔮 Evren Sana Bunu Söylüyor #shorts`,
  );
  const desc = withTopicalLine([
    `Bugün senin tarot kartın: ${c.cardName} (${c.cardNameSub}) 🔮`,
    `Enerji: ${c.energy}`,
    "",
    ...c.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${c.questionBody.replace(/\n/g, " ")} ${c.questionFooter}`,
    "",
    "Sen bugün hangi kartı çekiyorsun? 👇 Yorumlara yaz 🔮",
    ...PYTHIA_CTA,
    ytHashtags(T),
    "",
    DISCLAIMER,
  ], T.captionLine).join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      ...T.keywords.slice(0, 2),
      "tarot",
      "tarot falı",
      "günlük tarot",
      c.cardName,
      "tarot kartları",
      "fal",
      "mistik",
      "tarot reading",
      "tarot cards",
      "daily tarot",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── NUMBER (lifepath + angel) ───────────────────────────────────────────
function numberMeta(id: string, o?: MetaOpts): VideoMeta | null {
  const n = getNumberById(id);
  if (!n) return null;
  const T = topicalFor("number", id, o);

  if (n.kind === "lifepath") {
    const title = clampTitle(
      `Yaşam Yolu ${n.number} İsen 🔢 ${n.title} Olduğunu Biliyor muydun? #shorts`,
    );
    const desc = withTopicalLine([
      `Yaşam yolu sayın ${n.number} ise, sen bir ${n.title.toLowerCase()}sın 🔢`,
      "",
      ...n.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
      "",
      `${n.questionBody.replace(/\n/g, " ")} ${n.questionFooter}`,
      "",
      "Senin yaşam yolu sayın kaç? 👇 Yorumlara yaz 🔢",
      ...PYTHIA_CTA,
      ytHashtags(T),
      "",
      DISCLAIMER,
    ], T.captionLine).join("\n");
    return {
      title,
      description: desc,
      tags: clampTags([
        ...T.keywords.slice(0, 2),
        "numeroloji",
        "yaşam yolu sayısı",
        `yaşam yolu ${n.number}`,
        "numeroloji hesaplama",
        "mistik",
        "astroloji",
        "numerology",
        "life path number",
        `life path ${n.number}`,
        "Pythia",
        "shorts",
      ]),
    };
  }

  // angel
  const title = clampTitle(
    `Sürekli ${n.number} Görüyorsan 👁️ Melekler Sana Bunu Söylüyor #shorts`,
  );
  const desc = withTopicalLine([
    `Sürekli ${n.number} görüyorsan bu tesadüf değil — ${n.title} ✨`,
    "",
    ...n.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${n.questionBody.replace(/\n/g, " ")} ${n.questionFooter}`,
    "",
    "Sen hangi sayıyı sürekli görüyorsun? 👇 Yorumlara yaz ✨",
    ...PYTHIA_CTA,
    ytHashtags(T),
    "",
    DISCLAIMER,
  ], T.captionLine).join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      ...T.keywords.slice(0, 2),
      "melek sayıları",
      `${n.number} melek sayısı`,
      `melek sayısı ${n.number}`,
      "manifest",
      "mistik",
      "spiritüel",
      "angel numbers",
      `${n.number} angel number`,
      "manifestation",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── ZODIAC ──────────────────────────────────────────────────────────────
function zodiacMeta(id: string, o?: MetaOpts): VideoMeta | null {
  const z = getZodiacById(id);
  if (!z) return null;
  const T = topicalFor("zodiac", id, o);
  const subLower = z.signNameSub.toLowerCase();
  const title = leadTitle(
    T.titleLead,
    `${z.signName} Burcuysan 🔮 Kimsenin Bilmediği 3 Gizli Özelliğin #shorts`,
    (l) => `${l} ${z.signName} Burcuysan 🔮 Kimsenin Bilmediği 3 Gizli Özelliğin #shorts`,
  );
  const desc = withTopicalLine([
    `${z.signName} (${z.signNameSub}) burcunun kimsenin bilmediği gizli yüzü 🔮`,
    `Element: ${z.element} · ${z.dateRange}`,
    "",
    ...z.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${z.questionBody.replace(/\n/g, " ")} ${z.questionFooter}`,
    "",
    `${z.signName} olan var mı? 👇 Yorumlara yaz, etiketle 🔮`,
    ...PYTHIA_CTA,
    ytHashtags(T),
    "",
    DISCLAIMER,
  ], T.captionLine).join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      ...T.keywords.slice(0, 2),
      "burç",
      "burç yorumu",
      `${z.signName} burcu`,
      z.signNameSub,
      "astroloji",
      "günlük burç",
      "mistik",
      "zodiac",
      "astrology",
      "horoscope",
      `${subLower} zodiac`,
      "Pythia",
    ]),
  };
}

// ─── MANIFESTO ───────────────────────────────────────────────────────────
function manifestMeta(id: string, o?: MetaOpts): VideoMeta | null {
  const m = getManifestById(id);
  if (!m) return null;
  const T = topicalFor("manifest", id, o);
  const t = m.theme.charAt(0) + m.theme.slice(1).toLocaleLowerCase("tr");
  const title = clampTitle(
    `${t} İstiyorsan Bunu Her Sabah Oku 🌙 Manifesto #shorts`,
  );
  const desc = withTopicalLine([
    `${t} istiyorsan bunu her sabah yüksek sesle oku 🌙`,
    "",
    ...m.lines.map((l) => `✨ ${l}`),
    "",
    "Yüksek sesle söyle, niyetini gerçeğe çağır.",
    "Pythia sana niyetine özel manifesto yazar.",
    "",
    "Sen neyi manifest ediyorsun? 👇 Yorumlara yaz 🌙",
    ...PYTHIA_CTA,
    ytHashtags(T),
    "",
    DISCLAIMER,
  ], T.captionLine).join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      ...T.keywords.slice(0, 2),
      "manifesto",
      "olumlama",
      "manifest",
      "afirmasyon",
      "çekim yasası",
      "mistik",
      "spiritüel",
      "law of attraction",
      "affirmations",
      "manifestation",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── RANKING (viral top-3 burç sıralaması) ───────────────────────────────
function rankingMeta(id: string, o?: MetaOpts): VideoMeta | null {
  const r = getRankingById(id);
  if (!r) return null;
  const T = topicalFor("ranking", id, o);
  const nm = (sid: string) => getZodiacById(sid)?.signName ?? sid;
  const title = leadTitle(
    T.titleLead,
    `${r.trait} 3 Burç 🔮 Seninki Var mı? #shorts`,
    (l) => `${l} ${r.trait} 3 Burç 🔮 Seninki Var mı? #shorts`,
  );
  const desc = withTopicalLine([
    `${r.trait} 3 burç 🔮`,
    "",
    `🥉 3. ${nm(r.ranks[0].signId)} — ${r.ranks[0].blurb}`,
    `🥈 2. ${nm(r.ranks[1].signId)} — ${r.ranks[1].blurb}`,
    `🥇 1. ${nm(r.ranks[2].signId)} — ${r.ranks[2].blurb}`,
    "",
    `${r.question} 👇 Yorumlara yaz`,
    ...PYTHIA_CTA,
    ytHashtags(T),
    "",
    DISCLAIMER,
  ], T.captionLine).join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      ...T.keywords.slice(0, 2),
      "burç",
      "astroloji",
      "burç sıralaması",
      "burçlar",
      "günlük burç",
      "zodiac",
      "astrology",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── BEHAVIOR (viral burç davranış senaryosu) ────────────────────────────
function behaviorMeta(id: string, o?: MetaOpts): VideoMeta | null {
  const b = getBehaviorById(id);
  if (!b) return null;
  const T = topicalFor("behavior", id, o);
  const nm = getZodiacById(b.signId)?.signName ?? "";
  const title = clampTitle(`Bir ${nm} ${b.scenario}… 😱 #shorts`);
  const desc = withTopicalLine([
    `Bir ${nm} ${b.scenario} ne yapar? 👀`,
    "",
    `1️⃣ ${b.beats[0]}`,
    `2️⃣ ${b.beats[1]}`,
    `3️⃣ ${b.beats[2]}`,
    "",
    `${b.question} 👇 Yorumlara yaz`,
    ...PYTHIA_CTA,
    ytHashtags(T),
    "",
    DISCLAIMER,
  ], T.captionLine).join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      ...T.keywords.slice(0, 2),
      "burç",
      "astroloji",
      "burç davranışları",
      "burçlar",
      "ilişki",
      "zodiac",
      "astrology",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── COMPAT (viral burç uyumu) ───────────────────────────────────────────
function compatMeta(id: string, o?: MetaOpts): VideoMeta | null {
  const c = getCompatibilityById(id);
  if (!c) return null;
  const T = topicalFor("compat", id, o);
  const n1 = getZodiacById(c.sign1Id)?.signName ?? "";
  const n2 = getZodiacById(c.sign2Id)?.signName ?? "";
  const title = leadTitle(
    T.titleLead,
    `${n1} + ${n2} = ${c.verdict} #shorts`,
    (l) => `${l} ${n1} + ${n2} = ${c.verdict} #shorts`,
  );
  const desc = withTopicalLine([
    `${n1} + ${n2} uyumlu mu? 👀`,
    "",
    `Sonuç: ${c.verdict}`,
    `1️⃣ ${c.beats[0]}`,
    `2️⃣ ${c.beats[1]}`,
    `3️⃣ ${c.beats[2]}`,
    "",
    `${c.question} 👇 O kişiyi etiketle`,
    ...PYTHIA_CTA,
    ytHashtags(T),
    "",
    DISCLAIMER,
  ], T.captionLine).join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      ...T.keywords.slice(0, 2),
      "burç",
      "burç uyumu",
      "astroloji",
      "ilişki",
      "burçlar",
      "zodiac",
      "astrology",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── SKY (Gök Gündemi) ───────────────────────────────────────────────────
// YouTube başlığı: tarih-only spam YOK; merak boşluğu + olay + burç.
const SKY_TITLE: Record<SkyCard["kind"], (c: SkyCard) => string> = {
  "retro-pre": (c) => `${c.planetName} Retrosu Yarın Başlıyor: ${c.signName} Burcunda Neler Hissedilebilir?`,
  "retro-start": (c) => `${c.planetName} Retrosu Başladı: En Çok Hangi 3 Burç Hissedebilir?`,
  "retro-mid": (c) => `${c.planetName} Retrosu Sürüyor: Bu Dönemde Neye Dikkat Etmekte Fayda Var?`,
  "retro-end": (c) => `${c.planetName} Retrosu Bitiyor: Düz Harekete Geçerken Neler Değişebilir?`,
  "full-moon": (c) => `${c.signName} Burcunda Dolunay: Bu Gece 3 Burç Daha Çok Hissedebilir`,
  "new-moon": (c) => `${c.signName} Burcunda Yeniay: Niyet Koymak İçin Uygun mu?`,
  "lunar-eclipse": (c) => `${c.signName} Burcunda Ay Tutulması: Astrolojide Ne Anlama Gelir?`,
  "solar-eclipse": (c) => `${c.signName} Burcunda Güneş Tutulması: Yeni Sayfa Teması`,
};

function skyMeta(id: string, o?: MetaOpts): VideoMeta | null {
  const c = skyCardById(id);
  if (!c) return null;
  const T = topicalFor("sky", id, o);
  const lines = c.affected.map((a) => `• ${a.signName}: ${a.line}`);
  const tagWord = c.hashtags[0].replace(/^#/, "");
  return {
    title: clampTitle(`${SKY_TITLE[c.kind](c)} #shorts`),
    description: [
      c.hookLine,
      "",
      c.theme.desc,
      "",
      "En çok hissedebilecek 3 burç:",
      ...lines,
      "",
      `💡 ${c.tip}`,
      "",
      "Senin burcun listede mi? Yorumlara yaz 👇",
      ...PYTHIA_CTA,
      ytHashtags(T),
      "",
      DISCLAIMER,
    ].join("\n"),
    tags: clampTags([
      tagWord,
      `${c.planetName} retrosu`,
      "astroloji",
      "burçlar",
      "burç yorumları",
      "retro",
      "gök olayları",
      "dolunay",
      "yeniay",
      c.signName + " burcu",
      "astrology",
      "retrograde",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── Dispatcher ──────────────────────────────────────────────────────────
export function buildMetadata(category: string, id: string, opts?: MetaOpts): VideoMeta {
  let meta: VideoMeta | null = null;
  switch (category) {
    case "dream":
      meta = dreamMeta(id, opts);
      break;
    case "tarot":
      meta = tarotMeta(id, opts);
      break;
    case "number":
      meta = numberMeta(id, opts);
      break;
    case "zodiac":
      meta = zodiacMeta(id, opts);
      break;
    case "manifest":
      meta = manifestMeta(id, opts);
      break;
    case "ranking":
      meta = rankingMeta(id, opts);
      break;
    case "behavior":
      meta = behaviorMeta(id, opts);
      break;
    case "compat":
      meta = compatMeta(id, opts);
      break;
    case "sky":
      meta = skyMeta(id, opts);
      break;
  }
  if (!meta) {
    throw new Error(`Metadata üretilemedi: ${category}/${id}`);
  }
  return meta;
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTAGRAM caption — IG'ye ÖZEL (YouTube'dan farklı, 2026 best practice)
//   • İlk satır = güçlü kanca (IG 125 karakterde "...more" ile keser)
//   • 3 anlam → sessiz izlenebilir (completion rate ↑)
//   • CTA: 🔖 Kaydet + 📤 Gönder (2026 #1 sinyal: DM share) + 💬 Yorum
//   • 5 hashtag (2026: 5'ten fazlası reach DÜŞÜRÜR): topical.ts seçer (video > gök/takvim > evergreen)
// ═══════════════════════════════════════════════════════════════════════════

const IG_BRAND = [
  "🔮 Pythia — AI ile rüya tabiri, tarot, burç, numeroloji",
  "🎁 Profilde 3 gün ücretsiz · 👇 Link bio'da",
];

function meaningsBlock(meanings: { title: string; desc: string }[]): string[] {
  return meanings.map(
    (m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`,
  );
}

function igAssemble(p: {
  hook: string;
  body: string[];
  reflection?: string;
  save: string;
  share: string;
  comment: string;
  hashtags: string[];
  /** Güncel satır (topical.ts); kancadan hemen sonra. Kanca satırı DEĞİŞMEZ (mükerrer koruması ona bakar). */
  captionLine?: string;
}): string {
  const lines = [
    p.hook,
    ...(p.captionLine ? [p.captionLine] : []),
    "",
    ...p.body,
    "",
    ...(p.reflection ? [p.reflection, ""] : []),
    `🔖 ${p.save}`,
    `📤 ${p.share}`,
    `💬 ${p.comment}`,
    "",
    ...IG_BRAND,
    "",
    p.hashtags.join(" "),
    "",
    "* Yalnızca eğlence amaçlıdır.",
  ];
  const caption = lines.join("\n");
  return caption.length > 2150 ? caption.slice(0, 2150) : caption;
}

export function buildInstagramCaption(category: string, id: string, opts?: MetaOpts): string {
  const T = topicalFor(category, id, opts);
  const tags = topicalHashtags(T, TAG_CAP.instagram, true);
  const captionLine = T.captionLine;
  switch (category) {
    case "dream": {
      const s = getSymbolById(id);
      if (!s) break;
      return igAssemble({
        hook: `Rüyada ${s.symbolName} görmek ne demek? 🌙 Bilinçaltın söylüyor:`,
        body: meaningsBlock(s.meanings),
        reflection: `${s.questionBody.replace(/\n/g, " ")} — ${s.questionFooter}`,
        save: "Kaydet — sabah hatırla",
        share: "Aynı rüyayı gören birine gönder",
        comment: "Seninki nasıldı? Yorumlara yaz",
        hashtags: tags,
        captionLine,
      });
    }
    case "tarot": {
      const c = getTarotById(id);
      if (!c) break;
      return igAssemble({
        hook: `${c.cardName} kartı ne anlama gelir? 🔮 Bugün sana diyor ki:`,
        body: meaningsBlock(c.meanings),
        reflection: `${c.questionBody.replace(/\n/g, " ")} — ${c.questionFooter}`,
        save: "Kaydet — günün kartı",
        share: "Bugün kart çekmesi gereken birine gönder",
        comment: "Sen hangi kartı çekiyorsun?",
        hashtags: tags,
        captionLine,
      });
    }
    case "zodiac": {
      const z = getZodiacById(id);
      if (!z) break;
      return igAssemble({
        hook: `${z.signName} burcu özellikleri 🔮 Kimsenin bilmediği 3 gizli yön:`,
        body: meaningsBlock(z.meanings),
        reflection: `${z.questionBody.replace(/\n/g, " ")} — ${z.questionFooter}`,
        save: "Kaydet — sonra oku",
        share: `Bir ${z.signName} burcuna gönder`,
        comment: `${z.signName} olan var mı? Yorumlara yaz`,
        hashtags: tags,
        captionLine,
      });
    }
    case "number": {
      const n = getNumberById(id);
      if (!n) break;
      if (n.kind === "lifepath") {
        return igAssemble({
          hook: `Yaşam yolu ${n.number} kimdir? 🔢 Gerçek karakterin:`,
          body: meaningsBlock(n.meanings),
          reflection: `${n.questionBody.replace(/\n/g, " ")} — ${n.questionFooter}`,
          save: "Kaydet — kendini tanı",
          share: `Yaşam yolu ${n.number} olan birine gönder`,
          comment: "Senin yaşam yolu sayın kaç?",
          hashtags: tags,
        captionLine,
        });
      }
      return igAssemble({
        hook: `Sürekli ${n.number} görmek ne demek? 👁️ Melek sayısı ${n.number}:`,
        body: meaningsBlock(n.meanings),
        reflection: `${n.questionBody.replace(/\n/g, " ")} — ${n.questionFooter}`,
        save: "Kaydet — işaret bu",
        share: `Sürekli ${n.number} gören birine gönder`,
        comment: "Sen hangi sayıyı görüyorsun?",
        hashtags: tags,
        captionLine,
      });
    }
    case "manifest": {
      const m = getManifestById(id);
      if (!m) break;
      const t = m.theme.charAt(0) + m.theme.slice(1).toLocaleLowerCase("tr");
      return igAssemble({
        hook: `${t} istiyorsan bunu yüksek sesle oku 🌙✨`,
        body: m.lines.map((l) => `✨ ${l}`),
        reflection: "Niyetini gerçeğe çağır 🌙",
        save: "Kaydet — her sabah oku",
        share: "Bunu duyması gereken birine gönder",
        comment: 'İnanıyorsan "geliyor" yaz 💫',
        hashtags: tags,
        captionLine,
      });
    }
    case "ranking": {
      const r = getRankingById(id);
      if (!r) break;
      const nm = (sid: string) => getZodiacById(sid)?.signName ?? sid;
      return igAssemble({
        hook: `${r.trait} 3 burç 🔮 Seninki var mı?`,
        body: [
          `🥉 3. ${nm(r.ranks[0].signId)} — ${r.ranks[0].blurb}`,
          `🥈 2. ${nm(r.ranks[1].signId)} — ${r.ranks[1].blurb}`,
          `🥇 1. ${nm(r.ranks[2].signId)} — ${r.ranks[2].blurb}`,
        ],
        reflection: r.question,
        save: "Kaydet — arkadaşına göster",
        share: "Bu listede olan birine gönder",
        comment: `${r.question} Yorumlara yaz`,
        hashtags: tags,
        captionLine,
      });
    }
    case "behavior": {
      const b = getBehaviorById(id);
      if (!b) break;
      const nm = getZodiacById(b.signId)?.signName ?? "";
      return igAssemble({
        hook: `Bir ${nm} ${b.scenario} ne yapar? 👀`,
        body: [
          `1️⃣ ${b.beats[0]}`,
          `2️⃣ ${b.beats[1]}`,
          `3️⃣ ${b.beats[2]}`,
        ],
        reflection: b.question,
        save: "Kaydet — aklına biri geldi 👀",
        share: `Bir ${nm}'a gönder 😏`,
        comment: `${b.question} Yorumlara yaz`,
        hashtags: tags,
        captionLine,
      });
    }
    case "compat": {
      const c = getCompatibilityById(id);
      if (!c) break;
      const n1 = getZodiacById(c.sign1Id)?.signName ?? "";
      const n2 = getZodiacById(c.sign2Id)?.signName ?? "";
      return igAssemble({
        hook: `${n1} + ${n2} = ? 👀 Sonuç: ${c.verdict}`,
        body: [
          `1️⃣ ${c.beats[0]}`,
          `2️⃣ ${c.beats[1]}`,
          `3️⃣ ${c.beats[2]}`,
        ],
        reflection: c.question,
        save: "Kaydet — birine göstereceksin",
        share: "O kişiyi yorumlarda etiketle 👇",
        comment: `${c.question} Etiketle 😏`,
        hashtags: tags,
        captionLine,
      });
    }
    case "sky": {
      const c = skyCardById(id);
      if (!c) break;
      return igAssemble({
        hook: `${c.hookLine} 🌌`,
        body: [
          c.theme.desc,
          ...c.affected.map((a, i) => `${i + 1}️⃣ ${a.signName}\n${a.line}`),
        ],
        reflection: `💡 ${c.tip}`,
        save: "Kaydet — bu dönemde dön bak",
        share: "Burcu uyan birine gönder",
        comment: "Senin burcun listede mi? Yorumlara yaz",
        hashtags: tags,
        captionLine,
      });
    }
  }
  throw new Error(`IG caption üretilemedi: ${category}/${id}`);
}

// ─── İlk yorum — paylaşımdan hemen sonra otomatik bırakılır (etkileşim) ────
// Cevabı kolay soru → çok yorum gelir. Sabitlemeyi (pin) kullanıcı elle yapar.
export function buildFirstComment(category: string, id: string): string {
  switch (category) {
    case "dream":
      return "Sen bu rüyayı gördün mü? 👀 Detayını yaz — beraber çözelim 🌙";
    case "tarot":
      return 'İçinden bir niyet tut, "çektim" yaz ✨ Kartın bugün sana ne diyor? 👇';
    case "zodiac": {
      const z = getZodiacById(id);
      return `${z ? z.signName + " olan var mı?" : "Sen hangi burçsun?"} 👇 Ne kadar uydu: 🔥 tam ben / 😅 hiç`;
    }
    case "number": {
      const n = getNumberById(id);
      if (n?.kind === "angel") return "Sen sürekli hangi sayıyı görüyorsun? 👀👇";
      return "Senin yaşam yolu sayın kaç? 🔢 Doğum tarihini yaz, hesaplayayım 👇";
    }
    case "manifest":
      return "Şu an neyi manifest ediyorsun? Yorumlara yaz — evren duysun 🌙✨";
    case "ranking": {
      const r = getRankingById(id);
      return `${r ? r.question : "Seninki var mı?"} 👇 Bence sıralama doğru — sence? 🔥`;
    }
    case "behavior": {
      const b = getBehaviorById(id);
      const nm = b ? getZodiacById(b.signId)?.signName ?? "" : "";
      return `${nm ? "Bir " + nm + "'la yaşadın mı?" : "Yaşadın mı?"} 👇 Anlat — herkes okusun 😅`;
    }
    case "compat": {
      const c = getCompatibilityById(id);
      const n1 = c ? getZodiacById(c.sign1Id)?.signName ?? "" : "";
      const n2 = c ? getZodiacById(c.sign2Id)?.signName ?? "" : "";
      return `${n1 && n2 ? n1 + " + " + n2 + " — siz misiniz?" : "Siz uyumlu musunuz?"} 👇 O kişiyi etiketle 😏`;
    }
  }
  if (category === "sky") return "Burcunu yaz 👇 Bu dönem sende neler değişiyor? Hepsini okuyorum 🌌";
  return "Yorumun ne? 👇 Her yoruma bakıyorum 🤍";
}

// ═══════════════════════════════════════════════════════════════════════════
// TIKTOK caption — TikTok-NATIVE (IG'den AYRI kaynak; shadowban-güvenli)
//
// buildInstagramCaption / IG_BRAND / buildMetadata / buildFirstComment'e
// DOKUNMAZ (IG/YT birebir korunur). Kurallar:
//   • bio-link / URL / "indir·link in bio·google play·app store" YOK · #keşfet YOK
//   • 3-5 native niş hashtag: kategori sabit seti + kaydın .hashtag'i.
//     behavior/compat/ranking'de hashtag alanı YOK → o günün burcunun tag'i
//     getZodiacById(signId) ile eklenir (tekrar sinyalini kırar).
//   • line1 = DETERMİNİSTİK ilk satır (category+id → aynı girdi aynı çıktı) —
//     Worker KV dedup anahtarı. RNG yok.
// render-tiktok-demo.ts + .github/workflows/tiktok-demo.yml bu TEK kaynaktan
// meta.json (caption+line1) + caption.txt üretir.
// ═══════════════════════════════════════════════════════════════════════════
export interface TikTokMeta {
  caption: string;
  line1: string; // deterministik dedup anahtarı (= caption ilk satırı)
}

function ttAssemble(
  line1: string,
  teaser: string,
  question: string,
  hashtags: (string | undefined)[],
  captionLine?: string,
): TikTokMeta {
  const oneLine = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();
  // CASE-INSENSITIVE dedup: farklı yazımlı aynı etiket (#meleksayıları vs
  // #melekSayıları) TikTok'ta AYNI tag'e çözülür → tek kez girsin. Normalize:
  // baştaki # at + Türkçe-farkında lowercase. İLK görüneni koru, sırayı bozma.
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const h of hashtags) {
    const t = (h ?? "").trim();
    if (!t) continue;
    const key = t.replace(/^#+/, "").toLocaleLowerCase("tr");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    tags.push(t);
    if (tags.length === 5) break;
  }
  const first = oneLine(line1);
  const caption = [first, captionLine ? oneLine(captionLine) : "", oneLine(teaser), oneLine(question), tags.join(" ")]
    .filter((l) => l.length > 0)
    .join("\n");
  return { caption, line1: first };
}

export function buildTikTokMetadata(category: string, id: string, opts?: MetaOpts): TikTokMeta {
  const T = topicalFor(category, id, opts);
  // TikTok: marka etiketi yok (eski kural), en çok 5 niş etiket; line1 (dedup anahtarı) tarihten BAĞIMSIZ.
  const tags = topicalHashtags(T, TAG_CAP.tiktok, false);
  const asm = (line1: string, teaser: string, question: string): TikTokMeta =>
    ttAssemble(line1, teaser, question, tags, T.captionLine);
  switch (category) {
    case "dream": {
      const s = getSymbolById(id);
      if (s)
        return asm(
          `Rüyada ${s.symbolName} görmek ne demek?`,
          `Çoğu kişi korkar ama bilinçaltın "${s.meanings[0].title}" diyor.`,
          "Seninki nasıldı? 👇",
        );
      break;
    }
    case "tarot": {
      const c = getTarotById(id);
      if (c)
        return asm(
          `Bugünün kartı: ${c.cardName}`,
          `${c.meanings[0].title} enerjisi bugün seninle.`,
          "Sana ne söylüyor sence? 👇",
        );
      break;
    }
    case "number": {
      const n = getNumberById(id);
      if (n && n.kind === "angel")
        return asm(
          `${n.number} sürekli karşına mı çıkıyor?`,
          `Melekler "${n.title}" mesajını fısıldıyor.`,
          "Sen de mi görüyorsun? 👇",
        );
      if (n)
        return asm(
          `Yaşam yolu ${n.number}: ${n.title}`,
          `${n.meanings[0].title} — seni sen yapan şey bu.`,
          "Senin sayın kaç? 👇",
        );
      break;
    }
    case "zodiac": {
      const z = getZodiacById(id);
      if (z)
        return asm(
          `${z.signName} burcunun bugünü`,
          `${z.meanings[0].title}: ${z.meanings[0].desc}`,
          `Sen ${z.signName} musun? 👇`,
        );
      break;
    }
    case "manifest": {
      const m = getManifestById(id);
      if (m)
        return asm(
          `${m.theme} için sabah olumlaması`,
          m.lines[0],
          "Bugün senin niyetin ne? 👇",
        );
      break;
    }
    case "ranking": {
      const r = getRankingById(id);
      if (r) {
        return asm(
          `${r.trait} burçlar`,
          "İlk 3'te seninki var mı, tahmin et.",
          r.question,
        );
      }
      break;
    }
    case "behavior": {
      const b = getBehaviorById(id);
      if (b) {
        const z = getZodiacById(b.signId);
        return asm(
          `Bir ${z?.signName ?? "burç"} ${b.scenario}`,
          b.beats[0],
          b.question,
        );
      }
      break;
    }
    case "compat": {
      const c = getCompatibilityById(id);
      if (c) {
        const z1 = getZodiacById(c.sign1Id);
        const z2 = getZodiacById(c.sign2Id);
        return asm(
          `${z1?.signName ?? "?"} + ${z2?.signName ?? "?"}: ${c.verdict}`,
          c.beats[0],
          c.question,
        );
      }
      break;
    }
    case "sky": {
      const c = skyCardById(id);
      if (c)
        return asm(
          c.hookLine,
          `${c.affected[0].signName}, ${c.affected[1].signName} ve ${c.affected[2].signName} bunu daha çok hissedebilir.`,
          "Senin burcun listede mi? 👇",
        );
      break;
    }
  }
  throw new Error(`TikTok metadata üretilemedi: ${category}/${id}`);
}
