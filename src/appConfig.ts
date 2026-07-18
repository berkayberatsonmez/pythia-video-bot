// ═══════════════════════════════════════════════════════════════════════════
// appConfig.ts — Conveyor Sort tek kaynak yapılandırması (src + scripts ortak)
//
// Oyunla ilgili tüm sabitler BURADA. Kompozisyonlar (CTA kartı) ve metadata
// üreticileri buradan okur — mağaza linkini tek yerden değiştir.
// ═══════════════════════════════════════════════════════════════════════════

// Google Play paket adı. NOT: mağaza adı "Conveyor Sort" ama uygulama eski
// "Parcel Perfect" kaydının üzerine yayınlandı → paket adı bilinçli olarak
// com.bbs.parcelperfect (typo değil). storeUrl bundan türetilir.
export const PACKAGE_ID = "com.bbs.parcelperfect";

export const APP = {
  name: "Conveyor Sort",
  storeName: "Google Play",
  packageId: PACKAGE_ID,
  // Gerçek link: https://play.google.com/store/apps/details?id=<packageId>
  storeUrl: `https://play.google.com/store/apps/details?id=${PACKAGE_ID}`,
  // Kısa gösterim (CTA kartı + açıklama üstü)
  storeShort: "Google Play'de: Conveyor Sort",
} as const;

// Placeholder hâlâ dolu mu? (CTA + metadata uyarısı için)
export const STORE_URL_IS_PLACEHOLDER = PACKAGE_ID.includes("REPLACE");
