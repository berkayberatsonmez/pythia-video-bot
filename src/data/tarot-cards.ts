// ═══════════════════════════════════════════════════════════════════════════
// Pythia — Tarot Major Arcana Veritabanı (22 kart)
//
// Format: "Bugün senin kartın: X" → 3 tema → soru → CTA
// Gerçek kart görselleri: public/tarot/00.webp - 21.webp
// ═══════════════════════════════════════════════════════════════════════════

export type TarotCard = {
  id: string;
  cardName: string; // "YILDIZ" (display)
  cardNameSub: string; // "The Star" (alt başlık)
  imageFile: string; // "17.webp"
  energy: string; // Hook'ta kullanılır: "umut & şifa"
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

export const TAROT_CARDS: TarotCard[] = [
  {
    id: "fool",
    cardName: "DELİ",
    cardNameSub: "The Fool",
    imageFile: "00.webp",
    energy: "yeni başlangıç",
    meanings: [
      { title: "YENİ YOL", desc: "Önünde bilinmeyen bir yol var.\nKorkma — bu boşluğa atılan\nadım seni özgürleştirecek." },
      { title: "MASUMİYET", desc: "Geçmişin yükünü bırak.\nÇocuk gibi merak et,\nhayata yeniden inan." },
      { title: "RİSK", desc: "Mantığın 'dur' diyor ama\nkalbin 'git' diyor. Bugün\nkalbini dinleme günü." },
    ],
    questionTitle: "BUGÜN SEN",
    questionBody: "atlamaya hazır mısın,\nyoksa hâlâ tereddütte mi?",
    questionFooter: "kart sana cesareti hatırlatıyor",
    hashtag: "#tarot",
  },
  {
    id: "magician",
    cardName: "BÜYÜCÜ",
    cardNameSub: "The Magician",
    imageFile: "01.webp",
    energy: "yaratma gücü",
    meanings: [
      { title: "GÜÇ SENDE", desc: "İhtiyacın olan her şeye\nzaten sahipsin. Eksik olan\nsadece harekete geçmek." },
      { title: "ODAK", desc: "Dağılan enerjini topla.\nNiyet + irade birleşince\nevren sana 'evet' der." },
      { title: "YARATIM", desc: "Hayal ettiğin şeyi\ngerçeğe dönüştürme zamanı.\nSen kendi sihrini yaratıyorsun." },
    ],
    questionTitle: "PEKİ SEN",
    questionBody: "gücünü kullanıyor musun,\nyoksa erteliyor musun?",
    questionFooter: "kart 'şimdi' diyor",
    hashtag: "#tarot",
  },
  {
    id: "high-priestess",
    cardName: "AZİZE",
    cardNameSub: "The High Priestess",
    imageFile: "02.webp",
    energy: "sezgi & gizem",
    meanings: [
      { title: "SEZGİ", desc: "İç sesin bugün çok güçlü.\nMantığın göremediğini\nsezgilerin biliyor." },
      { title: "GİZLİ BİLGİ", desc: "Görünenin ardında bir\ngerçek var. Acele etme —\nzamanı gelince açılacak." },
      { title: "İÇE DÖNÜŞ", desc: "Cevaplar dışarıda değil,\niçinde. Sessizliğe kulak ver,\nruhun konuşuyor." },
    ],
    questionTitle: "İÇ SESİN",
    questionBody: "sana ne fısıldıyor,\ndinliyor musun?",
    questionFooter: "kart sezgine güvenmeni istiyor",
    hashtag: "#tarot",
  },
  {
    id: "empress",
    cardName: "İMPARATORİÇE",
    cardNameSub: "The Empress",
    imageFile: "03.webp",
    energy: "bereket & bolluk",
    meanings: [
      { title: "BOLLUK", desc: "Hayatına bereket akıyor.\nEmek verdiğin şeyler\nmeyvesini vermek üzere." },
      { title: "ŞEFKAT", desc: "Kendine annen gibi davran.\nSevgiyle besle, sabırla\nbüyüt — her şey çiçeklenecek." },
      { title: "YARATICILIK", desc: "İçindeki yaratıcı enerji\ntaşıyor. Bir fikir, bir proje,\nbir yenilik doğmak istiyor." },
    ],
    questionTitle: "SEN BUGÜN",
    questionBody: "kendine yeterince\nşefkat gösteriyor musun?",
    questionFooter: "kart bolluğun yolda olduğunu söylüyor",
    hashtag: "#tarot",
  },
  {
    id: "emperor",
    cardName: "İMPARATOR",
    cardNameSub: "The Emperor",
    imageFile: "04.webp",
    energy: "düzen & otorite",
    meanings: [
      { title: "KONTROL", desc: "Hayatına yapı kurma zamanı.\nKaos içinde düzen yaratmak\nsenin elinde." },
      { title: "DİSİPLİN", desc: "Hayallerini gerçeğe çeviren\nsihir değil disiplin. Bugün\nsözünü tutma günü." },
      { title: "GÜÇLÜ DURUŞ", desc: "Sınırlarını koru. Hayır\ndemekten korkma — gücün\nnetliğinde saklı." },
    ],
    questionTitle: "HAYATININ",
    questionBody: "kontrolü sende mi,\nyoksa savruluyor musun?",
    questionFooter: "kart sağlam durmanı istiyor",
    hashtag: "#tarot",
  },
  {
    id: "hierophant",
    cardName: "AZİZ",
    cardNameSub: "The Hierophant",
    imageFile: "05.webp",
    energy: "bilgelik & rehberlik",
    meanings: [
      { title: "REHBERLİK", desc: "Hayatına bir öğretmen,\nbir yol gösterici giriyor.\nGözünü aç, işareti gör." },
      { title: "GELENEK", desc: "Köklerine dön. Eski bilgelik,\nailenin değerleri bugün\nsana yön gösteriyor." },
      { title: "İNANÇ", desc: "Bir şeye inanma ihtiyacın var.\nManevi bir bağ kurman\nseni güçlendirecek." },
    ],
    questionTitle: "SENİN",
    questionBody: "yol göstericin kim,\nkime güveniyorsun?",
    questionFooter: "kart doğru rehberi işaret ediyor",
    hashtag: "#tarot",
  },
  {
    id: "lovers",
    cardName: "AŞIKLAR",
    cardNameSub: "The Lovers",
    imageFile: "06.webp",
    energy: "aşk & seçim",
    meanings: [
      { title: "AŞK", desc: "Kalbin bir bağ kurmak\nistiyor. Yeni bir aşk ya da\nderinleşen bir ilişki yolda." },
      { title: "SEÇİM", desc: "Bir karar vermen gerekiyor.\nİki yol var — kalbinin\nseçtiği doğru olan." },
      { title: "UYUM", desc: "Zıtlıklar birleşiyor.\nİçindeki erkek ve dişi enerji\ndenge buluyor." },
    ],
    questionTitle: "KALBİN",
    questionBody: "kimi seçiyor,\nneyi istiyor?",
    questionFooter: "kart seçimini kalbinle yapmanı istiyor",
    hashtag: "#tarot",
  },
  {
    id: "chariot",
    cardName: "SAVAŞ ARABASI",
    cardNameSub: "The Chariot",
    imageFile: "07.webp",
    energy: "zafer & irade",
    meanings: [
      { title: "ZAFER", desc: "Mücadele bitiyor, zafer\nyaklaşıyor. Pes etme —\nçizgiyi geçmek üzeresin." },
      { title: "İRADE", desc: "Engeller var ama iraden\ndaha güçlü. Zıt güçleri\ntek yöne sür." },
      { title: "İLERLE", desc: "Durma zamanı değil.\nKararlılıkla ileri git,\nyol senin önünde açılıyor." },
    ],
    questionTitle: "SEN",
    questionBody: "hedefe odaklı mısın,\nyoksa dağıldın mı?",
    questionFooter: "kart zaferin yakın olduğunu söylüyor",
    hashtag: "#tarot",
  },
  {
    id: "strength",
    cardName: "GÜÇ",
    cardNameSub: "Strength",
    imageFile: "08.webp",
    energy: "cesaret & sabır",
    meanings: [
      { title: "İÇSEL GÜÇ", desc: "Gerçek güç kaba kuvvet değil,\nsabır ve şefkat. İçindeki\naslanı sevgiyle yönet." },
      { title: "CESARET", desc: "Korktuğun şeyle yüzleş.\nBugün o cesarete sahipsin —\nsadece adım at." },
      { title: "SABIR", desc: "Zorlama, ak. Yumuşaklıkla\nkazanılan zafer en kalıcı\nolanıdır." },
    ],
    questionTitle: "SENİN",
    questionBody: "en büyük korkun ne,\nyüzleşmeye hazır mısın?",
    questionFooter: "kart içindeki gücü hatırlatıyor",
    hashtag: "#tarot",
  },
  {
    id: "hermit",
    cardName: "ERMİŞ",
    cardNameSub: "The Hermit",
    imageFile: "09.webp",
    energy: "içe dönüş & bilgelik",
    meanings: [
      { title: "YALNIZLIK", desc: "Kalabalıktan uzaklaşma\nzamanı. Kendinle baş başa\nkalmak şifa olacak." },
      { title: "ARAYIŞ", desc: "Bir cevap arıyorsun.\nIşığı dışarıda değil, kendi\niçinde bulacaksın." },
      { title: "BİLGELİK", desc: "Yaşadıkların seni\nolgunlaştırdı. Artık başkalarına\nyol gösterebilirsin." },
    ],
    questionTitle: "SEN",
    questionBody: "yalnız kalmaktan mı\nkorkuyorsun, yoksa özlüyor musun?",
    questionFooter: "kart içine dönmeni istiyor",
    hashtag: "#tarot",
  },
  {
    id: "wheel",
    cardName: "KADER ÇARKI",
    cardNameSub: "Wheel of Fortune",
    imageFile: "10.webp",
    energy: "kader & değişim",
    meanings: [
      { title: "DÖNÜM NOKTASI", desc: "Çark dönüyor, talihin\ndeğişiyor. Beklediğin fırsat\nkapıya geliyor." },
      { title: "DÖNGÜ", desc: "Her şeyin bir zamanı var.\nKötü dönem bitiyor, iyi\ndönem başlıyor." },
      { title: "KADER", desc: "Tesadüf yok. Hayatına giren\nher şeyin bir anlamı var —\nakışa güven." },
    ],
    questionTitle: "HAYATIN",
    questionBody: "hangi döngüde,\nçıkışta mı inişte mi?",
    questionFooter: "kart talihinin döndüğünü söylüyor",
    hashtag: "#tarot",
  },
  {
    id: "justice",
    cardName: "ADALET",
    cardNameSub: "Justice",
    imageFile: "11.webp",
    energy: "denge & gerçek",
    meanings: [
      { title: "ADALET", desc: "Ektiğini biçme zamanı.\nHak ettiğin şey sana\ngeri dönüyor." },
      { title: "GERÇEK", desc: "Bir gerçek ortaya çıkıyor.\nKendine ve başkalarına\ndürüst olma günü." },
      { title: "DENGE", desc: "Bir karar bozulan dengeyi\ndüzeltecek. Mantıkla kalbi\neşit tut." },
    ],
    questionTitle: "SEN",
    questionBody: "kendine karşı\ndürüst müsün?",
    questionFooter: "kart dengeyi geri getiriyor",
    hashtag: "#tarot",
  },
  {
    id: "hanged-man",
    cardName: "ASILAN ADAM",
    cardNameSub: "The Hanged Man",
    imageFile: "12.webp",
    energy: "teslimiyet & bakış açısı",
    meanings: [
      { title: "TESLİMİYET", desc: "Kontrol etmeyi bırak.\nBazen akışa teslim olmak\nen büyük güçtür." },
      { title: "YENİ BAKIŞ", desc: "Olaylara baş aşağı bak.\nFarklı bir açıdan gördüğünde\nçözüm kendini gösterecek." },
      { title: "BEKLEYİŞ", desc: "Şu an harekete geçme zamanı\ndeğil. Sabırla bekle —\ndoğru an yaklaşıyor." },
    ],
    questionTitle: "SEN",
    questionBody: "neyi bırakamıyorsun,\nneye tutunuyorsun?",
    questionFooter: "kart bırakmanı istiyor",
    hashtag: "#tarot",
  },
  {
    id: "death",
    cardName: "ÖLÜM",
    cardNameSub: "Death",
    imageFile: "13.webp",
    energy: "dönüşüm & yeniden doğuş",
    meanings: [
      { title: "SON", desc: "Bir dönem bitiyor.\nKorkma — bu ölüm değil,\ndönüşüm. Eski sen gidiyor." },
      { title: "DÖNÜŞÜM", desc: "Kabuğunu kır. Eskiyi bırak\nki yeni gelebilsin.\nBu kart aslında özgürlük." },
      { title: "YENİDEN DOĞUŞ", desc: "Küllerinden doğuyorsun.\nKaybettiğin şeyin yerine\ndaha güzeli gelecek." },
    ],
    questionTitle: "SEN",
    questionBody: "neyi bitirmen gerekiyor\nama korkuyorsun?",
    questionFooter: "kart yeni bir başlangıç vaat ediyor",
    hashtag: "#tarot",
  },
  {
    id: "temperance",
    cardName: "DENGE",
    cardNameSub: "Temperance",
    imageFile: "14.webp",
    energy: "uyum & ölçü",
    meanings: [
      { title: "DENGE", desc: "Aşırılıklardan uzaklaş.\nOrta yolu bul — huzur\ndengede saklı." },
      { title: "SABIR", desc: "Acele etme. İyi şeyler\nzamanla pişer. Sürece\ngüven." },
      { title: "UYUM", desc: "Zıt güçleri birleştir.\nFarklı parçalar bir araya\ngelip ahenk yaratıyor." },
    ],
    questionTitle: "HAYATINDA",
    questionBody: "denge var mı,\nyoksa bir uç mu baskın?",
    questionFooter: "kart orta yolu işaret ediyor",
    hashtag: "#tarot",
  },
  {
    id: "devil",
    cardName: "ŞEYTAN",
    cardNameSub: "The Devil",
    imageFile: "15.webp",
    energy: "bağ & gölge",
    meanings: [
      { title: "BAĞIMLILIK", desc: "Bir şeye ya da birine\nzincirlenmişsin. Aslında\nzincirin anahtarı sende." },
      { title: "GÖLGE", desc: "Yüzleşmediğin karanlık\nbir yanın var. Görmezden\ngelmek onu büyütüyor." },
      { title: "ÖZGÜRLEŞ", desc: "Seni tutsak eden şeyi\nfark et. Farkındalık\nözgürlüğün ilk adımı." },
    ],
    questionTitle: "SENİ",
    questionBody: "ne zincirliyor,\nbırakmaya hazır mısın?",
    questionFooter: "kart zincirin sende olduğunu söylüyor",
    hashtag: "#tarot",
  },
  {
    id: "tower",
    cardName: "KULE",
    cardNameSub: "The Tower",
    imageFile: "16.webp",
    energy: "ani değişim & uyanış",
    meanings: [
      { title: "YIKILIŞ", desc: "Sağlam sandığın bir şey\nyıkılıyor. Acı verse de\nbu yıkım gerekliydi." },
      { title: "GERÇEK", desc: "Bir illüzyon parçalanıyor.\nYalan üzerine kurulan\nşeyler ayakta kalamaz." },
      { title: "AYDINLANMA", desc: "Şok edici ama özgürleştirici.\nEnkazın içinden gerçek\nsen doğacak." },
    ],
    questionTitle: "HAYATINDA",
    questionBody: "neyin yıkılması\naslında kurtuluş olur?",
    questionFooter: "kart yıkımın yeni başlangıç olduğunu söylüyor",
    hashtag: "#tarot",
  },
  {
    id: "star",
    cardName: "YILDIZ",
    cardNameSub: "The Star",
    imageFile: "17.webp",
    energy: "umut & şifa",
    meanings: [
      { title: "UMUT", desc: "Karanlıktan sonra ışık\ngeliyor. Uzun süredir\nbeklediğin huzur yakın." },
      { title: "ŞİFA", desc: "Yaralar iyileşiyor.\nKendine zaman tanı —\nşifa süreci başladı." },
      { title: "İLHAM", desc: "Hayallerine güven.\nEvren seni doğru yöne\nyönlendiriyor." },
    ],
    questionTitle: "SENİN",
    questionBody: "en büyük umudun ne,\nona hâlâ inanıyor musun?",
    questionFooter: "kart ışığın geldiğini müjdeliyor",
    hashtag: "#tarot",
  },
  {
    id: "moon",
    cardName: "AY",
    cardNameSub: "The Moon",
    imageFile: "18.webp",
    energy: "illüzyon & korku",
    meanings: [
      { title: "İLLÜZYON", desc: "Gördüğün her şey gerçek\ndeğil. Korkuların gözünü\nperdeliyor olabilir." },
      { title: "BİLİNÇALTI", desc: "Rüyaların, sezgilerin\nbugün çok güçlü. Bilinçaltın\nsana mesaj veriyor." },
      { title: "BELİRSİZLİK", desc: "Her şey net değil.\nAcele karar verme — sis\ndağılana kadar bekle." },
    ],
    questionTitle: "SENİ",
    questionBody: "hangi korku\ngerçekten engelliyor?",
    questionFooter: "kart korkunun illüzyon olduğunu söylüyor",
    hashtag: "#tarot",
  },
  {
    id: "sun",
    cardName: "GÜNEŞ",
    cardNameSub: "The Sun",
    imageFile: "19.webp",
    energy: "mutluluk & başarı",
    meanings: [
      { title: "MUTLULUK", desc: "Gerçek bir neşe geliyor.\nKaranlık dönem bitti —\ngüneş senin için doğuyor." },
      { title: "BAŞARI", desc: "Emeklerin karşılığını\nalıyorsun. Parlama zamanı,\nkendini gizleme." },
      { title: "CANLILIK", desc: "İçindeki çocuk uyanıyor.\nHayatın tadını çıkar,\nbasitçe mutlu ol." },
    ],
    questionTitle: "SENİ",
    questionBody: "bugün ne mutlu eder,\nona izin veriyor musun?",
    questionFooter: "kart en parlak günlerin geldiğini söylüyor",
    hashtag: "#tarot",
  },
  {
    id: "judgement",
    cardName: "MAHKEME",
    cardNameSub: "Judgement",
    imageFile: "20.webp",
    energy: "uyanış & yenilenme",
    meanings: [
      { title: "UYANIŞ", desc: "Bir çağrı duyuyorsun.\nRuhun seni gerçek\nyoluna davet ediyor." },
      { title: "HESAPLAŞMA", desc: "Geçmişle yüzleşme zamanı.\nAffet, kapat, ileri bak —\nyük artık taşınmıyor." },
      { title: "YENİDEN DOĞUŞ", desc: "Yeni bir sen doğuyor.\nEski hayatın çağrısı bitti,\nyeni amaç çağırıyor." },
    ],
    questionTitle: "RUHUN",
    questionBody: "seni neye\nçağırıyor?",
    questionFooter: "kart büyük bir uyanışı müjdeliyor",
    hashtag: "#tarot",
  },
  {
    id: "world",
    cardName: "DÜNYA",
    cardNameSub: "The World",
    imageFile: "21.webp",
    energy: "tamamlanma & başarı",
    meanings: [
      { title: "TAMAMLANMA", desc: "Bir döngü tamamlanıyor.\nUzun bir yolculuğun sonuna\ngeldin — kutla." },
      { title: "BAŞARI", desc: "Hedefe ulaştın.\nEmek verdiğin şey artık\ngerçek oldu." },
      { title: "BÜTÜNLÜK", desc: "Kendini tamamlanmış\nhissediyorsun. Parçalar\nbir araya geldi, huzurdasın." },
    ],
    questionTitle: "HAYATINDA",
    questionBody: "neyi tamamladın,\nsırada ne var?",
    questionFooter: "kart bir döngünün zaferle bittiğini söylüyor",
    hashtag: "#tarot",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
export function getTodaysTarot(): TarotCard {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return TAROT_CARDS[dayOfYear % TAROT_CARDS.length];
}

export function getTarotById(id: string): TarotCard | undefined {
  return TAROT_CARDS.find((c) => c.id === id);
}
