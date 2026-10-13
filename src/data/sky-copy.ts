// ═══════════════════════════════════════════════════════════════════════════
// Gök Gündemi — Türkçe metin verisi (statik).
//
// Çerçeve: EĞLENCE amaçlı, geleneksel astroloji anlatımı. Korkutma, kesin
// kehanet, tıbbi/finansal tavsiye YOK. Cümleler "-abilir", "iyi gelebilir",
// "fayda var" kalıbında; her satır bağımsız okunur (burcun rolünden —
// durağan burç, karşıtı, yönetici — bağımsız).
//
// Her gezegen için: tema (geleneksel ilişkilendirme) + 12 burç satırı + 3 ipucu
// (başlıyor / sürüyor / bitiyor). Ay evreleri için 12'şer satır. Seçim mantığı
// scripts/sky-events.ts → affectedSigns().
// ═══════════════════════════════════════════════════════════════════════════

export type PlanetKey = "mercury" | "venus" | "mars" | "jupiter" | "saturn";
export const PLANET_ORDER: PlanetKey[] = ["mercury", "venus", "mars", "jupiter", "saturn"];

/** 0 Koç … 11 Balık (zodiac-signs.ts sırası). */
export const SIGN_NAMES = [
  "Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak",
  "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık",
];
export const SIGN_IDS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

type Line12 = [string, string, string, string, string, string, string, string, string, string, string, string];

export type PlanetCopy = {
  name: string; // "Merkür"
  rulers: number[]; // yönettiği burçlar (geleneksel)
  theme: { title: string; desc: string };
  tip: { start: string; mid: string; end: string };
  hashtags: string[]; // IG: 5
  signLines: Line12;
};

