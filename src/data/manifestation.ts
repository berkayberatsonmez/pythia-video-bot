// ═══════════════════════════════════════════════════════════════════════════
// Pythia — Manifesto Veritabanı
//
// App özelliğiyle birebir: "Niyetini yaz → Pythia güçlü bir manifestoya
// dönüştürür → her gün OKUYARAK gerçeğe çağır."
//
// Bu videolar okunacak/söylenecek temalı manifestolardır (teknik değil).
// Format: "HER SABAH BUNU OKU" → satır satır beliren manifesto → CTA
// ═══════════════════════════════════════════════════════════════════════════

export type Manifesto = {
  id: string;
  theme: string; // "ÖZGÜVEN"
  themeSub: string; // "kendine inan"
  prompt: string; // Hook üst yazısı: "HER SABAH BUNU OKU" vb.
  lines: string[]; // Okunacak güçlü olumlama satırları (4)
  hashtag: string;
};

export const MANIFESTATIONS: Manifesto[] = [
  {
    id: "confidence",
    theme: "ÖZGÜVEN",
    themeSub: "kendine inan",
    prompt: "HER SABAH BUNU OKU",
    lines: [
      "Ben yeterliyim.",
      "Olduğum gibi değerliyim.",
      "Kendime güveniyorum.",
      "Hak ettiğim hayatı yaşıyorum.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "abundance",
    theme: "BOLLUK",
    themeSub: "bereketi çağır",
    prompt: "BU MANİFESTOYU SÖYLE",
    lines: [
      "Bolluk benim doğal halim.",
      "Para bana kolayca akıyor.",
      "Fırsatlar beni buluyor.",
      "Refaha sonuna kadar açığım.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "love",
    theme: "AŞK",
    themeSub: "sevgiye açıl",
    prompt: "BUNU YÜKSEK SESLE OKU",
    lines: [
      "Sevgiye layığım.",
      "Kalbim doğru kişiye açık.",
      "Sevgiyi hem verir hem alırım.",
      "Aşk bana doğru akıyor.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "peace",
    theme: "HUZUR",
    themeSub: "içine dön",
    prompt: "BU GECE BUNU OKU",
    lines: [
      "İçimde derin bir huzur var.",
      "Her şey olması gerektiği gibi.",
      "Kontrol edemediğimi bırakıyorum.",
      "Bu an bana yeter.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "success",
    theme: "BAŞARI",
    themeSub: "hedefine yürü",
    prompt: "HER SABAH KENDİNE SÖYLE",
    lines: [
      "Hedeflerime adım adım ulaşıyorum.",
      "Her gün daha güçlüyüm.",
      "Engeller beni durduramaz.",
      "Başarı benim hakkım.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "healing",
    theme: "ŞİFA",
    themeSub: "kendinle barış",
    prompt: "BU MANİFESTOYU TEKRARLA",
    lines: [
      "Bedenim ve ruhum iyileşiyor.",
      "Her nefes bana şifa veriyor.",
      "Geçmişin yükünü bırakıyorum.",
      "Kendimle barışığım.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "selflove",
    theme: "ÖZ-SEVGİ",
    themeSub: "kendini sev",
    prompt: "AYNAYA BAKIP OKU",
    lines: [
      "Kendimi koşulsuz seviyorum.",
      "Kusurlarımla bir bütünüm.",
      "Kendime nazik davranıyorum.",
      "Ben kendi evimim.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "release-fear",
    theme: "KORKUYU BIRAK",
    themeSub: "cesareti seç",
    prompt: "ZOR ANINDA BUNU OKU",
    lines: [
      "Korkularımı serbest bırakıyorum.",
      "Cesaret zaten içimde.",
      "Bilinmeyene güveniyorum.",
      "Korkuyu değil, sevgiyi seçiyorum.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "morning",
    theme: "SABAH NİYETİ",
    themeSub: "güne güçlü başla",
    prompt: "UYANINCA İLK BUNU OKU",
    lines: [
      "Bugün harika bir gün.",
      "Enerjim yüksek, niyetim net.",
      "Bugün bana iyilik getiriyor.",
      "Her şeye hazırım.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "gratitude",
    theme: "ŞÜKÜR",
    themeSub: "minnetle uyu",
    prompt: "UYUMADAN ÖNCE OKU",
    lines: [
      "Bugün için minnettarım.",
      "Yaşadıklarım beni büyüttü.",
      "Huzurla uykuya dalıyorum.",
      "Yarına umutla bakıyorum.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "protection",
    theme: "KORUNMA",
    themeSub: "güvende hisset",
    prompt: "ZOR GÜNDE BUNU OKU",
    lines: [
      "Güvendeyim, korunuyorum.",
      "Negatif enerji bana işlemez.",
      "Etrafımı ışık sarıyor.",
      "Hiçbir şey huzurumu bozamaz.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "newbeginning",
    theme: "YENİ BAŞLANGIÇ",
    themeSub: "sayfayı çevir",
    prompt: "YENİ BİR DÖNEMDE OKU",
    lines: [
      "Geçmişi geride bırakıyorum.",
      "Yeni bir sayfa açılıyor.",
      "Her gün taze bir başlangıç.",
      "En güzeli daha gelmedi.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "courage",
    theme: "CESARET",
    themeSub: "korkunu yen",
    prompt: "KARAR ÖNCESİ OKU",
    lines: [
      "Korkularım beni durduramaz.",
      "Cesaret zaten içimde.",
      "Risk almaya hazırım.",
      "Adımı atıyorum, ilerliyorum.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "attraction",
    theme: "ÇEKİM",
    themeSub: "istediğini çek",
    prompt: "HER SABAH SÖYLE",
    lines: [
      "İstediğim her şeyi çekiyorum.",
      "Evren benden yana çalışıyor.",
      "Fırsatlar bana akıyor.",
      "Hak ettiğim bana geliyor.",
    ],
    hashtag: "#manifesto",
  },
  {
    id: "forgiveness",
    theme: "AFFETME",
    themeSub: "yükünü bırak",
    prompt: "İÇİN AĞIRSA OKU",
    lines: [
      "Kendimi affediyorum.",
      "Geçmişin yükünü bırakıyorum.",
      "Kin tutmak bana zarar verir.",
      "Hafiflemeyi seçiyorum.",
    ],
    hashtag: "#manifesto",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
export function getManifestById(id: string): Manifesto | undefined {
  return MANIFESTATIONS.find((m) => m.id === id);
}

export function getTodaysManifest(): Manifesto {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return MANIFESTATIONS[dayOfYear % MANIFESTATIONS.length];
}
