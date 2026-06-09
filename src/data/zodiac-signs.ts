// ═══════════════════════════════════════════════════════════════════════════
// Pythia — Burç Veritabanı (12 burç)
//
// Format: "X BURCUNUN GİZLİ YÜZÜ" → glyph → 3 gizli özellik → soru
// SVG glyph'ler: public/zodiac/*.svg (CSS mask ile altın renge boyanır)
// ═══════════════════════════════════════════════════════════════════════════

export type ZodiacSign = {
  id: string;
  signName: string; // "KOÇ"
  signNameSub: string; // "Aries"
  svgFile: string; // "aries.svg"
  element: string; // "Ateş"
  dateRange: string; // "21 Mart – 19 Nisan"
  meanings: [
    { title: string; desc: string },
    { title: string; desc: string },
    { title: string; desc: string },
  ];
  questionTitle: string;
  questionBody: string;
  questionFooter: string;
  hashtag: string;
};

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: "aries",
    signName: "KOÇ",
    signNameSub: "Aries",
    svgFile: "aries.svg",
    element: "Ateş",
    dateRange: "21 Mart – 19 Nisan",
    meanings: [
      { title: "GİZLİ TARAF", desc: "Cesur görünürsün ama\niçten içe onay ararsın.\nGüçlü duruşun bir kalkan." },
      { title: "GERÇEK SEN", desc: "Sabırsızlığın aslında\nkaybetme korkusundan.\nYumuşak bir kalbin var." },
      { title: "SÜPER GÜCÜN", desc: "Kimsenin gidemediği yere\nilk sen gidersin. Öncülük\nsenin doğanda." },
    ],
    questionTitle: "SEN KOÇ",
    questionBody: "gerçekten korkusuz musun,\nyoksa öyle mi görünüyorsun?",
    questionFooter: "burcun seni lider doğurmuş",
    hashtag: "#koç",
  },
  {
    id: "taurus",
    signName: "BOĞA",
    signNameSub: "Taurus",
    svgFile: "taurus.svg",
    element: "Toprak",
    dateRange: "20 Nisan – 20 Mayıs",
    meanings: [
      { title: "GİZLİ TARAF", desc: "İnatçılığın aslında\ngüvensizlikten. Değişim\nseni korkutuyor." },
      { title: "GERÇEK SEN", desc: "Bir kez sevdin mi sonuna\nkadar sadıksın. Kalbin\naltın gibi sağlam." },
      { title: "SÜPER GÜCÜN", desc: "Sabırla her şeyi inşa\nedersin. Sen yavaş ama\nkesin kazanırsın." },
    ],
    questionTitle: "SEN BOĞA",
    questionBody: "inatçı mısın,\nyoksa sadece kararlı mı?",
    questionFooter: "burcun seni sadık doğurmuş",
    hashtag: "#boğa",
  },
  {
    id: "gemini",
    signName: "İKİZLER",
    signNameSub: "Gemini",
    svgFile: "gemini.svg",
    element: "Hava",
    dateRange: "21 Mayıs – 20 Haziran",
    meanings: [
      { title: "GİZLİ TARAF", desc: "İki yüzlü değilsin,\nçok düşünüyorsun. Zihnin\nhiç durmuyor." },
      { title: "GERÇEK SEN", desc: "Sıkılınca kaçarsın ama\nasıl korktuğun şey\nyalnız kalmak." },
      { title: "SÜPER GÜCÜN", desc: "Herkesle konuşabilir,\nher ortama uyarsın.\nZekan parlıyor." },
    ],
    questionTitle: "SEN İKİZLER",
    questionBody: "kararsız mısın,\nyoksa seçenekleri mi seviyorsun?",
    questionFooter: "burcun seni zeki doğurmuş",
    hashtag: "#ikizler",
  },
  {
    id: "cancer",
    signName: "YENGEÇ",
    signNameSub: "Cancer",
    svgFile: "cancer.svg",
    element: "Su",
    dateRange: "21 Haziran – 22 Temmuz",
    meanings: [
      { title: "GİZLİ TARAF", desc: "Sert kabuğun altında\nçok yumuşak bir öz var.\nKorumak için sertleşirsin." },
      { title: "GERÇEK SEN", desc: "Geçmişe takılırsın.\nEski anılar ve insanlar\nseni hâlâ etkiliyor." },
      { title: "SÜPER GÜCÜN", desc: "Sevdiklerini koşulsuz\nkorursun. Senin evin\nherkes için sığınak." },
    ],
    questionTitle: "SEN YENGEÇ",
    questionBody: "duygusal mısın,\nyoksa derin mi hissediyorsun?",
    questionFooter: "burcun seni koruyucu doğurmuş",
    hashtag: "#yengeç",
  },
  {
    id: "leo",
    signName: "ASLAN",
    signNameSub: "Leo",
    svgFile: "leo.svg",
    element: "Ateş",
    dateRange: "23 Temmuz – 22 Ağustos",
    meanings: [
      { title: "GİZLİ TARAF", desc: "Gururun ardında\nkırılgan bir kalp var.\nReddedilmekten korkarsın." },
      { title: "GERÇEK SEN", desc: "Sevgiye açsın. Görülmek,\ntakdir edilmek senin\niçin oksijen gibi." },
      { title: "SÜPER GÜCÜN", desc: "Girdiğin yeri aydınlatırsın.\nCömertliğin ve sıcaklığın\nherkesi çeker." },
    ],
    questionTitle: "SEN ASLAN",
    questionBody: "gururlu musun,\nyoksa sevgi mi arıyorsun?",
    questionFooter: "burcun seni parlak doğurmuş",
    hashtag: "#aslan",
  },
  {
    id: "virgo",
    signName: "BAŞAK",
    signNameSub: "Virgo",
    svgFile: "virgo.svg",
    element: "Toprak",
    dateRange: "23 Ağustos – 22 Eylül",
    meanings: [
      { title: "GİZLİ TARAF", desc: "Eleştirin aslında\nsevgiden. İyi olsun diye\ntakılıyorsun detaylara." },
      { title: "GERÇEK SEN", desc: "Mükemmeliyetçiliğin\nkaygıdan besleniyor.\nHata yapmaktan korkarsın." },
      { title: "SÜPER GÜCÜN", desc: "Kimsenin göremediğini\ngörür, herkese yardım\nedersin. Sessiz kahramansın." },
    ],
    questionTitle: "SEN BAŞAK",
    questionBody: "eleştirel misin,\nyoksa sadece önemsiyor musun?",
    questionFooter: "burcun seni yardımsever doğurmuş",
    hashtag: "#başak",
  },
  {
    id: "libra",
    signName: "TERAZİ",
    signNameSub: "Libra",
    svgFile: "libra.svg",
    element: "Hava",
    dateRange: "23 Eylül – 22 Ekim",
    meanings: [
      { title: "GİZLİ TARAF", desc: "Kararsızlığın herkesi\nmemnun etme isteğinden.\nKimseyi kırmak istemezsin." },
      { title: "GERÇEK SEN", desc: "Çatışmadan kaçarsın ama\niçinde güçlü bir adalet\nduygusu yanar." },
      { title: "SÜPER GÜCÜN", desc: "Her ortamı dengeler,\nuyum yaratırsın. Güzellik\nve barış senin işin." },
    ],
    questionTitle: "SEN TERAZİ",
    questionBody: "kararsız mısın,\nyoksa adil mi olmak istiyorsun?",
    questionFooter: "burcun seni dengeli doğurmuş",
    hashtag: "#terazi",
  },
  {
    id: "scorpio",
    signName: "AKREP",
    signNameSub: "Scorpio",
    svgFile: "scorpio.svg",
    element: "Su",
    dateRange: "23 Ekim – 21 Kasım",
    meanings: [
      { title: "GİZLİ TARAF", desc: "Soğuk değilsin, derinsin.\nHerkese kalbini açmazsın\nçünkü çok hissedersin." },
      { title: "GERÇEK SEN", desc: "Güvenin zor kazanılır,\nbir kez kırılırsa da\nzor geri gelir." },
      { title: "SÜPER GÜCÜN", desc: "Tutkun ve sezgin\nolağanüstü. İnsanların\niçini okuyabilirsin." },
    ],
    questionTitle: "SEN AKREP",
    questionBody: "gizemli misin,\nyoksa sadece korunuyor musun?",
    questionFooter: "burcun seni tutkulu doğurmuş",
    hashtag: "#akrep",
  },
  {
    id: "sagittarius",
    signName: "YAY",
    signNameSub: "Sagittarius",
    svgFile: "sagittarius.svg",
    element: "Ateş",
    dateRange: "22 Kasım – 21 Aralık",
    meanings: [
      { title: "GİZLİ TARAF", desc: "Özgürlük tutkun bir\nkaçış değil, ruhunun\nnefes alma şekli." },
      { title: "GERÇEK SEN", desc: "Dürüstlüğün bazen\nacıtır ama asla\nkötü niyetli değilsin." },
      { title: "SÜPER GÜCÜN", desc: "İyimserliğin bulaşıcı.\nEn karanlık anda bile\numudu sen taşırsın." },
    ],
    questionTitle: "SEN YAY",
    questionBody: "kaçıyor musun,\nyoksa keşfetmeyi mi seviyorsun?",
    questionFooter: "burcun seni özgür doğurmuş",
    hashtag: "#yay",
  },
  {
    id: "capricorn",
    signName: "OĞLAK",
    signNameSub: "Capricorn",
    svgFile: "capricorn.svg",
    element: "Toprak",
    dateRange: "22 Aralık – 19 Ocak",
    meanings: [
      { title: "GİZLİ TARAF", desc: "Soğuk görünürsün ama\niçinde çok yumuşak\nbir taraf saklı." },
      { title: "GERÇEK SEN", desc: "Başarı hırsın aslında\nsevgi ve güven arayışı.\nDeğerli hissetmek istersin." },
      { title: "SÜPER GÜCÜN", desc: "Disiplinin ve azmin\ndağları yerinden oynatır.\nSen hedefe mutlaka varırsın." },
    ],
    questionTitle: "SEN OĞLAK",
    questionBody: "soğuk musun,\nyoksa sadece temkinli mi?",
    questionFooter: "burcun seni dirayetli doğurmuş",
    hashtag: "#oğlak",
  },
  {
    id: "aquarius",
    signName: "KOVA",
    signNameSub: "Aquarius",
    svgFile: "aquarius.svg",
    element: "Hava",
    dateRange: "20 Ocak – 18 Şubat",
    meanings: [
      { title: "GİZLİ TARAF", desc: "Mesafeli görünürsün ama\niçinde derin duygular var.\nSadece göstermeyi bilmezsin." },
      { title: "GERÇEK SEN", desc: "Farklı olmak bazen\nyalnızlık getirir. Yine de\nkendin olmaktan vazgeçmezsin." },
      { title: "SÜPER GÜCÜN", desc: "Geleceği görürsün.\nFikirlerin çağının\nönünde, bir öncüsün." },
    ],
    questionTitle: "SEN KOVA",
    questionBody: "mesafeli misin,\nyoksa sadece farklı mı?",
    questionFooter: "burcun seni özgün doğurmuş",
    hashtag: "#kova",
  },
  {
    id: "pisces",
    signName: "BALIK",
    signNameSub: "Pisces",
    svgFile: "pisces.svg",
    element: "Su",
    dateRange: "19 Şubat – 20 Mart",
    meanings: [
      { title: "GİZLİ TARAF", desc: "Hayallere kaçışın\naslında dünyanın sertliğine\nkarşı bir korunma." },
      { title: "GERÇEK SEN", desc: "Empatin o kadar güçlü ki\nbaşkalarının acısını\nkendi acın gibi hissedersin." },
      { title: "SÜPER GÜCÜN", desc: "Sezgin ve hayal gücün\nsınırsız. Ruhun sanatçı,\nkalbin şifacı." },
    ],
    questionTitle: "SEN BALIK",
    questionBody: "hayalperest misin,\nyoksa derin mi hissediyorsun?",
    questionFooter: "burcun seni şifacı doğurmuş",
    hashtag: "#balık",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
export function getZodiacById(id: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((z) => z.id === id);
}

export function getTodaysZodiac(): ZodiacSign {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return ZODIAC_SIGNS[dayOfYear % ZODIAC_SIGNS.length];
}
