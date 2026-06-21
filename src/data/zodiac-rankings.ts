// ═══════════════════════════════════════════════════════════════════════════
// Pythia — Burç Sıralamaları (viral "Top-3" formatı)
//
// Format: "EN ÇOK X YAPAN 3 BURÇ — Seninki var mı?" → geri sayım 3→2→1
// Amaç: merak + paylaşım (soğuk kitleyi bile çeker). ranks = [3., 2., 1.]
// (1. en sona saklanır = max merak). signId → zodiac-signs.ts glyph/isim.
// ═══════════════════════════════════════════════════════════════════════════

export type RankItem = { signId: string; blurb: string };

export type Ranking = {
  id: string;
  trait: string; // "En çok yalan söyleyen" — hook/caption bundan üretilir
  ranks: [RankItem, RankItem, RankItem]; // [3. sıra, 2. sıra, 1. sıra]
  question: string; // kapanış etkileşim sorusu
};

export const ZODIAC_RANKINGS: Ranking[] = [
  {
    id: "yalanci",
    trait: "En çok yalan söyleyen",
    ranks: [
      { signId: "libra", blurb: "Kırmamak için söyler, ona göre bu kibarlık." },
      { signId: "gemini", blurb: "O kadar hızlı uydurur ki yakalayamazsın." },
      { signId: "pisces", blurb: "Kendi yalanına kendi inanır, tehlikeli olan bu." },
    ],
    question: "Seninki listede mi?",
  },
  {
    id: "affetmeyen",
    trait: "Asla affetmeyen",
    ranks: [
      { signId: "taurus", blurb: "Affetmiş gibi yapar ama asla unutmaz." },
      { signId: "capricorn", blurb: "Seni sessizce hayatından siler, geri dönüş yok." },
      { signId: "scorpio", blurb: "Affetmez, unutmaz, gününü bekler." },
    ],
    question: "Sen affeder misin?",
  },
  {
    id: "kiskanc",
    trait: "En kıskanç",
    ranks: [
      { signId: "leo", blurb: "İlgi başkasına gidince yıkılır ama belli etmez." },
      { signId: "taurus", blurb: "Sahiplenir, 'benim' dediğine kimse dokunamaz." },
      { signId: "scorpio", blurb: "Telefonunu bile ezbere bilir, kaçış yok." },
    ],
    question: "Sen kıskanç mısın?",
  },
  {
    id: "sadik",
    trait: "En sadık",
    ranks: [
      { signId: "leo", blurb: "Sevdiyse arkanda dağ gibi durur." },
      { signId: "cancer", blurb: "Bir kez bağlandı mı ömür boyu yanındadır." },
      { signId: "taurus", blurb: "Sadakat onun için pazarlık konusu değil." },
    ],
    question: "En sadık burç sence kim?",
  },
  {
    id: "kalp-kiran",
    trait: "En çok kalp kıran",
    ranks: [
      { signId: "sagittarius", blurb: "Özgürlüğü seçer, arkasına bakmadan gider." },
      { signId: "gemini", blurb: "Bugün aşık, yarın yok — kafası sürekli değişir." },
      { signId: "aries", blurb: "İster, alır, sıkılır, gider. Hızlı ve acımasız." },
    ],
    question: "Kim senin kalbini kırdı?",
  },
  {
    id: "inatci",
    trait: "En inatçı",
    ranks: [
      { signId: "aries", blurb: "Haksız olsa bile geri adım atmaz." },
      { signId: "scorpio", blurb: "Bir kez karar verdi mi dünya yıkılsa değişmez." },
      { signId: "taurus", blurb: "İnatta dünya rekoru onda, ikna etmeye kalkma." },
    ],
    question: "Seninki ne kadar inatçı?",
  },
  {
    id: "romantik",
    trait: "En romantik",
    ranks: [
      { signId: "cancer", blurb: "Sevgisini küçük dokunuşlarla gösterir." },
      { signId: "libra", blurb: "İlişkiyi masal gibi yaşar, detaycıdır." },
      { signId: "pisces", blurb: "Filmlerdeki aşkı gerçekten yaşamak ister." },
    ],
    question: "En romantik burç kim sence?",
  },
  {
    id: "zeki",
    trait: "En zeki",
    ranks: [
      { signId: "aquarius", blurb: "Kimsenin görmediği çözümü o bulur." },
      { signId: "scorpio", blurb: "Sezgi + zeka = içini bir bakışta okur." },
      { signId: "gemini", blurb: "Zihni o kadar hızlı ki konuşurken seni geçer." },
    ],
    question: "Sence en zeki burç hangisi?",
  },
  {
    id: "karizma",
    trait: "En karizmatik",
    ranks: [
      { signId: "libra", blurb: "Zarafetiyle girdiği yeri büyüler." },
      { signId: "scorpio", blurb: "Gizemi insanı kendine çeker, gözünü alamazsın." },
      { signId: "leo", blurb: "İçeri girdiği an tüm gözler ona döner." },
    ],
    question: "Kim odaya girince herkes susar?",
  },
  {
    id: "tehlikeli-eski",
    trait: "Eski sevgili olarak en tehlikeli",
    ranks: [
      { signId: "aries", blurb: "Bitince düşman olur, ortada bırakmaz." },
      { signId: "capricorn", blurb: "Soğukkanlı intikamını sessizce planlar." },
      { signId: "scorpio", blurb: "Asla affetmez, en uygun anı bekler." },
    ],
    question: "En tehlikeli ex hangi burç?",
  },
  {
    id: "para",
    trait: "Parayı en iyi yöneten",
    ranks: [
      { signId: "virgo", blurb: "Her kuruşun hesabını yapar, şaşmaz." },
      { signId: "taurus", blurb: "Hem kazanmayı hem biriktirmeyi bilir." },
      { signId: "capricorn", blurb: "Bugünü değil, 10 yıl sonrasını planlar." },
    ],
    question: "Senin paran elinde durur mu?",
  },
  {
    id: "cesur",
    trait: "En cesur",
    ranks: [
      { signId: "leo", blurb: "Sahne kimin umrunda, o zaten hazır." },
      { signId: "scorpio", blurb: "Korkar ama yine de üstüne gider." },
      { signId: "aries", blurb: "Düşünmeden atlar, korku onun sözlüğünde yok." },
    ],
    question: "Sen ne kadar cesursun?",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
export function getRankingById(id: string): Ranking | undefined {
  return ZODIAC_RANKINGS.find((r) => r.id === id);
}
