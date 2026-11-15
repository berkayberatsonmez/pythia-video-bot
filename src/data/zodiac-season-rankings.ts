// ═══════════════════════════════════════════════════════════════════════════
// Pythia — Burç SEZONU sıralamaları ("Akrep sezonunda parlayan 3 burç")
//
// Gündem içeriği (scripts/gundem.ts): Güneş bir burca girdiğinde o sezonun
// sıralaması öne alınır. Normal rotasyonda YOK — POOLS.ranking.ids'e girmez,
// yalnız kendi sezonunun ilk günlerinde gündem seçimiyle yayınlanır.
//
// ŞABLON + elle yazılmış tablo (LLM yok): her sezon için tek kelimelik tema ve
// kısa tema cümlesi. Sıralama geleneksel astrolojinin element üçlüsünden:
//   1. sezonun kendi burcu, 2. ve 3. aynı elementten diğer iki burç.
// Ton: eğlence, "-abilir" kalıbı; kesin kehanet / sağlık / para iddiası yok.
// Biçim zodiac-rankings.ts'teki Ranking ile aynı → RankingVideo, metadata,
// narration ve topical hiçbir değişiklik olmadan çalışır (getRankingById).
// ═══════════════════════════════════════════════════════════════════════════

import type { Ranking } from "./zodiac-rankings";

/** 0 Koç … 11 Balık — sky-copy.ts SIGN_IDS ile aynı sıra. */
const SIGN_IDS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];
const SIGN_NAMES = [
  "Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak",
  "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık",
];
/** id'de Türkçe karaktersiz ad (behavior/compat id'leriyle aynı yazım). */
const SIGN_SLUGS = [
  "koc", "boga", "ikizler", "yengec", "aslan", "basak",
  "terazi", "akrep", "yay", "oglak", "kova", "balik",
];
const ELEMENT = ["ateş", "toprak", "hava", "su"] as const; // i % 4

/** Elle yazılmış sezon temaları (geleneksel ilişkilendirme). */
const SEASON: { word: string; theme: string }[] = [
  { word: "cesaret", theme: "cesaret ve başlangıç" },
  { word: "huzur", theme: "huzur ve keyif" },
  { word: "merak", theme: "merak ve iletişim" },
  { word: "şefkat", theme: "yuva ve duygular" },
  { word: "özgüven", theme: "özgüven ve sahne" },
  { word: "düzen", theme: "düzen ve detay" },
  { word: "denge", theme: "denge ve ilişkiler" },
  { word: "tutku", theme: "derinlik ve tutku" },
  { word: "macera", theme: "macera ve özgürlük" },
  { word: "disiplin", theme: "hedef ve disiplin" },
  { word: "özgünlük", theme: "özgünlük ve arkadaşlık" },
  { word: "sezgi", theme: "sezgi ve hayal" },
];

export const seasonRankingId = (sign: number): string => `sezon-${SIGN_SLUGS[sign]}`;

function build(sign: number): Ranking {
  const name = SIGN_NAMES[sign];
  const { word, theme } = SEASON[sign];
  const trineA = (sign + 4) % 12; // zodyak sırasında sonraki aynı element
  const trineB = (sign + 8) % 12;
  return {
    id: seasonRankingId(sign),
    trait: `${name} sezonunda parlayan`,
    ranks: [
      { signId: SIGN_IDS[trineB], blurb: `Bu sezonun ${word} enerjisi ona iyi gelebilir.` },
      { signId: SIGN_IDS[trineA], blurb: `Aynı ${ELEMENT[sign % 4]} elementi: ${word} ona kolay gelir.` },
      { signId: SIGN_IDS[sign], blurb: `Sezon onun: ${theme} ayı başladı.` },
    ],
    question: `Sen ${name} sezonunu nasıl hissediyorsun?`,
  };
}

export const SEASON_RANKINGS: Ranking[] = SIGN_IDS.map((_, i) => build(i));
