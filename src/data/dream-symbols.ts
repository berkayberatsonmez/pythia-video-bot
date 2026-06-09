// ═══════════════════════════════════════════════════════════════════════════
// Pythia — Rüya Sembolleri Veritabanı
//
// Her sembol için 3 anlam + engagement sorusu + SVG icon tanımı.
// Otomatik render: src/scripts/render-daily.ts
// ═══════════════════════════════════════════════════════════════════════════

export type IconType =
  | "snake"
  | "tooth"
  | "water"
  | "fire"
  | "spider"
  | "falling"
  | "flying"
  | "dead"
  | "key"
  | "eye";

export type DreamSymbol = {
  id: string;
  symbolName: string;       // "yılan" (caption için)
  symbolNameUpper: string;  // "YILAN" (display)
  iconType: IconType;
  meanings: [
    { title: string; desc: string },
    { title: string; desc: string },
    { title: string; desc: string },
  ];
  questionTitle: string;
  questionBody: string;
  questionFooter: string;
  // SEO için
  hashtag: string;          // "#yılan" veya "#diş"
  searchVolume: "high" | "medium" | "low";
};

export const DREAM_SYMBOLS: DreamSymbol[] = [
  // ─── 1. YILAN ────────────────────────────────────────────────────────
  {
    id: "snake",
    symbolName: "yılan",
    symbolNameUpper: "YILAN",
    iconType: "snake",
    meanings: [
      {
        title: "DÖNÜŞÜM",
        desc: "Eski benliğinden ayrılıyorsun.\nYılan kabuğunu değiştirir,\nsen de değişiyorsun.",
      },
      {
        title: "GİZLİ KORKU",
        desc: "Yüzleşmediğin bir şey var.\nBilinçaltın o şeyi sembolize\nediyor — görmek istiyor.",
      },
      {
        title: "ŞİFA",
        desc: "Kadim bilgelik, tıp sembolü.\nİyileşme süreci başladı,\nsabırlı ol.",
      },
    ],
    questionTitle: "PEKİ SENİN YILANIN",
    questionBody: "saldırgan mıydı,\nyoksa sakin mi?",
    questionFooter: "cevap, anlamı tamamen değiştiriyor",
    hashtag: "#yılan",
    searchVolume: "high",
  },

  // ─── 2. DİŞ ──────────────────────────────────────────────────────────
  {
    id: "tooth",
    symbolName: "diş düşmesi",
    symbolNameUpper: "DİŞİN\nDÜŞTÜĞÜNÜ",
    iconType: "tooth",
    meanings: [
      {
        title: "KAYIP / DEĞİŞİM",
        desc: "Hayatında bir dönem kapanıyor.\nKayıp gibi gözüken şey,\naslında bırakman gereken.",
      },
      {
        title: "KONTROL KAYBI",
        desc: "Bilinçaltında bir kaygı var.\nGüç veya kontrolü kaybetme\nkorkusu seninle konuşuyor.",
      },
      {
        title: "YENİLENME",
        desc: "Süt dişi gider, yenisi gelir.\nEski sen kabuk değiştiriyor,\nyeni bir başlangıç yaklaşıyor.",
      },
    ],
    questionTitle: "PEKİ SENİN DİŞİN",
    questionBody: "kanlı mıydı,\nyoksa temiz mi düştü?",
    questionFooter: "cevap, anlamı tamamen değiştiriyor",
    hashtag: "#diş",
    searchVolume: "high",
  },

  // ─── 3. SU ───────────────────────────────────────────────────────────
  {
    id: "water",
    symbolName: "su",
    symbolNameUpper: "SU",
    iconType: "water",
    meanings: [
      {
        title: "DUYGULAR",
        desc: "Su = duyguların aynası.\nNasıl bir su gördüğün,\niçindeki dünyayı yansıtır.",
      },
      {
        title: "ARINMA",
        desc: "Berrak su = içsel temizlik.\nEski yüklerden arınıyorsun,\nşifa süreci akıyor.",
      },
      {
        title: "BILINÇALTI MESAJI",
        desc: "Bulanık su = belirsizlik.\nKafanı karıştıran bir konu var,\nnetleşme zamanı geliyor.",
      },
    ],
    questionTitle: "PEKİ SENİN SUYUN",
    questionBody: "berrak mıydı,\nyoksa bulanık mı?",
    questionFooter: "berraklık her şeyi açıklıyor",
    hashtag: "#su",
    searchVolume: "high",
  },

  // ─── 4. ÖRÜMCEK ─────────────────────────────────────────────────────
  {
    id: "spider",
    symbolName: "örümcek",
    symbolNameUpper: "ÖRÜMCEK",
    iconType: "spider",
    meanings: [
      {
        title: "YARATICILIK",
        desc: "Örümcek ağ örer — yaratıcı bir\nproje veya fikir hayata\ngeçirilmek istiyor.",
      },
      {
        title: "BAĞIMSIZLIK",
        desc: "Birinin manipülasyonundan\nkurtulma vakti. Kendi ağını\nkendin örme zamanı.",
      },
      {
        title: "DİŞİL ENERJİ",
        desc: "Sezgilerin güçleniyor.\nİç sesini dinle —\nsana doğruyu söylüyor.",
      },
    ],
    questionTitle: "PEKİ SENİN ÖRÜMCEK",
    questionBody: "büyük müydü,\nyoksa küçük müydü?",
    questionFooter: "boyut, mesajın gücünü gösterir",
    hashtag: "#örümcek",
    searchVolume: "high",
  },

  // ─── 5. YANGIN ──────────────────────────────────────────────────────
  {
    id: "fire",
    symbolName: "yangın",
    symbolNameUpper: "YANGIN",
    iconType: "fire",
    meanings: [
      {
        title: "TUTKU",
        desc: "İçinde uyanan bir tutku var.\nUzun süre bastırdığın bir arzu,\nartık kontrolden çıkıyor.",
      },
      {
        title: "DÖNÜŞÜM",
        desc: "Eski yapı yıkılıyor.\nYangın temizler — kalıntılardan\nyeni bir şey doğacak.",
      },
      {
        title: "ÖFKE / UYARI",
        desc: "Bastırılmış öfke yüzeye çıkıyor.\nGörmezden geldiğin bir konu\nseni içten yakıyor.",
      },
    ],
    questionTitle: "PEKİ SENİN YANGININ",
    questionBody: "evi mi yaktı,\nyoksa sadece izledin mi?",
    questionFooter: "rolün, sembolün anlamını değiştirir",
    hashtag: "#yangın",
    searchVolume: "medium",
  },

  // ─── 6. DÜŞMEK ──────────────────────────────────────────────────────
  {
    id: "falling",
    symbolName: "düşmek",
    symbolNameUpper: "DÜŞTÜĞÜNÜ",
    iconType: "falling",
    meanings: [
      {
        title: "KONTROL KAYBI",
        desc: "Hayatın bir alanında\nkontrolü kaybediyor gibisin.\nBilinçaltın seni uyarıyor.",
      },
      {
        title: "BAŞARISIZLIK KORKUSU",
        desc: "İçinde bir endişe var.\nÖnemli bir kararın eşiğindesin,\nbaşarısız olmaktan korkuyorsun.",
      },
      {
        title: "BIRAKMA",
        desc: "Tutunduğun şeyi bırakma vakti.\nDüşmek aslında özgürleşmek —\ngüven duyman gereken bir süreç.",
      },
    ],
    questionTitle: "PEKİ SENİN DÜŞÜŞÜN",
    questionBody: "sonsuz muydu,\nyoksa bir yere mi çarptın?",
    questionFooter: "iniş, sonucun ipucusu",
    hashtag: "#düşmek",
    searchVolume: "high",
  },

  // ─── 7. UÇMAK ───────────────────────────────────────────────────────
  {
    id: "flying",
    symbolName: "uçmak",
    symbolNameUpper: "UÇTUĞUNU",
    iconType: "flying",
    meanings: [
      {
        title: "ÖZGÜRLÜK",
        desc: "Bir engelden kurtuluyorsun.\nUzun süre seni baskı altında\ntutan bir şey çözülüyor.",
      },
      {
        title: "İLHAM",
        desc: "Yaratıcı enerji yükseliyor.\nFikirlerin uçuşa geçiyor —\nbir vizyona doğru hareket var.",
      },
      {
        title: "GERÇEKLİKTEN KAÇIŞ",
        desc: "Yüzleşmediğin bir konu var.\nUçmak güzel ama yere\ndönmek de gerekir.",
      },
    ],
    questionTitle: "PEKİ SENİN UÇUŞUN",
    questionBody: "yüksekti mi,\nyoksa alçaktan mı uçuyordun?",
    questionFooter: "yükseklik, kontrolünü gösterir",
    hashtag: "#uçmak",
    searchVolume: "medium",
  },

  // ─── 8. ÖLÜ İNSAN ───────────────────────────────────────────────────
  {
    id: "dead",
    symbolName: "ölü insan",
    symbolNameUpper: "ÖLÜ\nBİRİNİ",
    iconType: "dead",
    meanings: [
      {
        title: "VEDA",
        desc: "Geçmişle gerçekten\nbağını koparma zamanı.\nEski sen artık yaşamıyor.",
      },
      {
        title: "MESAJ",
        desc: "Bilinçaltın o kişiyle\nkonuşmak istiyor —\nçözülmemiş bir bağ var.",
      },
      {
        title: "DÖNÜŞÜM",
        desc: "Sembolik bir ölüm.\nBir döneme ait olan sen\nyok oluyor, yenisi geliyor.",
      },
    ],
    questionTitle: "PEKİ SENİN GÖRDÜĞÜN",
    questionBody: "konuştu mu,\nyoksa sessiz miydi?",
    questionFooter: "ses, mesajın varlığını söyler",
    hashtag: "#ölüinsan",
    searchVolume: "high",
  },

  // ─── 9. ANAHTAR ─────────────────────────────────────────────────────
  {
    id: "key",
    symbolName: "anahtar",
    symbolNameUpper: "ANAHTAR",
    iconType: "key",
    meanings: [
      {
        title: "ÇÖZÜM",
        desc: "Aradığın cevap yakında.\nBir sorunun anahtarı\nseninle paylaşılıyor.",
      },
      {
        title: "YENİ FIRSAT",
        desc: "Kapı açılmak üzere.\nBir başlangıç, bir kapı,\nbir yeni dönem geliyor.",
      },
      {
        title: "GİZLİ BİLGİ",
        desc: "Saklı bir gerçek var.\nBilinçaltın bunu bilmeni\nve harekete geçmeni istiyor.",
      },
    ],
    questionTitle: "PEKİ SENİN ANAHTARIN",
    questionBody: "yeni miydi,\nyoksa eski / paslı mı?",
    questionFooter: "durumu, hangi kapıyı açtığını söyler",
    hashtag: "#anahtar",
    searchVolume: "medium",
  },

  // ─── 10. GÖZ ─────────────────────────────────────────────────────────
  {
    id: "eye",
    symbolName: "göz",
    symbolNameUpper: "GÖZ",
    iconType: "eye",
    meanings: [
      {
        title: "FARKINDALIK",
        desc: "Görmeye başladığın\nbir gerçek var.\nGözlerin yeni açılıyor.",
      },
      {
        title: "İZLENMEK",
        desc: "Hayatında biri seni\nyakından izliyor —\nbu olumlu da olabilir, kötü de.",
      },
      {
        title: "SEZGİ / ÜÇÜNCÜ GÖZ",
        desc: "Sezgilerin keskinleşiyor.\nGörünenin ötesini\ngörmeye başlıyorsun.",
      },
    ],
    questionTitle: "PEKİ SENİN GÖZLER",
    questionBody: "tanıdık mıydı,\nyoksa yabancı mıydı?",
    questionFooter: "tanışıklık, mesajın kaynağını söyler",
    hashtag: "#göz",
    searchVolume: "medium",
  },
];

// ─── Helper: Bugünün sembolünü deterministik seç ────────────────────────
export function getTodaysSymbol(): DreamSymbol {
  // Tarihe göre rotation — her gün farklı sembol, aynı gün hep aynı
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const index = dayOfYear % DREAM_SYMBOLS.length;
  return DREAM_SYMBOLS[index];
}

// ─── Helper: ID ile sembol getir ─────────────────────────────────────────
export function getSymbolById(id: string): DreamSymbol | undefined {
  return DREAM_SYMBOLS.find((s) => s.id === id);
}
