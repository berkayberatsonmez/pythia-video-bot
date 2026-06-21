// ═══════════════════════════════════════════════════════════════════════════
// Pythia — Burç Davranış Senaryoları (en paylaşılan viral format)
//
// Format: "BİR [BURÇ] [senaryo]" → ne yapar? → 3 beat → "yaşadın mı?"
// Amaç: ilişkilenebilirlik + paylaşım ("aynen ex'im 😭" → arkadaşa gönderir).
// İnanç gerektirmez = soğuk kitleyi de çeker. signId → zodiac-signs.ts glyph.
// ═══════════════════════════════════════════════════════════════════════════

export type Behavior = {
  id: string;
  signId: string;
  scenario: string; // "seni sildiğinde" → hook: "BİR AKREP seni sildiğinde"
  beats: [string, string, string]; // 3 davranış (sonuncu = vurucu/twist)
  question: string;
};

export const ZODIAC_BEHAVIORS: Behavior[] = [
  {
    id: "akrep-silince",
    signId: "scorpio",
    scenario: "seni sildiğinde",
    beats: [
      "Sessizce profilini izlemeye devam eder.",
      "Hiçbir şey olmamış gibi davranır.",
      "Ama o silme kalıcıdır, geri dönüşü yoktur.",
    ],
    question: "Bir Akrep'le yaşadın mı?",
  },
  {
    id: "ikizler-cevapsiz",
    signId: "gemini",
    scenario: "3 gün cevap yazmadığında",
    beats: [
      "Kafası bambaşka bir şeye takılmıştır.",
      "Seni unutmadı, sadece dağıldı.",
      "Bir anda 'naber' diye geri döner.",
    ],
    question: "Seni en çok hangi burç yaktı?",
  },
  {
    id: "boga-iyiyim",
    signId: "taurus",
    scenario: "'iyiyim' dediğinde",
    beats: [
      "Kesinlikle iyi değildir.",
      "İçine atar, belli etmez.",
      "Bir patladı mı geri dönüşü olmaz.",
    ],
    question: "Sen 'iyiyim' deyince iyi misin?",
  },
  {
    id: "koc-asik",
    signId: "aries",
    scenario: "sana aşık olduğunda",
    beats: [
      "Dünyayı ayağına getirir.",
      "Ama çok kolay olursan sıkılır.",
      "Hafif bir mesafe onu deli eder.",
    ],
    question: "Bir Koç'a aşık oldun mu?",
  },
  {
    id: "aslan-kirilinca",
    signId: "leo",
    scenario: "kalbi kırıldığında",
    beats: [
      "Gururundan asla belli etmez.",
      "İçten içe yıkılmıştır.",
      "Tek bir samimi özür her şeyi çözer.",
    ],
    question: "Bir Aslan'ı kırdın mı?",
  },
  {
    id: "yengec-kusunce",
    signId: "cancer",
    scenario: "sana küstüğünde",
    beats: [
      "Kabuğuna çekilir, sessizleşir.",
      "Eski güzel günleri düşünür.",
      "Aslında barışmak için bahane arar.",
    ],
    question: "Yengeç burcu tanıyor musun?",
  },
  {
    id: "basak-sevince",
    signId: "virgo",
    scenario: "seni sevdiğinde",
    beats: [
      "En küçük detayını bile hatırlar.",
      "Hayatını düzene sokmaya çalışır.",
      "O eleştiri aslında ilgisinin kanıtı.",
    ],
    question: "Bir Başak seni sevdi mi?",
  },
  {
    id: "yay-sikilinca",
    signId: "sagittarius",
    scenario: "sıkıldığında",
    beats: [
      "Bir anda ortadan kaybolur.",
      "Yeni bir maceranın peşine düşer.",
      "Özgürlüğüne saygı duyarsan asla gitmez.",
    ],
    question: "Bir Yay seni ekti mi?",
  },
  {
    id: "oglak-sevince",
    signId: "capricorn",
    scenario: "birini sevdiğinde",
    beats: [
      "Belli etmez, mesafeli durur.",
      "Ama sessizce sizin geleceğinizi kurar.",
      "Sözünden asla dönmez.",
    ],
    question: "Oğlak soğuk mu, temkinli mi?",
  },
  {
    id: "kova-uzaklasinca",
    signId: "aquarius",
    scenario: "uzaklaştığında",
    beats: [
      "Alan ister, boğulmaktan kaçar.",
      "Soğuk değil, sadece özgür.",
      "Zihnen bağlandıysa asla gitmez.",
    ],
    question: "Bir Kova'yı çözebildin mi?",
  },
  {
    id: "balik-asik",
    signId: "pisces",
    scenario: "aşık olduğunda",
    beats: [
      "Seni olduğundan güzel hayal eder.",
      "Tüm dünyası sen olursun.",
      "Ama hayal kırıklığını kaldıramaz.",
    ],
    question: "Bir Balık'a aşık oldun mu?",
  },
  {
    id: "akrep-asik",
    signId: "scorpio",
    scenario: "sana aşık olduğunda",
    beats: [
      "Seni baştan aşağı okur, her şeyini bilir.",
      "Ya hep ya hiç sever, arası yoktur.",
      "Güvenini bir kez kır, o defter kapanır.",
    ],
    question: "Akrep aşkı yaşadın mı?",
  },
  {
    id: "terazi-kararsiz",
    signId: "libra",
    scenario: "karar veremediğinde",
    beats: [
      "Herkese tek tek danışır.",
      "Yine de kararsız kalır.",
      "Sonunda içgüdüsünün dediğini yapar.",
    ],
    question: "Sen de mi kararsızsın?",
  },
  {
    id: "ikizler-asik",
    signId: "gemini",
    scenario: "sana aşık olduğunda",
    beats: [
      "Saatlerce konuşur, zihnini sever.",
      "Seni güldürmek en büyük dili.",
      "Ama sıkıcı gelirsen ilgisi uçar.",
    ],
    question: "Bir İkizler'i elinde tutabildin mi?",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
export function getBehaviorById(id: string): Behavior | undefined {
  return ZODIAC_BEHAVIORS.find((b) => b.id === id);
}