export const PLANET_COPY: Record<PlanetKey, PlanetCopy> = {
  mercury: {
    name: "Merkür",
    rulers: [2, 5],
    theme: {
      title: "İLETİŞİM · TEKNOLOJİ · YOLCULUK",
      desc: "Geleneksel astrolojide Merkür; konuşma, yazışma, teknoloji ve seyahatle ilişkilendirilir.",
    },
    tip: {
      start: "Önemli mesajları göndermeden önce bir kez daha oku; planlarına biraz esneklik bırak.",
      mid: "Yarım kalan işlere dönmek için güzel bir zaman; yeni bir şeye atılmadan önce gözden geçir.",
      end: "Nefes alma zamanı; bekleyen konuşmaları ve kararları yavaş yavaş toparlayabilirsin.",
    },
    hashtags: ["#merkürretrosu", "#retro", "#astroloji", "#burçlar", "#pythia"],
    signLines: [
      "Hızlı atılan mesajlara bir de ikinci kez bakmak iyi gelebilir.",
      "Para ve plan konularında acele etmemek fayda sağlayabilir.",
      "Zihnin karışabilir; yazmadan önce bir kez daha okumakta fayda var.",
      "Eski bir anı ya da konuşma yeniden gündeme gelebilir.",
      "İfade tarzını biraz yumuşatmak, anlaşılmanı kolaylaştırabilir.",
      "Detaylara bir kez daha göz atmak bu dönemde işine yarayabilir.",
      "Kararsız kaldığın konularda net konuşmak rahatlatabilir.",
      "Söylenmeyen bir şeyi dile getirmek için uygun bir an olabilir.",
      "Seyahat ve plan değişikliklerine esnek kalmak iyi gelebilir.",
      "İş yazışmalarında ve tarihlerde çifte kontrol yapmakta fayda var.",
      "Teknolojiyle ilgili küçük aksilikler için yedek planın olsun.",
      "Sezgilerine güvenirken sözleri de netleştirmek dengeli olabilir.",
    ],
  },
  venus: {
    name: "Venüs",
    rulers: [1, 6],
    theme: {
      title: "AŞK · İLİŞKİLER · DEĞERLER",
      desc: "Geleneksel astrolojide Venüs; sevgi, uyum, estetik ve neye değer verdiğimizle ilişkilendirilir.",
    },
    tip: {
      start: "Kalbinden geçeni söylemeden önce bir nefes al; büyük ilişki ve harcama kararlarını aceleye getirme.",
      mid: "Neye gerçekten değer verdiğini sakin kafayla düşünmek için güzel bir zaman.",
      end: "Duygular yatışıyor; kalbine ve ilişkilerine nazikçe yeniden bakabilirsin.",
    },
    hashtags: ["#venüsretrosu", "#retro", "#astroloji", "#burçlar", "#pythia"],
    signLines: [
      "Kalbinden geçeni söylemeden önce bir nefes almak iyi gelebilir.",
      "Harcamalarını ve değer verdiklerini yeniden gözden geçirebilirsin.",
      "Eski bir ilişki ya da arkadaşlık yeniden aklına gelebilir.",
      "Duygusal güvenlik ihtiyacın bu dönemde öne çıkabilir.",
      "İlgi görme isteği ile gerçek ihtiyaçlarını ayırmak iyi gelebilir.",
      "Kendine yönelik eleştirini biraz yumuşatmakta fayda var.",
      "İlişkilerde dengeyi yeniden kurmak için güzel bir fırsat olabilir.",
      "Derin duygular yüzeye çıkabilir; sabırlı olmak rahatlatabilir.",
      "Özgürlük ile bağlılık arasındaki dengeyi yeniden düşünebilirsin.",
      "Önceliklerini sakin kafayla değerlendirmek iyi gelebilir.",
      "Yakınlık konusunda kendi temponu korumak iyi gelebilir.",
      "Hayallerinle gerçekleri yan yana koymak için uygun bir dönem olabilir.",
    ],
  },
  mars: {
    name: "Mars",
    rulers: [0, 7],
    theme: {
      title: "ENERJİ · MOTİVASYON · İRADE",
      desc: "Geleneksel astrolojide Mars; enerji, cesaret, harekete geçme ve çatışmayla ilişkilendirilir.",
    },
    tip: {
      start: "Enerjini tek bir hedefe topla; sinirli anlarda cevap vermeden önce yürüyüşe çıkmak iyi gelebilir.",
      mid: "Tempoyu zorlamadan, düzenli ve sürdürülebilir ilerlemek bu dönemde işe yarayabilir.",
      end: "Enerjin yeniden akmaya başlıyor; bekleyen projelere kademeli dönebilirsin.",
    },
    hashtags: ["#marsretrosu", "#retro", "#astroloji", "#burçlar", "#pythia"],
    signLines: [
      "Enerjini bölmeden tek bir hedefe yöneltmek iyi gelebilir.",
      "Yavaş ve sağlam ilerlemek bu dönemde işe yarayabilir.",
      "Aynı anda çok iş yorucu olabilir; öncelik belirlemekte fayda var.",
      "Sinirli anlarda bir adım geri çekilmek rahatlatabilir.",
      "Gösterişten çok istikrarlı çaba daha çok karşılık bulabilir.",
      "Mükemmeliyetçiliği gevşetmek enerjini korumana yardım edebilir.",
      "Çatışmadan kaçmak yerine nazikçe sınır koymak iyi gelebilir.",
      "Yoğun enerjiyi spora ya da üretime yönlendirebilirsin.",
      "Büyük atılımlardan önce planı bir kez daha gözden geçirmek iyi olabilir.",
      "Dayanıklılığını zorlamadan düzenli bir tempo tutturabilirsin.",
      "Fikirlerini hemen uygulamak yerine olgunlaştırmak yararlı olabilir.",
      "Enerjin dalgalanabilir; dinlenmeye de yer açmakta fayda var.",
    ],
  },
  jupiter: {
    name: "Jüpiter",
    rulers: [8, 11],
    theme: {
      title: "BÜYÜME · ŞANS · ANLAM",
      desc: "Geleneksel astrolojide Jüpiter; gelişim, iyimserlik, öğrenme ve inançla ilişkilendirilir.",
    },
    tip: {
      start: "Büyük hedefleri hemen genişletmek yerine bildiklerini derinleştirmek iyi gelebilir.",
      mid: "Neyin gerçekten büyümeye değer olduğunu sakin sakin tartmak için güzel bir zaman.",
      end: "İyimserlik geri dönüyor; ertelediğin bir hedefe yeniden ışık tutabilirsin.",
    },
    hashtags: ["#jüpiterretrosu", "#retro", "#astroloji", "#burçlar", "#pythia"],
    signLines: [
      "Büyük hedeflerini sabırla yeniden tartmak iyi gelebilir.",
      "Bolluğu sadece maddi değil, genel olarak düşünebilirsin.",
      "Öğrenmek istediğin bir konuya yeniden dönmek için uygun bir dönem.",
      "Ev ve aile konularında içe dönük bir değerlendirme yapabilirsin.",
      "Cömertliğini dengede tutmak, kendini de unutmamak iyi gelebilir.",
      "Küçük adımlarla ilerlemenin değerini yeniden fark edebilirsin.",
      "İş birliklerinde beklentilerini netleştirmek faydalı olabilir.",
      "Dönüşmek istediğin alanları sakin bir gözle gözden geçirebilirsin.",
      "İnançlarını ve yön duygunu yeniden sorgulamak için uygun bir an olabilir.",
      "Kariyer hedeflerinde acele etmeden stratejini gözden geçirebilirsin.",
      "Topluluk ve hayal konularında yeni bir bakış açısı gelebilir.",
      "Sezgisel tarafını besleyecek sakin zamanlar ayırmak iyi gelebilir.",
    ],
  },
  saturn: {
    name: "Satürn",
    rulers: [9, 10],
    theme: {
      title: "SORUMLULUK · DİSİPLİN · SINIRLAR",
      desc: "Geleneksel astrolojide Satürn; düzen, sabır, sorumluluk ve sınırlarla ilişkilendirilir.",
    },
    tip: {
      start: "Kendine yükleneni sadeleştir; sınırlarını koruyup küçük ama düzenli adımlarla ilerle.",
      mid: "Temellerini sağlamlaştırmak için güzel bir zaman; hızdan çok istikrar işe yarayabilir.",
      end: "Yük hafifliyor; öğrendiklerini düzenli bir rutine dönüştürebilirsin.",
    },
    hashtags: ["#satürnretrosu", "#retro", "#astroloji", "#burçlar", "#pythia"],
    signLines: [
      "Kendi sınırlarını yeniden çizmek için uygun bir dönem olabilir.",
      "Güvenlik ve düzen konularını sağlamlaştırmak iyi gelebilir.",
      "Sorumlulukları sadeleştirmek zihnini rahatlatabilir.",
      "Ev ve aile içi düzeni yeniden gözden geçirebilirsin.",
      "Başkalarının onayı yerine kendi disiplinine yaslanmak iyi gelebilir.",
      "Rutinlerini yeniden tasarlamak için bir fırsat olabilir.",
      "İlişkilerdeki sorumluluk dengesini konuşmak faydalı olabilir.",
      "Kontrolü bırakmakla sorumluluk almak arasındaki dengeyi arayabilirsin.",
      "Büyük planlara temel atmadan önce sağlam adımları sıralayabilirsin.",
      "Uzun vadeli hedeflerini sabırla yeniden değerlendirebilirsin.",
      "Kendi kurallarını ve değerlerini netleştirmek iyi gelebilir.",
      "Sınırlarını koruyup kendine şefkatle yaklaşmak dengeni artırabilir.",
    ],
  },
};

