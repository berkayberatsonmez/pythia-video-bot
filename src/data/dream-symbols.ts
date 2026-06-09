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
  | "eye"
  | "baby"
  | "broken-heart"
  | "dog"
  | "cat"
  | "blood"
  | "money"
  | "wedding"
  | "car"
  | "house"
  | "hair"
  | "lost"
  | "crying";

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

  // ─── 11. BEBEK ───────────────────────────────────────────────────────
  {
    id: "baby",
    symbolName: "bebek",
    symbolNameUpper: "BEBEK",
    iconType: "baby",
    meanings: [
      { title: "YENİ BAŞLANGIÇ", desc: "Hayatında yeni bir şey\ndoğuyor. Bir proje, fikir\nya da dönem filizleniyor." },
      { title: "MASUMİYET", desc: "İçindeki saf, korunmasız\nyana dokunuyorsun.\nKendine nazik ol." },
      { title: "SORUMLULUK", desc: "Bakım isteyen bir şey var.\nBir ilişki ya da hedef\nilgini bekliyor." },
    ],
    questionTitle: "PEKİ SENİN BEBEĞİN",
    questionBody: "gülüyor muydu,\nyoksa ağlıyor mu?",
    questionFooter: "hali, başlangıcın enerjisini söyler",
    hashtag: "#bebek",
    searchVolume: "high",
  },

  // ─── 12. ESKİ SEVGİLİ ────────────────────────────────────────────────
  {
    id: "ex",
    symbolName: "eski sevgili",
    symbolNameUpper: "ESKİ\nSEVGİLİYİ",
    iconType: "broken-heart",
    meanings: [
      { title: "ÇÖZÜLMEMİŞ", desc: "Kapanmamış bir defter var.\nBilinçaltın hâlâ o bağı\nişliyor olabilir." },
      { title: "DERS", desc: "O kişi değil, sana\nöğrettiği şey önemli.\nDersi al, ileriye bak." },
      { title: "YENİ DÖNGÜ", desc: "Aslında bu bir veda.\nEski sen gidiyor, yeni\naşka yer açılıyor." },
    ],
    questionTitle: "RÜYANDA O",
    questionBody: "sana iyi mi davrandı,\nyoksa kötü mü?",
    questionFooter: "tavrı, içindeki duyguyu yansıtır",
    hashtag: "#eskisevgili",
    searchVolume: "high",
  },

  // ─── 13. KÖPEK ───────────────────────────────────────────────────────
  {
    id: "dog",
    symbolName: "köpek",
    symbolNameUpper: "KÖPEK",
    iconType: "dog",
    meanings: [
      { title: "SADAKAT", desc: "Hayatında sadık bir\ndostluk var ya da onu\narıyorsun." },
      { title: "KORUMA", desc: "İçgüdülerin seni koruyor.\nBir tehlikeyi sezdin,\ndinle onu." },
      { title: "DOSTLUK", desc: "Gerçek bir dosta\nihtiyacın var. Yalnız\ndeğilsin, etrafına bak." },
    ],
    questionTitle: "PEKİ SENİN KÖPEĞİN",
    questionBody: "dost canlısı mıydı,\nyoksa saldırgan mı?",
    questionFooter: "tavrı, ilişkilerini yansıtır",
    hashtag: "#köpek",
    searchVolume: "high",
  },

  // ─── 14. KEDİ ────────────────────────────────────────────────────────
  {
    id: "cat",
    symbolName: "kedi",
    symbolNameUpper: "KEDİ",
    iconType: "cat",
    meanings: [
      { title: "BAĞIMSIZLIK", desc: "Özgür ruhun konuşuyor.\nKimseye bağımlı olmadan\nayakta durmak istiyorsun." },
      { title: "SEZGİ", desc: "Dişil enerjin ve sezgilerin\nçok güçlü. Görünmeyeni\nseziyorsun." },
      { title: "GİZEM", desc: "Hayatında saklı bir şey var.\nBir sır ya da gizli\nbir taraf açığa çıkıyor." },
    ],
    questionTitle: "PEKİ SENİN KEDİN",
    questionBody: "sana yakın mıydı,\nyoksa uzak mı durdu?",
    questionFooter: "mesafesi, sezgine işaret eder",
    hashtag: "#kedi",
    searchVolume: "high",
  },

  // ─── 15. KAN ─────────────────────────────────────────────────────────
  {
    id: "blood",
    symbolName: "kan",
    symbolNameUpper: "KAN",
    iconType: "blood",
    meanings: [
      { title: "YAŞAM ENERJİSİ", desc: "Kan = can. Bir tutku,\nbir canlılık ya da\nkaybedilen enerji." },
      { title: "AİLE BAĞI", desc: "Kan bağı — aile konuları\ngündemde. Bir akraba\nya da kök meselesi." },
      { title: "KAYIP/FEDAKARLIK", desc: "Bir şeyden vazgeçiyorsun.\nVerdiğin emek, ödediğin\nbedel sembolize ediliyor." },
    ],
    questionTitle: "RÜYANDAKİ KAN",
    questionBody: "senin miydi,\nyoksa başkasının mı?",
    questionFooter: "kaynağı, konunun yönünü gösterir",
    hashtag: "#kan",
    searchVolume: "high",
  },

  // ─── 16. PARA ────────────────────────────────────────────────────────
  {
    id: "money",
    symbolName: "para",
    symbolNameUpper: "PARA",
    iconType: "money",
    meanings: [
      { title: "ÖZ DEĞER", desc: "Para çoğu zaman öz değeri\nsembolize eder. Kendine\nbiçtiğin değeri sorgula." },
      { title: "FIRSAT", desc: "Bir fırsat ya da bolluk\nyaklaşıyor. Gözünü aç,\nkapıyı kaçırma." },
      { title: "GÜÇ/KONTROL", desc: "Hayatının kontrolüyle\nilgili bir mesaj. Güç\ndengesi değişiyor." },
    ],
    questionTitle: "RÜYANDA PARAYI",
    questionBody: "buldun mu,\nyoksa kaybettin mi?",
    questionFooter: "buluş/kayıp, akışını gösterir",
    hashtag: "#para",
    searchVolume: "high",
  },

  // ─── 17. DÜĞÜN ───────────────────────────────────────────────────────
  {
    id: "wedding",
    symbolName: "düğün",
    symbolNameUpper: "DÜĞÜN",
    iconType: "wedding",
    meanings: [
      { title: "BİRLEŞME", desc: "İçindeki zıt parçalar\nbirleşiyor. Bir bütünleşme,\nbir uyum yaklaşıyor." },
      { title: "YENİ DÖNEM", desc: "Hayatında büyük bir\ngeçiş var. Eski biter,\nyeni resmen başlar." },
      { title: "TAAHHÜT", desc: "Bir karara bağlanma\nzamanı. Bir söz, bir\nadanma seni bekliyor." },
    ],
    questionTitle: "RÜYANDAKİ DÜĞÜN",
    questionBody: "mutlu muydu,\nyoksa huzursuz mu?",
    questionFooter: "havası, geçişin doğasını söyler",
    hashtag: "#düğün",
    searchVolume: "medium",
  },

  // ─── 18. ARABA ───────────────────────────────────────────────────────
  {
    id: "car",
    symbolName: "araba",
    symbolNameUpper: "ARABA",
    iconType: "car",
    meanings: [
      { title: "HAYAT YÖNÜ", desc: "Araba = hayat yolculuğun.\nNereye gittiğin, ne kadar\nkontrolde olduğun." },
      { title: "KONTROL", desc: "Direksiyon kimde? Hayatının\nkontrolünü elinde tutup\ntutmadığını sorgula." },
      { title: "İLERLEME", desc: "Bir hedefe doğru\nilerliyorsun. Hız ve yön\nsana ipucu veriyor." },
    ],
    questionTitle: "ARABAYI",
    questionBody: "sen mi sürüyordun,\nyoksa başkası mı?",
    questionFooter: "sürücü, kontrolün kimde olduğunu söyler",
    hashtag: "#araba",
    searchVolume: "medium",
  },

  // ─── 19. EV ──────────────────────────────────────────────────────────
  {
    id: "house",
    symbolName: "ev",
    symbolNameUpper: "EV",
    iconType: "house",
    meanings: [
      { title: "BENLİK", desc: "Ev = sensin. Odaları\nbenliğinin farklı yanlarını\ntemsil eder." },
      { title: "GÜVENLİK", desc: "Güvende hissetme\nihtiyacın var. İç huzurunu\narıyorsun." },
      { title: "İÇ DÜNYA", desc: "Bilinçaltına bir yolculuk.\nKeşfedilmemiş odalar\nyeni keşifler demek." },
    ],
    questionTitle: "RÜYANDAKİ EV",
    questionBody: "tanıdık mıydı,\nyoksa yabancı mı?",
    questionFooter: "tanışıklık, kendinle bağını gösterir",
    hashtag: "#ev",
    searchVolume: "medium",
  },

  // ─── 20. SAÇ ─────────────────────────────────────────────────────────
  {
    id: "hair",
    symbolName: "saç",
    symbolNameUpper: "SAÇ",
    iconType: "hair",
    meanings: [
      { title: "GÜÇ & ÖZGÜVEN", desc: "Saç = güç ve kimlik.\nÖzgüvenin ve enerjinle\nilgili bir mesaj." },
      { title: "DEĞİŞİM", desc: "Saç kesmek/uzamak\ndönüşüm demek. Hayatında\nbir şey değişiyor." },
      { title: "KAYGI", desc: "Saç dökülmesi gördüysen\nbir kontrol/güç kaybı\nkorkusu olabilir." },
    ],
    questionTitle: "RÜYANDA SAÇIN",
    questionBody: "uzadı mı,\nyoksa döküldü/kesildi mi?",
    questionFooter: "değişimi, dönüşümünü gösterir",
    hashtag: "#saç",
    searchVolume: "medium",
  },

  // ─── 21. KAYBOLMAK ───────────────────────────────────────────────────
  {
    id: "lost",
    symbolName: "kaybolmak",
    symbolNameUpper: "KAYBOLDUĞUNU",
    iconType: "lost",
    meanings: [
      { title: "YÖN KAYBI", desc: "Hayatında bir yol ayrımındasın.\nNereye gideceğinden\nemin değilsin." },
      { title: "BELİRSİZLİK", desc: "Bir konuda kafan karışık.\nNetlik gelene kadar\nacele etme." },
      { title: "ARAYIŞ", desc: "Aslında kendini arıyorsun.\nKaybolmak bazen bulmanın\nilk adımıdır." },
    ],
    questionTitle: "RÜYANDA",
    questionBody: "panikledin mi,\nyoksa sakin miydin?",
    questionFooter: "tepkin, içsel durumunu gösterir",
    hashtag: "#kaybolmak",
    searchVolume: "medium",
  },

  // ─── 22. AĞLAMAK ─────────────────────────────────────────────────────
  {
    id: "crying",
    symbolName: "ağlamak",
    symbolNameUpper: "AĞLADIĞINI",
    iconType: "crying",
    meanings: [
      { title: "ARINMA", desc: "Gözyaşı temizler.\nBiriken duygular boşalıyor,\nbu aslında şifa." },
      { title: "BASTIRILMIŞ HİS", desc: "Gündüz tutamadığın\nduygular geceye taşıyor.\nKendine izin ver." },
      { title: "RAHATLAMA", desc: "Ağlamak çoğu zaman\nferahlama işaretidir.\nYükün hafifliyor." },
    ],
    questionTitle: "RÜYANDA",
    questionBody: "hüzünden mi,\nyoksa mutluluktan mı?",
    questionFooter: "sebebi, duygunun kaynağını söyler",
    hashtag: "#ağlamak",
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
