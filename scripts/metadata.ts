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
function dreamMeta(id: string): VideoMeta | null {
  const s = getSymbolById(id);
  if (!s) return null;
  const upper = s.symbolNameUpper.replace(/\n/g, " ");
  const title = clampTitle(
    `Rüyanda ${upper} Gördüysen 🌙 Bilinçaltın Bu 3 Şeyi Söylüyor #Shorts`,
  );
  const desc = [
    `Rüyanda ${s.symbolName} gördüysen bilinçaltın bunu söylüyor 🌙`,
    "",
    ...s.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${s.questionBody.replace(/\n/g, " ")} ${s.questionFooter}`,
    "",
    "Seninki nasıldı? 👇 Yorumlara yaz, beraber yorumlayalım 🌙",
    ...PYTHIA_CTA,
    `#rüyatabiri #rüya ${s.hashtag} #rüyayorumu #bilinçaltı #mistik #dream #Shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
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
      "Shorts",
    ]),
  };
}

// ─── TAROT ───────────────────────────────────────────────────────────────
function tarotMeta(id: string): VideoMeta | null {
  const c = getTarotById(id);
  if (!c) return null;
  const title = clampTitle(
    `Bugün Senin Kartın: ${c.cardName} 🔮 Evren Sana Bunu Söylüyor #Shorts`,
  );
  const desc = [
    `Bugün senin tarot kartın: ${c.cardName} (${c.cardNameSub}) 🔮`,
    `Enerji: ${c.energy}`,
    "",
    ...c.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${c.questionBody.replace(/\n/g, " ")} ${c.questionFooter}`,
    "",
    "Sen bugün hangi kartı çekiyorsun? 👇 Yorumlara yaz 🔮",
    ...PYTHIA_CTA,
    `#tarot #tarotfalı #günlüktarot #fal #mistik #tarotreading #Shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
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
      "Shorts",
    ]),
  };
}

// ─── NUMBER (lifepath + angel) ───────────────────────────────────────────
function numberMeta(id: string): VideoMeta | null {
  const n = getNumberById(id);
  if (!n) return null;

  if (n.kind === "lifepath") {
    const title = clampTitle(
      `Yaşam Yolu ${n.number} İsen 🔢 ${n.title} Olduğunu Biliyor muydun? #Shorts`,
    );
    const desc = [
      `Yaşam yolu sayın ${n.number} ise, sen bir ${n.title.toLowerCase()}sın 🔢`,
      "",
      ...n.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
      "",
      `${n.questionBody.replace(/\n/g, " ")} ${n.questionFooter}`,
      "",
      "Senin yaşam yolu sayın kaç? 👇 Yorumlara yaz 🔢",
      ...PYTHIA_CTA,
      `#numeroloji #yaşamyolu #numeroloji${n.number} #mistik #numerology #Shorts`,
      "",
      DISCLAIMER,
    ].join("\n");
    return {
      title,
      description: desc,
      tags: clampTags([
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
        "Shorts",
      ]),
    };
  }

  // angel
  const title = clampTitle(
    `Sürekli ${n.number} Görüyorsan 👁️ Melekler Sana Bunu Söylüyor #Shorts`,
  );
  const desc = [
    `Sürekli ${n.number} görüyorsan bu tesadüf değil — ${n.title} ✨`,
    "",
    ...n.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${n.questionBody.replace(/\n/g, " ")} ${n.questionFooter}`,
    "",
    "Sen hangi sayıyı sürekli görüyorsun? 👇 Yorumlara yaz ✨",
    ...PYTHIA_CTA,
    `#melekSayıları #melekSayısı${n.number} #manifest #mistik #angelnumbers #Shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
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
      "Shorts",
    ]),
  };
}

// ─── ZODIAC ──────────────────────────────────────────────────────────────
function zodiacMeta(id: string): VideoMeta | null {
  const z = getZodiacById(id);
  if (!z) return null;
  const subLower = z.signNameSub.toLowerCase();
  const title = clampTitle(
    `${z.signName} Burcuysan 🔮 Kimsenin Bilmediği 3 Gizli Özelliğin #Shorts`,
  );
  const desc = [
    `${z.signName} (${z.signNameSub}) burcunun kimsenin bilmediği gizli yüzü 🔮`,
    `Element: ${z.element} · ${z.dateRange}`,
    "",
    ...z.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${z.questionBody.replace(/\n/g, " ")} ${z.questionFooter}`,
    "",
    `${z.signName} olan var mı? 👇 Yorumlara yaz, etiketle 🔮`,
    ...PYTHIA_CTA,
    `#burç ${z.hashtag} #astroloji #burçyorumu #${subLower} #zodiac #astrology #Shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
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
function manifestMeta(id: string): VideoMeta | null {
  const m = getManifestById(id);
  if (!m) return null;
  const title = clampTitle(
    `${m.theme} İçin Günlük Manifesto 🌙 Yüksek Sesle Oku #Shorts`,
  );
  const desc = [
    `${m.prompt.toLowerCase()} — ${m.theme} manifestosu 🌙`,
    "",
    ...m.lines.map((l) => `✨ ${l}`),
    "",
    "Yüksek sesle söyle, niyetini gerçeğe çağır.",
    "Pythia sana niyetine özel manifesto yazar.",
    "",
    "Sen neyi manifest ediyorsun? 👇 Yorumlara yaz 🌙",
    ...PYTHIA_CTA,
    `#manifesto #olumlama #manifest #çekimyasası #affirmations #Shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
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
      "Shorts",
    ]),
  };
}

// ─── Dispatcher ──────────────────────────────────────────────────────────
export function buildMetadata(category: string, id: string): VideoMeta {
  let meta: VideoMeta | null = null;
  switch (category) {
    case "dream":
      meta = dreamMeta(id);
      break;
    case "tarot":
      meta = tarotMeta(id);
      break;
    case "number":
      meta = numberMeta(id);
      break;
    case "zodiac":
      meta = zodiacMeta(id);
      break;
    case "manifest":
      meta = manifestMeta(id);
      break;
  }
  if (!meta) {
    throw new Error(`Metadata üretilemedi: ${category}/${id}`);
  }
  return meta;
}