type MoonPhaseCopy = {
  theme: { title: string; desc: string };
  tip: string;
  signLines: Line12;
};

export const MOON_COPY: {
  full: MoonPhaseCopy;
  new: MoonPhaseCopy;
  lunarEclipse: Pick<MoonPhaseCopy, "theme" | "tip">;
  solarEclipse: Pick<MoonPhaseCopy, "theme" | "tip">;
} = {
  full: {
    theme: {
      title: "DUYGULAR · TAMAMLANMA · FARKINDALIK",
      desc: "Geleneksel astrolojide Dolunay; duyguların yükseldiği, bir döngünün tamamlandığı an olarak anlatılır.",
    },
    tip: "Bu gece birkaç dakikanı sessizce ayır; neyi bırakmak istediğini bir kağıda yazmak iyi gelebilir.",
    signLines: [
      "Duygularını hızlıca yaşamak yerine bir an gözlemlemek iyi gelebilir.",
      "Elindekine şükretmek için güzel bir gece olabilir.",
      "Zihnindeki düşünceleri yazıya dökmek rahatlatabilir.",
      "Duygusal yoğunluk artabilir; kendine nazik davranmakta fayda var.",
      "Işığını paylaşırken kendi ihtiyaçlarını da dinleyebilirsin.",
      "Bitirmek istediğin bir işi gözden geçirmek için uygun olabilir.",
      "İlişkilerde dengeyi hissetmek ve konuşmak iyi gelebilir.",
      "Yoğun duygular yüzeye çıkabilir; yargılamadan izlemek rahatlatabilir.",
      "Büyük resme bakıp bırakman gerekenleri fark edebilirsin.",
      "Emeğinin karşılığını görmek ve biraz dinlenmek iyi gelebilir.",
      "Kalabalıktan uzaklaşıp kendi sesini duymak için güzel bir an olabilir.",
      "Sezgilerin güçlenebilir; hayal ile gerçeği ayırmak yararlı olabilir.",
    ],
  },
  new: {
    theme: {
      title: "YENİ BAŞLANGIÇ · NİYET · TOHUM",
      desc: "Geleneksel astrolojide Yeniay; yeni bir döngünün başı ve niyet koymak için uygun an olarak anlatılır.",
    },
    tip: "Bu hafta için tek bir niyet seç; sade bir cümleyle yaz ve ona küçük bir adım ekle.",
    signLines: [
      "Yeni bir başlangıç için cesur ama küçük bir adım atabilirsin.",
      "Konfor alanını güzelleştirecek bir niyet belirlemek iyi gelebilir.",
      "Merak ettiğin bir konuya yeni bir kapı açabilirsin.",
      "Ev ve duygusal güvenlik için bir niyet yazmak iyi gelebilir.",
      "Yaratıcı yönünü ortaya çıkarmak için uygun bir dönem olabilir.",
      "Düzenini sadeleştirecek küçük bir hedef koyabilirsin.",
      "İlişkilerde denge için net bir niyet belirlemek faydalı olabilir.",
      "Eski bir kalıbı bırakmak için kendine alan açabilirsin.",
      "Yeni bir yön ya da öğrenme hedefi belirlemek iyi gelebilir.",
      "Uzun vadeli bir hedef için ilk sağlam adımı düşünebilirsin.",
      "Farklı bir bakış açısını denemek için güzel bir fırsat olabilir.",
      "Hayallerini sade bir cümleyle yazıya dökmek iyi gelebilir.",
    ],
  },
  lunarEclipse: {
    theme: {
      title: "KAPANIŞ · DUYGUSAL FARKINDALIK",
      desc: "Astrolojide Ay tutulması; Dolunay'ın güçlü bir versiyonu, bırakma ve farkındalık teması olarak anlatılır.",
    },
    tip: "Büyük kararları bu geceye yüklemeden, hissettiklerini not al ve birkaç gün sonra tekrar bak.",
  },
  solarEclipse: {
    theme: {
      title: "YENİ SAYFA · YÖN DEĞİŞİMİ",
      desc: "Astrolojide Güneş tutulması; Yeniay'ın güçlü bir versiyonu, yeni bir sayfa açma teması olarak anlatılır.",
    },
    tip: "Hemen sonuç beklemeden, hayalini küçük ve somut bir adıma çevir; zamana bırakmak iyi gelebilir.",
  },
};
