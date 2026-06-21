// ═══════════════════════════════════════════════════════════════════════════
// Pythia — Burç Uyumu / İlişki (en yüksek etkileşim formatı)
//
// Format: "AKREP + BOĞA = ?" → verdict reveal → 3 beat (dinamik) → "siz misiniz?"
// Amaç: insanlar KENDİ + partner/ex burcunu etiketler → yorum + paylaşım patlar.
// sign1Id/sign2Id → zodiac-signs.ts glyph + isim.
// ═══════════════════════════════════════════════════════════════════════════

export type Compatibility = {
  id: string;
  sign1Id: string;
  sign2Id: string;
  verdict: string; // punchy sonuç: "YA HEP YA HİÇ 🔥" / "RUH EŞİ 💫"
  beats: [string, string, string]; // ilişki dinamiği
  question: string;
};

export const ZODIAC_COMPATIBILITY: Compatibility[] = [
  {
    id: "akrep-boga",
    sign1Id: "scorpio",
    sign2Id: "taurus",
    verdict: "YA HEP YA HİÇ 🔥",
    beats: [
      "İkisi de inatçı, ikisi de sahiplenici.",
      "Kıskançlık tavan yapar, kıvılcımlar uçuşur.",
      "Ya ölene kadar severler ya birbirini yer bitirir.",
    ],
    question: "Bu çift tanıdık geldi mi?",
  },
  {
    id: "aslan-akrep",
    sign1Id: "leo",
    sign2Id: "scorpio",
    verdict: "GÜÇ SAVAŞI 👑",
    beats: [
      "İkisi de hükmetmek ister, kimse pes etmez.",
      "Aşkı da kavgası da yüksek voltaj.",
      "Ya imparatorluk kurarlar ya saray yıkılır.",
    ],
    question: "Sence hangisi kazanır?",
  },
  {
    id: "koc-yengec",
    sign1Id: "aries",
    sign2Id: "cancer",
    verdict: "ATEŞ vs SU ⚡",
    beats: [
      "Koç hızlı, Yengeç duygusal — tempolar tutmaz.",
      "Biri savaşmak ister, diğeri küser.",
      "Anlaşırlarsa Koç ısınır, Yengeç cesurlaşır.",
    ],
    question: "Sen hangisisin?",
  },
  {
    id: "terazi-kova",
    sign1Id: "libra",
    sign2Id: "aquarius",
    verdict: "RUH EŞİ 💫",
    beats: [
      "İki hava burcu, zihinleri aynı frekansta.",
      "Konuşmaları hiç bitmez, asla sıkılmazlar.",
      "Sürtünmesiz, akıp giden bir aşk.",
    ],
    question: "En uyumlu çift bu mu?",
  },
  {
    id: "yengec-balik",
    sign1Id: "cancer",
    sign2Id: "pisces",
    verdict: "DERİN AŞK 🌊",
    beats: [
      "İki su burcu, sözsüz anlaşırlar.",
      "Empati o kadar güçlü ki birbirini hisseder.",
      "Masal gibi ama fazla duygusal — boğulabilirler.",
    ],
    question: "Bu kadar uyum gerçek mi?",
  },
  {
    id: "koc-terazi",
    sign1Id: "aries",
    sign2Id: "libra",
    verdict: "ZIT KUTUPLAR 🧲",
    beats: [
      "Karşıt burçlar — biri 'ben', diğeri 'biz' der.",
      "Tam zıtlıkları birbirini deli gibi çeker.",
      "Dengelerlerse mükemmel, dengelemezlerse savaş.",
    ],
    question: "Zıtlıklar çeker mi sence?",
  },
  {
    id: "oglak-yengec",
    sign1Id: "capricorn",
    sign2Id: "cancer",
    verdict: "SAĞLAM YUVA 🏠",
    beats: [
      "Toprak ve su — biri kurar, diğeri besler.",
      "İkisi de sadakat ve güven ister.",
      "Sessiz ama en sağlam birlikteliklerden.",
    ],
    question: "İstikrar mı, tutku mu?",
  },
  {
    id: "ikizler-yay",
    sign1Id: "gemini",
    sign2Id: "sagittarius",
    verdict: "TATLI KAOS ✨",
    beats: [
      "Karşıt burçlar ama ikisi de özgür ruh.",
      "Bir maceradan diğerine koşarlar.",
      "Sıkılmazlar ama biri durmak isterse zorlanır.",
    ],
    question: "Eğlence mi, istikrar mı?",
  },
  {
    id: "aslan-kova",
    sign1Id: "leo",
    sign2Id: "aquarius",
    verdict: "İNATLAŞMA ⚡",
    beats: [
      "Karşıt sabit burçlar — ikisi de inatçı.",
      "Aslan ilgi ister, Kova mesafe sever.",
      "Anlaşırlarsa efsane, anlaşmazlarsa duvar.",
    ],
    question: "Bu çift yürür mü?",
  },
  {
    id: "basak-balik",
    sign1Id: "virgo",
    sign2Id: "pisces",
    verdict: "ZIT AMA TAMAMLAR 🧩",
    beats: [
      "Karşıt burçlar — mantık ve hayal.",
      "Başak düzenler, Balık ilham verir.",
      "Birbirinin eksiğini tam tamamlar.",
    ],
    question: "Tamamlar mı, çarpışır mı?",
  },
  {
    id: "akrep-balik",
    sign1Id: "scorpio",
    sign2Id: "pisces",
    verdict: "MANYETİK 🌑",
    beats: [
      "İki su burcu, derin ve yoğun.",
      "Sezgileri bir anda birbirini bulur.",
      "Tutkulu ama ikisi de fazla hassas.",
    ],
    question: "Bu yoğunluk taşınır mı?",
  },
  {
    id: "boga-oglak",
    sign1Id: "taurus",
    sign2Id: "capricorn",
    verdict: "İMPARATORLUK 👑",
    beats: [
      "İki toprak burcu — istikrar ve hırs.",
      "Birlikte hem servet hem huzur kurarlar.",
      "Tutku biraz düşük ama güven tavan.",
    ],
    question: "Güven mi, heyecan mı?",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
export function getCompatibilityById(id: string): Compatibility | undefined {
  return ZODIAC_COMPATIBILITY.find((c) => c.id === id);
}
