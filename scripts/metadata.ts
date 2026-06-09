// ═══════════════════════════════════════════════════════════════════════════
// metadata.ts — Kategori-bilinçli YouTube metadata üretici
//
// buildMetadata(category, id) → { title, description, tags }
// 6 kategori: dream, tarot, number(lifepath/angel), zodiac, manifest
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

// ─── DREAM ───────────────────────────────────────────────────────────────
function dreamMeta(id: string): VideoMeta | null {
  const s = getSymbolById(id);
  if (!s) return null;
  const upper = s.symbolNameUpper.replace("\n", " ");
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
    "Senin nasıldı? Yorumlara yaz 🌙",
    ...PYTHIA_CTA,
    `#rüyatabiri #rüya ${s.hashtag} #mistik #bilinçaltı #Shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: ["rüyatabiri", "rüya", s.symbolName, "mistik", "bilinçaltı", "Shorts"],
  };
}

// ─── TAROT ───────────────────────────────────────────────────────────────
function tarotMeta(id: string): VideoMeta | null {
  const c = getTarotById(id);
  if (!c) return null;
  const title = clampTitle(
    `Bugün Senin Kartın: ${c.cardName} 🔮 ${c.energy} #Shorts`,
  );
  const desc = [
    `Bugün senin tarot kartın: ${c.cardName} (${c.cardNameSub}) 🔮`,
    `Enerji: ${c.energy}`,
    "",
    ...c.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${c.questionBody.replace(/\n/g, " ")} ${c.questionFooter}`,
    "",
    "Sen hangi kartı çekiyorsun? Yorumlara yaz 🔮",
    ...PYTHIA_CTA,
    `#tarot #tarotfalı #günlüktarot #mistik #fal #Shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: ["tarot", "tarotfalı", "günlük tarot", "mistik", "fal", "Shorts"],
  };
}

// ─── NUMBER (lifepath + angel) ───────────────────────────────────────────
function numberMeta(id: string): VideoMeta | null {
  const n = getNumberById(id);
  if (!n) return null;

  if (n.kind === "lifepath") {
    const title = clampTitle(
      `Yaşam Yolu ${n.number} İsen ${n.title} 🔢 Numerolojinin Sırrı #Shorts`,
    );
    const desc = [
      `Yaşam yolu sayın ${n.number} ise, sen bir ${n.title.toLowerCase()}sın 🔢`,
      "",
      ...n.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
      "",
      `${n.questionBody.replace(/\n/g, " ")} ${n.questionFooter}`,
      "",
      "Senin yaşam yolu sayın kaç? Yorumlara yaz 🔢",
      ...PYTHIA_CTA,
      `#numeroloji #yaşamyolu #mistik #astroloji #Shorts`,
      "",
      DISCLAIMER,
    ].join("\n");
    return {
      title,
      description: desc,
      tags: ["numeroloji", "yaşam yolu", "mistik", "astroloji", "Shorts"],
    };
  }

  // angel
  const title = clampTitle(
    `Sürekli ${n.number} Görüyorsan 👁️ Melekler Bunu Söylüyor #Shorts`,
  );
  const desc = [
    `Sürekli ${n.number} görüyorsan bu tesadüf değil — ${n.title} ✨`,
    "",
    ...n.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${n.questionBody.replace(/\n/g, " ")} ${n.questionFooter}`,
    "",
    "Sen hangi sayıyı görüyorsun? Yorumlara yaz ✨",
    ...PYTHIA_CTA,
    `#melekSayıları #${n.number} #manifest #mistik #Shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: ["melek sayıları", n.number, "manifest", "mistik", "Shorts"],
  };
}

// ─── ZODIAC ──────────────────────────────────────────────────────────────
function zodiacMeta(id: string): VideoMeta | null {
  const z = getZodiacById(id);
  if (!z) return null;
  const title = clampTitle(
    `${z.signName} Burcunun Gizli Yüzü ⭐ ${z.element} #Shorts`,
  );
  const desc = [
    `${z.signName} (${z.signNameSub}) burcunun kimsenin bilmediği gizli yüzü ⭐`,
    `Element: ${z.element} · ${z.dateRange}`,
    "",
    ...z.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${z.questionBody.replace(/\n/g, " ")} ${z.questionFooter}`,
    "",
    `${z.signName} olanlar yorumlara! ⭐`,
    ...PYTHIA_CTA,
    `#burç ${z.hashtag} #astroloji #mistik #Shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: ["burç", z.signName, "astroloji", "mistik", "Shorts"],
  };
}

// ─── MANIFESTO ───────────────────────────────────────────────────────────
function manifestMeta(id: string): VideoMeta | null {
  const m = getManifestById(id);
  if (!m) return null;
  const title = clampTitle(
    `${m.theme} Manifestosu 🌙 Her Gün Oku, Gerçeğe Çağır #Shorts`,
  );
  const desc = [
    `${m.prompt.toLowerCase()} — ${m.theme} manifestosu 🌙`,
    "",
    ...m.lines.map((l) => `✨ ${l}`),
    "",
    "Yüksek sesle söyle, niyetini gerçeğe çağır.",
    "Pythia sana niyetine özel manifesto yazar.",
    ...PYTHIA_CTA,
    `#manifesto #olumlama #manifest #mistik #Shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: ["manifesto", "olumlama", "manifest", "mistik", "Shorts"],
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
