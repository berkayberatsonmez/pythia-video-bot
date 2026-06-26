// ═══════════════════════════════════════════════════════════════════════════
// Pythia — Burç Uyumu / İlişki (en yüksek etkileşim formatı)
//
// Format: "AKREP + BOĞA = ?" → verdict reveal → 3 beat (dinamik) → "siz misiniz?"
// Amaç: insanlar KENDİ + partner/ex burcunu etiketler → yorum + paylaşım patlar.
// sign1Id/sign2Id → zodiac-signs.ts glyph + isim.
//
// HAVUZ TAM: 12 burcun 66 olası çifti. Sıra ROUND-ROBIN — her 6'lı blokta 12
// burcun hepsi birer kez geçer, yani peş peşe gelen çiftler ortak burç İÇERMEZ
// (rotasyon arka arkaya benzer içerik vermesin diye).
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
  // ─── Tur 1 ───────────────────────────────────────────────────────────────
  {
    id: "koc-balik",
    sign1Id: "aries",
    sign2Id: "pisces",
    verdict: "ZIT RUHLAR 🌗",
    beats: [
      "Koç sert, Balık yumuşak — iki ayrı dünya.",
      "Koç korur, Balık ilham verir.",
      "Dengelerse Koç ısınır, Balık güçlenir.",
    ],
    question: "Sertlik mi, şefkat mi?",
  },
  {
    id: "boga-kova",
    sign1Id: "taurus",
    sign2Id: "aquarius",
    verdict: "İNAT DUVARI 🧱",
    beats: [
      "İki sabit burç — ikisi de fikrinden dönmez.",
      "Boğa gelenekçi, Kova devrimci.",
      "Köprü kurarlarsa istikrar + vizyon olur.",
    ],
    question: "Bu duvar yıkılır mı?",
  },
  {
    id: "ikizler-oglak",
    sign1Id: "gemini",
    sign2Id: "capricorn",
    verdict: "CİDDİYET FARKI 🎭",
    beats: [
      "İkizler oyuncu, Oğlak ciddi.",
      "Biri anı yaşar, diğeri geleceği kurar.",
      "Dengelerlerse Oğlak gülmeyi, İkizler durmayı öğrenir.",
    ],
    question: "Bu fark kapanır mı?",
  },
  {
    id: "yengec-yay",
    sign1Id: "cancer",
    sign2Id: "sagittarius",
    verdict: "EV vs DÜNYA 🌍",
    beats: [
      "Yengeç yuva ister, Yay dünyayı gezmek.",
      "Biri kök salar, diğeri kanat çırpar.",
      "Saygı duyarlarsa birbirini büyütür.",
    ],
    question: "Yuva mı, macera mı?",
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
    id: "basak-terazi",
    sign1Id: "virgo",
    sign2Id: "libra",
    verdict: "MÜKEMMELİYET ⚖️",
    beats: [
      "İkisi de detaycı ve zarif.",
      "Başak düzen, Terazi denge arar.",
      "Fazla kafa yorar, kalbi unutmamalı.",
    ],
    question: "Mantık aşka engel mi?",
  },
  // ─── Tur 2 ───────────────────────────────────────────────────────────────
  {
    id: "koc-kova",
    sign1Id: "aries",
    sign2Id: "aquarius",
    verdict: "İSYANKAR İKİLİ ⚡",
    beats: [
      "Ateş ve hava — ikisi de özgür ruh.",
      "Sıra dışı fikirler, durmayan enerji.",
      "Bağımsızlık şart — kimse kimseyi sahiplenemez.",
    ],
    question: "Özgür aşk yürür mü?",
  },
  {
    id: "oglak-balik",
    sign1Id: "capricorn",
    sign2Id: "pisces",
    verdict: "GERÇEK ve RÜYA 🌊",
    beats: [
      "Oğlak ayakları yerde, Balık bulutlarda.",
      "Biri güven verir, diğeri şefkat.",
      "Tamamlarlarsa hem sağlam hem romantik.",
    ],
    question: "Gerçek mi, hayal mi?",
  },
  {
    id: "boga-yay",
    sign1Id: "taurus",
    sign2Id: "sagittarius",
    verdict: "BAĞ vs ÖZGÜRLÜK 🎯",
    beats: [
      "Boğa kök salar, Yay maceraya koşar.",
      "Biri evde huzur, diğeri yollarda özgürlük ister.",
      "Orta yol bulurlarsa birbirini dengeler.",
    ],
    question: "Yuva mı, yol mu?",
  },
  {
    id: "ikizler-akrep",
    sign1Id: "gemini",
    sign2Id: "scorpio",
    verdict: "GİZEM vs MERAK 🕵️",
    beats: [
      "İkizler her şeyi sorar, Akrep sır saklar.",
      "Biri yüzeyde gezer, diğeri derine dalar.",
      "Çekim güçlü ama güven zor kurulur.",
    ],
    question: "Bu gizem çözülür mü?",
  },
  {
    id: "yengec-terazi",
    sign1Id: "cancer",
    sign2Id: "libra",
    verdict: "NAZİK SÜRTÜŞME 🌸",
    beats: [
      "İkisi de uyum ve sevgi ister.",
      "Ama Yengeç duygusal, Terazi mantıklı.",
      "İletişim olursa zarif bir aşk doğar.",
    ],
    question: "Duygu mu, denge mi?",
  },
  {
    id: "aslan-basak",
    sign1Id: "leo",
    sign2Id: "virgo",
    verdict: "GURUR vs ELEŞTİRİ 👑",
    beats: [
      "Aslan övgü ister, Başak eleştirir.",
      "Biri sahnede, diğeri kulis ister.",
      "Takdir ederlerse mükemmel tamamlanırlar.",
    ],
    question: "Bu egolar uyuşur mu?",
  },
  // ─── Tur 3 ───────────────────────────────────────────────────────────────
  {
    id: "koc-oglak",
    sign1Id: "aries",
    sign2Id: "capricorn",
    verdict: "İRADE SAVAŞI ⚔️",
    beats: [
      "İki lider, iki güçlü irade.",
      "Koç hızlı atılır, Oğlak hesap yapar.",
      "Saygı duyarlarsa yenilmez bir ekip olurlar.",
    ],
    question: "Kim kuralları koyar?",
  },
  {
    id: "yay-kova",
    sign1Id: "sagittarius",
    sign2Id: "aquarius",
    verdict: "ÖZGÜR RUHLAR 🕊️",
    beats: [
      "Ateş ve hava — bağımsızlık ortak.",
      "Sıra dışı fikirler, sürekli macera.",
      "Kimse kimseyi kafeslemez — en özgür aşk.",
    ],
    question: "Bağ kurabilirler mi?",
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
    id: "boga-terazi",
    sign1Id: "taurus",
    sign2Id: "libra",
    verdict: "VENÜS DOKUNUŞU 🌹",
    beats: [
      "İki Venüs burcu — estetik ve aşk düşkünü.",
      "Romantizm, güzellik ve zarafet ortak.",
      "Boğa sahiplenir, Terazi özgürlük sever.",
    ],
    question: "Aşk yeter mi?",
  },
  {
    id: "ikizler-basak",
    sign1Id: "gemini",
    sign2Id: "virgo",
    verdict: "ZİHİN OYUNU 🧠",
    beats: [
      "İki Merkür burcu — keskin zekâ ortak.",
      "Konuşmaları bitmez, analiz severler.",
      "Ama İkizler dağınık, Başak kuralcı — sürtüşür.",
    ],
    question: "Zekâ aşka yeter mi?",
  },
  {
    id: "yengec-aslan",
    sign1Id: "cancer",
    sign2Id: "leo",
    verdict: "AY ve GÜNEŞ 🌙",
    beats: [
      "Yengeç besler, Aslan ışıldar.",
      "Biri sıcacık yuva, diğeri gurur ister.",
      "İlgi ve şefkat dengelenirse altın çift.",
    ],
    question: "Ay mı, Güneş mi?",
  },
  // ─── Tur 4 ───────────────────────────────────────────────────────────────
  {
    id: "koc-yay",
    sign1Id: "aries",
    sign2Id: "sagittarius",
    verdict: "ALEV ALEV 🔥",
    beats: [
      "İki ateş burcu — macera ve özgürlük.",
      "Birlikte dünyayı fethederler.",
      "Asla sıkılmazlar ama ikisi de bağımsız.",
    ],
    question: "En eğlenceli çift bu mu?",
  },
  {
    id: "akrep-oglak",
    sign1Id: "scorpio",
    sign2Id: "capricorn",
    verdict: "GÜÇ ÇİFTİ 🖤",
    beats: [
      "Su ve toprak — hırs ve sadakat.",
      "İkisi de kontrollü, hedef odaklı.",
      "Sessiz ama yenilmez bir birliktelik.",
    ],
    question: "En güçlü çift bu mu?",
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
    id: "boga-aslan",
    sign1Id: "taurus",
    sign2Id: "leo",
    verdict: "İNATÇI GURUR 👑",
    beats: [
      "İki sabit burç — ikisi de pes etmez.",
      "Aslan ilgi ister, Boğa konfor.",
      "Anlaşırlarsa lüks bir krallık kurarlar.",
    ],
    question: "Kim taviz verir?",
  },
  {
    id: "ikizler-yengec",
    sign1Id: "gemini",
    sign2Id: "cancer",
    verdict: "AKIL vs KALP 💭",
    beats: [
      "İkizler mantıkla, Yengeç duyguyla yaşar.",
      "Biri konuşmak ister, diğeri hissetmek.",
      "Anlaşırlarsa zihin ve kalp birleşir.",
    ],
    question: "Mantık mı, duygu mu?",
  },
  // ─── Tur 5 ───────────────────────────────────────────────────────────────
  {
    id: "koc-akrep",
    sign1Id: "aries",
    sign2Id: "scorpio",
    verdict: "YANGINLA OYUN 🔥",
    beats: [
      "İki Mars enerjisi — tutku da öfke de yüksek.",
      "Çekim güçlü ama güç savaşı kaçınılmaz.",
      "Ya tutkulu bir aşk ya yıkıcı bir fırtına.",
    ],
    question: "Bu ateş kontrol edilir mi?",
  },
  {
    id: "terazi-yay",
    sign1Id: "libra",
    sign2Id: "sagittarius",
    verdict: "ÖZGÜR ROMANTİZM 🎈",
    beats: [
      "Hava ve ateş — sosyal ve maceracı.",
      "Birlikte gezer, güler, keşfederler.",
      "Hafif ve neşeli ama derinlik zaman ister.",
    ],
    question: "Eğlence aşka döner mi?",
  },
  {
    id: "basak-oglak",
    sign1Id: "virgo",
    sign2Id: "capricorn",
    verdict: "SAĞLAM EKİP 🏛️",
    beats: [
      "İki toprak burcu — disiplin ve hedef ortak.",
      "Birlikte plan yapar, geleceği kurarlar.",
      "Tutkudan çok güven — ama o güven sarsılmaz.",
    ],
    question: "Mantık mı, tutku mu kazanır?",
  },
  {
    id: "aslan-kova",
    sign1Id: "leo",
    sign2Id: "aquarius",
    verdict: "İNATLAŞMA ⚡",
    beats: [
      "Karşıt sabit burçlar — ikisi de inatçı.",
      "Aslan ilgi ister, Kova mesafe sever.",
      "Anlaşırlarsa efsane, anlaşmazsa duvar.",
    ],
    question: "Bu çift yürür mü?",
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
    id: "boga-ikizler",
    sign1Id: "taurus",
    sign2Id: "gemini",
    verdict: "FARKLI HIZLAR 🐢",
    beats: [
      "Boğa yavaş ve sabit, İkizler uçucu.",
      "Biri kök salmak ister, diğeri uçmak.",
      "Sabır olursa zenginleşir, yoksa yorar.",
    ],
    question: "Bu tempo tutar mı?",
  },
  // ─── Tur 6 ───────────────────────────────────────────────────────────────
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
    id: "basak-akrep",
    sign1Id: "virgo",
    sign2Id: "scorpio",
    verdict: "SESSİZ YOĞUNLUK 🌑",
    beats: [
      "Toprak ve su — derin ve sadık.",
      "İkisi de gözlemci ve gizemli.",
      "Güven kurulursa kopmaz bir bağ olur.",
    ],
    question: "Bu derinlik korkutur mu?",
  },
  {
    id: "aslan-yay",
    sign1Id: "leo",
    sign2Id: "sagittarius",
    verdict: "KIVILCIM 🎆",
    beats: [
      "İki ateş burcu — macera ve kahkaha dolu.",
      "Birbirini asla sıkmaz, hep heyecan ararlar.",
      "Özgürlük ikisine de şart, bağlanmak zaman alır.",
    ],
    question: "Eğlence aşka döner mi?",
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
    id: "ikizler-kova",
    sign1Id: "gemini",
    sign2Id: "aquarius",
    verdict: "ZİHİN FIRTINASI 🌀",
    beats: [
      "İki hava burcu — fikirler havada uçuşur.",
      "Asla sıkılmaz, sürekli yeni şeyler keşfederler.",
      "Özgürlükçü ama duygusal derinlik ister.",
    ],
    question: "En özgür aşk bu mu?",
  },
  {
    id: "boga-balik",
    sign1Id: "taurus",
    sign2Id: "pisces",
    verdict: "MASAL GİBİ 🌙",
    beats: [
      "Toprak ve su — biri sağlam, diğeri hayalperest.",
      "Boğa güven verir, Balık romantizmi tavan yapar.",
      "Boğa onu yere indirir, Balık ona hayal kurdurur.",
    ],
    question: "Bu çift yürür mü sence?",
  },
  // ─── Tur 7 ───────────────────────────────────────────────────────────────
  {
    id: "koc-basak",
    sign1Id: "aries",
    sign2Id: "virgo",
    verdict: "SABIR SINAVI ⏳",
    beats: [
      "Koç aceleci, Başak titiz — tempolar zıt.",
      "Biri 'hemen' der, diğeri 'önce planla'.",
      "Öğrenirlerse Koç odaklanır, Başak cesurlaşır.",
    ],
    question: "Kim kimi değiştirir?",
  },
  {
    id: "aslan-terazi",
    sign1Id: "leo",
    sign2Id: "libra",
    verdict: "ZARİF KRALLIK 🌹",
    beats: [
      "Ateş ve hava — cazibe ve zarafet.",
      "İkisi de sosyal, gösterişli ve romantik.",
      "Birlikte göz kamaştıran bir çift olurlar.",
    ],
    question: "En şık ikili mi?",
  },
  {
    id: "akrep-yengec",
    sign1Id: "scorpio",
    sign2Id: "cancer",
    verdict: "TAKINTILI AŞK 🦂",
    beats: [
      "İki su burcu — duygular dipsiz kuyu.",
      "Sadakat ve tutku had safhada.",
      "Ama kıskançlık ikisini de yiyip bitirebilir.",
    ],
    question: "Bu yoğunluk fazla mı?",
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
  {
    id: "kova-balik",
    sign1Id: "aquarius",
    sign2Id: "pisces",
    verdict: "ZİHİN ve KALP 💫",
    beats: [
      "Kova mantıkla, Balık sezgiyle yaşar.",
      "Biri özgürlük, diğeri bağ ister.",
      "Farklı ama birbirine ilham verirler.",
    ],
    question: "Akıl mı, kalp mı?",
  },
  // ─── Tur 8 ───────────────────────────────────────────────────────────────
  {
    id: "koc-aslan",
    sign1Id: "aries",
    sign2Id: "leo",
    verdict: "ATEŞ TOPU 🔥",
    beats: [
      "İki ateş burcu — tutku ve enerji tavan.",
      "İkisi de lider, kimse geri adım atmaz.",
      "Ya destansı bir aşk ya ego savaşı.",
    ],
    question: "Bu kadar ateş taşınır mı?",
  },
  {
    id: "yengec-basak",
    sign1Id: "cancer",
    sign2Id: "virgo",
    verdict: "ŞEFKATLİ DÜZEN 🤍",
    beats: [
      "Su ve toprak — biri sezgi, biri mantık.",
      "Birbirine çok özen gösterirler.",
      "Sessiz, sadık ve şifa veren bir bağ.",
    ],
    question: "En huzurlu çift bu mu?",
  },
  {
    id: "ikizler-terazi",
    sign1Id: "gemini",
    sign2Id: "libra",
    verdict: "ZİHİN İKİZİ 🪶",
    beats: [
      "İki hava burcu — sohbetleri hiç bitmez.",
      "Aynı frekansta düşünür, anında anlaşırlar.",
      "Hafif ve akıcı ama derinlikten kaçabilirler.",
    ],
    question: "En kolay aşk bu mu?",
  },
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
    id: "yay-balik",
    sign1Id: "sagittarius",
    sign2Id: "pisces",
    verdict: "HAYAL PEŞİNDE 🌠",
    beats: [
      "İki değişken burç — ikisi de hayalperest.",
      "Biri felsefe, diğeri rüya peşinde.",
      "İlham verir ama yön bulmak zor.",
    ],
    question: "Bu rüya tutar mı?",
  },
  {
    id: "oglak-kova",
    sign1Id: "capricorn",
    sign2Id: "aquarius",
    verdict: "GELENEK vs DEVRİM ⚙️",
    beats: [
      "Oğlak kuralları sever, Kova yıkar.",
      "Biri geçmişe, diğeri geleceğe bakar.",
      "Saygı olursa istikrar + vizyon doğar.",
    ],
    question: "Eski mi, yeni mi?",
  },
  // ─── Tur 8 ───────────────────────────────────────────────────────────────
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
    id: "ikizler-aslan",
    sign1Id: "gemini",
    sign2Id: "leo",
    verdict: "SAHNE IŞIĞI ✨",
    beats: [
      "Hava ateşi körükler — enerji ve cazibe.",
      "İkizler eğlendirir, Aslan parıldar.",
      "Sosyal, eğlenceli ve dikkat çeken bir çift.",
    ],
    question: "En karizmatik ikili mi?",
  },
  {
    id: "boga-basak",
    sign1Id: "taurus",
    sign2Id: "virgo",
    verdict: "SAĞLAM TEMEL 🧱",
    beats: [
      "İki toprak burcu — güven ve emek.",
      "Pratik, sadık, ayakları yere basan bir aşk.",
      "Tutku sakin ama bağ çok derin.",
    ],
    question: "İstikrar yeter mi?",
  },
  {
    id: "terazi-balik",
    sign1Id: "libra",
    sign2Id: "pisces",
    verdict: "ROMANTİK RÜYA 💭",
    beats: [
      "İkisi de aşka ve güzelliğe âşık.",
      "Hayalperest, nazik ve şefkatli.",
      "Ama ikisi de kararsız — gerçeklik zorlar.",
    ],
    question: "Bu rüya gerçek olur mu?",
  },
  {
    id: "akrep-kova",
    sign1Id: "scorpio",
    sign2Id: "aquarius",
    verdict: "İNATÇI GİZEM 🌌",
    beats: [
      "İki sabit burç — ikisi de inatçı.",
      "Akrep duygusal derinlik, Kova özgürlük ister.",
      "Anlaşırlarsa eşsiz, yoksa duvar örerler.",
    ],
    question: "Bu zıtlık çözülür mü?",
  },
  {
    id: "yay-oglak",
    sign1Id: "sagittarius",
    sign2Id: "capricorn",
    verdict: "MACERA vs HEDEF 🎯",
    beats: [
      "Yay özgür, Oğlak disiplinli.",
      "Biri keşfeder, diğeri kurar.",
      "Dengelerlerse hayalleri gerçeğe çevirirler.",
    ],
    question: "Hayal mi, plan mı?",
  },
  // ─── Tur 9 ───────────────────────────────────────────────────────────────
  {
    id: "koc-ikizler",
    sign1Id: "aries",
    sign2Id: "gemini",
    verdict: "DURMAK YOK 🚀",
    beats: [
      "Ateş ve hava — enerji ikiye katlanır.",
      "Sürekli hareket, sürekli yeni fikir.",
      "Eğlence biter mi? Asla — ama derinlik ister.",
    ],
    question: "Bu tempoya kim yetişir?",
  },
  {
    id: "boga-yengec",
    sign1Id: "taurus",
    sign2Id: "cancer",
    verdict: "YUVA KURAR 🏡",
    beats: [
      "Toprak ve su — besleyici ve sıcak.",
      "İkisi de güven, sadakat ve huzur ister.",
      "Sessiz ama en sağlam aşklardan.",
    ],
    question: "Huzur mu, heyecan mı?",
  },
  {
    id: "aslan-balik",
    sign1Id: "leo",
    sign2Id: "pisces",
    verdict: "GÖSTERİŞ vs HAYAL 🎭",
    beats: [
      "Aslan ışığı sever, Balık gölgede hayal kurar.",
      "Biri güçlü, diğeri narin.",
      "Aslan korur, Balık ilham verir.",
    ],
    question: "Bu ikili dengelenir mi?",
  },
  {
    id: "basak-kova",
    sign1Id: "virgo",
    sign2Id: "aquarius",
    verdict: "MANTIK vs VİZYON 🔬",
    beats: [
      "İkisi de zekâya âşık ama farklı yönde.",
      "Başak detay, Kova devrim ister.",
      "Saygı olursa ilham verici bir ikili.",
    ],
    question: "Detay mı, vizyon mu?",
  },
  {
    id: "terazi-oglak",
    sign1Id: "libra",
    sign2Id: "capricorn",
    verdict: "ZARAFET vs DİSİPLİN 🏛️",
    beats: [
      "Terazi uyum, Oğlak başarı ister.",
      "Biri sosyal, diğeri çalışkan.",
      "Hedefler birleşirse güçlü bir ortaklık.",
    ],
    question: "Aşk mı, kariyer mi?",
  },
  {
    id: "akrep-yay",
    sign1Id: "scorpio",
    sign2Id: "sagittarius",
    verdict: "DERİN vs ÖZGÜR 🏹",
    beats: [
      "Akrep yoğun, Yay özgür ruh.",
      "Biri sahiplenir, diğeri kanat ister.",
      "Çekim güçlü ama güven savaşı çıkar.",
    ],
    question: "Bu ikili bağlanır mı?",
  },
  // ─── Tur 10 ──────────────────────────────────────────────────────────────
  {
    id: "koc-boga",
    sign1Id: "aries",
    sign2Id: "taurus",
    verdict: "ÇEKİCİ İNAT 🐂",
    beats: [
      "Ateş ve toprak — biri hızlı, biri sabit.",
      "Koç iter, Boğa yerinden kıpırdamaz.",
      "Sabırla buluşursa tutku istikrara döner.",
    ],
    question: "Hız mı, sabır mı?",
  },
  {
    id: "ikizler-balik",
    sign1Id: "gemini",
    sign2Id: "pisces",
    verdict: "DEĞİŞKEN RUHLAR 🌫️",
    beats: [
      "İki değişken burç — ikisi de akışkan.",
      "Hayal gücü ve merak ortak.",
      "Ama ikisi de kararsız — yön bulmak zor.",
    ],
    question: "Bu ikili karar verebilir mi?",
  },
  {
    id: "yengec-kova",
    sign1Id: "cancer",
    sign2Id: "aquarius",
    verdict: "SICAK vs SOĞUK ❄️",
    beats: [
      "Yengeç duygusal, Kova mesafeli.",
      "Biri yakınlık ister, diğeri özgürlük.",
      "Zıt ihtiyaçlar — köprü kurmak emek ister.",
    ],
    question: "Bu mesafe kapanır mı?",
  },
  {
    id: "aslan-oglak",
    sign1Id: "leo",
    sign2Id: "capricorn",
    verdict: "TAHT KAVGASI 👑",
    beats: [
      "İki güç odaklı burç — ikisi de zirve ister.",
      "Aslan gösterir, Oğlak sessizce kurar.",
      "Hedef birleşirse imparatorluk kurarlar.",
    ],
    question: "Kim hükmeder?",
  },
  {
    id: "basak-yay",
    sign1Id: "virgo",
    sign2Id: "sagittarius",
    verdict: "PLAN vs ÖZGÜRLÜK 🗺️",
    beats: [
      "Başak planlar, Yay spontane yaşar.",
      "Biri detay, diğeri büyük resim.",
      "Tamamlarlarsa harika, yoksa yorarlar.",
    ],
    question: "Kim haklı çıkar?",
  },
  {
    id: "terazi-akrep",
    sign1Id: "libra",
    sign2Id: "scorpio",
    verdict: "ÇEKİM ve GİZEM 🖤",
    beats: [
      "Terazi cazibeli, Akrep tutkulu.",
      "Biri yüzeyde dans eder, diğeri derine çeker.",
      "Manyetik ama kıskançlık sınar.",
    ],
    question: "Bu çekim tehlikeli mi?",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
export function getCompatibilityById(id: string): Compatibility | undefined {
  return ZODIAC_COMPATIBILITY.find((c) => c.id === id);
}
