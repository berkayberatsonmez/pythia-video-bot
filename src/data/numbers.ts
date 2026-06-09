// ═══════════════════════════════════════════════════════════════════════════
// Pythia — Numeroloji + Melek Sayıları Veritabanı
//
// İki tür:
//   • lifepath → "Yaşam yolu X isen" (numeroloji)
//   • angel    → "X görüyorsan" (melek sayıları — TikTok'ta çok trend)
// ═══════════════════════════════════════════════════════════════════════════

export type NumberKind = "lifepath" | "angel";

export type NumberContent = {
  id: string;
  kind: NumberKind;
  number: string; // "7" veya "111"
  title: string; // "BİLGE" veya "MANİFEST KAPISI"
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

export const NUMBERS: NumberContent[] = [
  // ═══ NUMEROLOJİ — YAŞAM YOLU SAYILARI (1-9) ═══════════════════════════
  {
    id: "lp1",
    kind: "lifepath",
    number: "1",
    title: "LİDER",
    meanings: [
      { title: "ÖNCÜ", desc: "Doğuştan lidersin.\nKimsenin gitmediği yolu\naçma cesaretin var." },
      { title: "BAĞIMSIZ", desc: "Kimseye muhtaç olmadan\nayakta durabilirsin.\nÖzgürlük senin oksijenin." },
      { title: "GÖLGE", desc: "Bazen fazla inatçı ve\nbaskın olabilirsin. Yumuşamak\nseni daha güçlü yapar." },
    ],
    questionTitle: "SEN",
    questionBody: "lider misin,\nyoksa takipçi mi?",
    questionFooter: "yaşam yolu seni öncü doğurmuş",
    hashtag: "#numeroloji",
  },
  {
    id: "lp2",
    kind: "lifepath",
    number: "2",
    title: "DİPLOMAT",
    meanings: [
      { title: "BARIŞÇIL", desc: "Doğal bir arabulucusun.\nİnsanları birleştirmek\nsenin yeteneğin." },
      { title: "SEZGİSEL", desc: "Empatin çok güçlü.\nKimsenin söylemediğini\nhissedebiliyorsun." },
      { title: "GÖLGE", desc: "Herkesi mutlu etmeye\nçalışırken kendini\nkaybetme. Sınır koy." },
    ],
    questionTitle: "SEN",
    questionBody: "hep başkalarını mı\ndüşünüyorsun, kendini mi?",
    questionFooter: "yaşam yolu seni şifacı yapmış",
    hashtag: "#numeroloji",
  },
  {
    id: "lp3",
    kind: "lifepath",
    number: "3",
    title: "SANATÇI",
    meanings: [
      { title: "YARATICI", desc: "İçinde bir sanatçı var.\nKendini ifade etmen\nşart — yoksa tıkanırsın." },
      { title: "NEŞELİ", desc: "Girdiğin ortamı\naydınlatırsın. İnsanlar\nenerjine bayılır." },
      { title: "GÖLGE", desc: "Dağınık ve yüzeysel\nolabilirsin. Bir şeye\nodaklan, derinleş." },
    ],
    questionTitle: "SEN",
    questionBody: "kendini yeterince\nifade ediyor musun?",
    questionFooter: "yaşam yolu seni yaratıcı doğurmuş",
    hashtag: "#numeroloji",
  },
  {
    id: "lp4",
    kind: "lifepath",
    number: "4",
    title: "KURUCU",
    meanings: [
      { title: "GÜVENİLİR", desc: "Sözünün eri birisin.\nİnsanlar sana güvenir,\nçünkü sağlamsın." },
      { title: "DİSİPLİNLİ", desc: "Hayalleri gerçeğe\nçeviren disiplinin var.\nTuğla tuğla inşa edersin." },
      { title: "GÖLGE", desc: "Fazla katı ve değişime\nkapalı olabilirsin.\nEsneklik öğren." },
    ],
    questionTitle: "SEN",
    questionBody: "çok mu kontrolcüsün,\nyoksa akışta mısın?",
    questionFooter: "yaşam yolu seni mimar yapmış",
    hashtag: "#numeroloji",
  },
  {
    id: "lp5",
    kind: "lifepath",
    number: "5",
    title: "ÖZGÜR RUH",
    meanings: [
      { title: "MACERACI", desc: "Rutin seni öldürür.\nDeğişim, seyahat, yenilik\nsenin yakıtın." },
      { title: "MERAKLI", desc: "Her şeyi denemek\nistersin. Hayat senin için\nkeşfedilecek bir oyun." },
      { title: "GÖLGE", desc: "Bağlanmaktan kaçar,\nyarım bırakırsın.\nKararlılık öğren." },
    ],
    questionTitle: "SEN",
    questionBody: "özgürlüğünden mi\nkorkuyorsun, bağlanmaktan mı?",
    questionFooter: "yaşam yolu seni maceracı doğurmuş",
    hashtag: "#numeroloji",
  },
  {
    id: "lp6",
    kind: "lifepath",
    number: "6",
    title: "KORUYUCU",
    meanings: [
      { title: "SEVGİ DOLU", desc: "Kalbin kocaman.\nSevdiklerin için her şeyi\ngöze alırsın." },
      { title: "SORUMLU", desc: "Doğal bir bakıcısın.\nİnsanlar sana sığınır,\nçünkü güven verirsin." },
      { title: "GÖLGE", desc: "Fazla fedakarlık seni\ntüketir. Önce kendi\nbardağını doldur." },
    ],
    questionTitle: "SEN",
    questionBody: "herkese bakarken\nkendini unutuyor musun?",
    questionFooter: "yaşam yolu seni koruyucu yapmış",
    hashtag: "#numeroloji",
  },
  {
    id: "lp7",
    kind: "lifepath",
    number: "7",
    title: "BİLGE",
    meanings: [
      { title: "DERİN", desc: "Yüzeyle yetinmezsin.\nHer şeyin ardındaki\ngerçeği arıyorsun." },
      { title: "MİSTİK", desc: "Sezgilerin ve ruhsal\ntarafın çok güçlü. Görünmeyeni\ngörebiliyorsun." },
      { title: "GÖLGE", desc: "Fazla içe kapanık ve\nmesafeli olabilirsin.\nKalbini de aç." },
    ],
    questionTitle: "SEN",
    questionBody: "yalnızlığı mı seviyorsun,\nyoksa saklanıyor musun?",
    questionFooter: "yaşam yolu seni bilge doğurmuş",
    hashtag: "#numeroloji",
  },
  {
    id: "lp8",
    kind: "lifepath",
    number: "8",
    title: "GÜÇ",
    meanings: [
      { title: "HIRSLI", desc: "Büyük hedeflerin var\nve onlara ulaşacak\ngücün de var." },
      { title: "OTORİTE", desc: "Doğal bir lidersin.\nPara ve başarı seni\nbulur, çünkü hak edersin." },
      { title: "GÖLGE", desc: "Maddi başarıya fazla\ntakılıp ruhunu unutma.\nDenge kur." },
    ],
    questionTitle: "SEN",
    questionBody: "başarı için her şeyi mi\nfeda ediyorsun?",
    questionFooter: "yaşam yolu seni güçlü doğurmuş",
    hashtag: "#numeroloji",
  },
  {
    id: "lp9",
    kind: "lifepath",
    number: "9",
    title: "VİZYONER",
    meanings: [
      { title: "İDEALİST", desc: "Dünyayı değiştirmek\nistiyorsun. Kalbin tüm\ninsanlığı kucaklıyor." },
      { title: "ŞEFKATLİ", desc: "Engin bir merhametin\nvar. Acı çekenler sana\ndoğal olarak çekilir." },
      { title: "GÖLGE", desc: "Geçmişi bırakmakta\nzorlanırsın. Kapanmamış\ndefterleri kapat." },
    ],
    questionTitle: "SEN",
    questionBody: "geçmişi bırakabildin mi,\nyoksa hâlâ tutuyor mu?",
    questionFooter: "yaşam yolu seni vizyoner yapmış",
    hashtag: "#numeroloji",
  },

  // ═══ USTA SAYILAR (11, 22, 33) ════════════════════════════════════════
  {
    id: "lp11",
    kind: "lifepath",
    number: "11",
    title: "USTA SEZGİ",
    meanings: [
      { title: "AYDINLANMIŞ", desc: "Sıradan biri değilsin.\nSezgilerin neredeyse\ndoğaüstü düzeyde." },
      { title: "İLHAM", desc: "Varlığınla insanlara\nilham verirsin. Bir\nışıksın, farkında ol." },
      { title: "GÖLGE", desc: "Bu yüksek enerji seni\ngerebilir. Topraklan,\nnefes al." },
    ],
    questionTitle: "SEN",
    questionBody: "sezgilerine güveniyor musun,\nyoksa bastırıyor musun?",
    questionFooter: "11 usta sayıdır — %2 insanda var",
    hashtag: "#numeroloji",
  },
  {
    id: "lp22",
    kind: "lifepath",
    number: "22",
    title: "USTA MİMAR",
    meanings: [
      { title: "BÜYÜK VİZYON", desc: "Hayallerin devasa ama\nonları gerçeğe çevirecek\ngüce de sahipsin." },
      { title: "İNŞACI", desc: "Kalıcı eserler bırakmak\niçin doğdun. Senin işin\nnesilleri etkiler." },
      { title: "GÖLGE", desc: "Potansiyelin ağırlığı\nseni ezebilir. Adım adım\nilerle, acele etme." },
    ],
    questionTitle: "SEN",
    questionBody: "büyük hayallerinden\nkorkuyor musun?",
    questionFooter: "22 en güçlü usta sayıdır",
    hashtag: "#numeroloji",
  },
  {
    id: "lp33",
    kind: "lifepath",
    number: "33",
    title: "USTA ÖĞRETMEN",
    meanings: [
      { title: "ŞİFACI", desc: "Varlığın bile insanlara\niyi gelir. Şefkatin\nbir armağan." },
      { title: "REHBER", desc: "Başkalarına yol göstermek\niçin doğdun. Bilgeliğin\nkalbinden geliyor." },
      { title: "GÖLGE", desc: "Herkesi kurtarma yükünü\nomuzlama. Sen de\ndesteklenmeyi hak ediyorsun." },
    ],
    questionTitle: "SEN",
    questionBody: "hep verici misin,\nalmayı biliyor musun?",
    questionFooter: "33 en nadir usta sayıdır",
    hashtag: "#numeroloji",
  },

  // ═══ MELEK SAYILARI (Angel Numbers — çok trend) ══════════════════════
  {
    id: "a111",
    kind: "angel",
    number: "111",
    title: "MANİFEST KAPISI",
    meanings: [
      { title: "DİKKAT", desc: "Düşüncelerin şu an\ngerçeğe dönüşüyor.\nNe düşünüyorsan dikkat et." },
      { title: "YENİ BAŞLANGIÇ", desc: "Evren yeni bir kapı\naçıyor. Niyetini netleştir,\nfırsat geliyor." },
      { title: "HİZALANMA", desc: "Doğru yoldasın.\nRuhun ve hayatın\naynı frekansta." },
    ],
    questionTitle: "111 GÖRÜNCE",
    questionBody: "ne düşünüyordun,\nfark ettin mi?",
    questionFooter: "o düşünce evrene gönderdiğin niyet",
    hashtag: "#melekSayıları",
  },
  {
    id: "a222",
    kind: "angel",
    number: "222",
    title: "DENGE & UYUM",
    meanings: [
      { title: "SABRET", desc: "Doğru yoldasın ama\nhenüz zamanı değil.\nGüven ve bekle." },
      { title: "UYUM", desc: "İlişkilerinde denge\nkuruluyor. Sabırla\nher şey yerine oturacak." },
      { title: "İNAN", desc: "Tohumları ektin.\nŞimdi evrene güvenip\nfilizlenmesini bekle." },
    ],
    questionTitle: "222 GÖRÜNCE",
    questionBody: "neyi bekliyorsun,\nsabredebiliyor musun?",
    questionFooter: "melekler 'güven' diyor",
    hashtag: "#melekSayıları",
  },
  {
    id: "a333",
    kind: "angel",
    number: "333",
    title: "USTALAR YANINDA",
    meanings: [
      { title: "KORUMA", desc: "Yükselmiş ustalar\nyanında. Yalnız değilsin,\ndesteklen iyorsun." },
      { title: "İFADE", desc: "Yaratıcılığını ortaya\nkoy. Sesini yükseltme\nzamanı geldi." },
      { title: "CESARET", desc: "Korkma, adım at.\nGörünmeyen eller seni\ntutuyor." },
    ],
    questionTitle: "333 GÖRÜNCE",
    questionBody: "hangi cesareti\ngöstermen gerekiyor?",
    questionFooter: "ustalar seni destekliyor",
    hashtag: "#melekSayıları",
  },
  {
    id: "a444",
    kind: "angel",
    number: "444",
    title: "MELEKLER YANINDA",
    meanings: [
      { title: "GÜVENDESİN", desc: "Melekler hemen\nyanında. Korkma,\nkorunuyorsun." },
      { title: "DOĞRU YOL", desc: "Attığın adımlar\ndoğru. Devam et,\nsapma." },
      { title: "TEMEL", desc: "Sağlam temeller\natıyorsun. Emeğin\nboşa gitmiyor." },
    ],
    questionTitle: "444 GÖRÜNCE",
    questionBody: "neye güvenmen\ngerekiyor şu an?",
    questionFooter: "melekler 'yanındayız' diyor",
    hashtag: "#melekSayıları",
  },
  {
    id: "a555",
    kind: "angel",
    number: "555",
    title: "BÜYÜK DEĞİŞİM",
    meanings: [
      { title: "DÖNÜŞÜM", desc: "Hayatında büyük bir\ndeğişim kapıda. Hazır ol,\ndirenme." },
      { title: "ÖZGÜRLÜK", desc: "Eski zincirler kırılıyor.\nYeni bir özgürlük\nseni bekliyor." },
      { title: "AKIŞ", desc: "Değişimden korkma.\nEvren seni daha iyiye\ntaşıyor." },
    ],
    questionTitle: "555 GÖRÜNCE",
    questionBody: "hayatında ne\ndeğişmek üzere?",
    questionFooter: "büyük bir dönüşüm yolda",
    hashtag: "#melekSayıları",
  },
  {
    id: "a777",
    kind: "angel",
    number: "777",
    title: "ŞANS & UYANIŞ",
    meanings: [
      { title: "ŞANS", desc: "Evren seni ödüllendiriyor.\nEmeklerinin karşılığı\ngelmek üzere." },
      { title: "UYANIŞ", desc: "Ruhsal olarak\nyükseliyorsun. Doğru\nsorular sormaya başladın." },
      { title: "ONAY", desc: "Doğru yoldasın.\nEvren 'devam et'\ndiyor." },
    ],
    questionTitle: "777 GÖRÜNCE",
    questionBody: "hangi emeğinin\nkarşılığını bekliyorsun?",
    questionFooter: "şans kapını çalıyor",
    hashtag: "#melekSayıları",
  },
  {
    id: "a888",
    kind: "angel",
    number: "888",
    title: "BOLLUK",
    meanings: [
      { title: "BEREKET", desc: "Maddi bolluk yaklaşıyor.\nPara akışı için\nkapı açılıyor." },
      { title: "ÖDÜL", desc: "Çalışmaların meyve\nveriyor. Emeğin boşa\ngitmedi." },
      { title: "DENGE", desc: "Verdiğin geri dönüyor.\nEvren dengeyi\nsana lehine kuruyor." },
    ],
    questionTitle: "888 GÖRÜNCE",
    questionBody: "hangi bolluğa\nhazırsın?",
    questionFooter: "bereket kapına geliyor",
    hashtag: "#melekSayıları",
  },
  {
    id: "a999",
    kind: "angel",
    number: "999",
    title: "DÖNGÜ KAPANIŞI",
    meanings: [
      { title: "SON", desc: "Bir dönem bitiyor.\nUzun süredir taşıdığın\nyük artık kapanıyor." },
      { title: "TAMAMLANMA", desc: "Bir ders tamamlandı.\nÖğrenmen gerekeni\nöğrendin." },
      { title: "YENİ BAŞLANGIÇ", desc: "Eski bitmeden yeni\nbaşlamaz. Bırak ki\nyeni gelsin." },
    ],
    questionTitle: "999 GÖRÜNCE",
    questionBody: "hangi dönemi\nkapatman gerekiyor?",
    questionFooter: "bir döngü zaferle bitiyor",
    hashtag: "#melekSayıları",
  },
  {
    id: "a1111",
    kind: "angel",
    number: "1111",
    title: "UYANIŞ KAPISI",
    meanings: [
      { title: "PORTAL", desc: "En güçlü manifest anı.\n11:11 gördüğünde dilek\ntut — evren dinliyor." },
      { title: "UYANIŞ", desc: "Ruhsal bir uyanışın\neşiğindesin. Gözlerin\nyeni açılıyor." },
      { title: "HİZALANMA", desc: "Ruhun, zihnin ve\nhayatın aynı çizgide.\nNadir bir an bu." },
    ],
    questionTitle: "11:11 GÖRÜNCE",
    questionBody: "ne diledin,\nne niyet ettin?",
    questionFooter: "en güçlü manifest kapısı bu",
    hashtag: "#melekSayıları",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
export function getNumberById(id: string): NumberContent | undefined {
  return NUMBERS.find((n) => n.id === id);
}

export function getTodaysNumber(): NumberContent {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return NUMBERS[dayOfYear % NUMBERS.length];
}
