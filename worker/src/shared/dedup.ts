// ═══════════════════════════════════════════════════════════════════════════
// src/publish/dedup.ts — platform-nötr MÜKERRER (dedup) çekirdeği (SAF, PAYLAŞILAN)
//
// Node'a bağlı import YOK → Node script'leri (scripts/uploadGuards.ts buradan
// re-export eder → YT/IG yolları değişmez) VE Cloudflare Worker aynı fonksiyonu
// kullanır. TEK KAYNAK → drift yok.
//
// Durumsuz "platform kayıt defteri" mantığı: state hiçbir yerde tutulmaz sayıltısı
// YT/IG'de platformun kendisidir (son N yükleme). TikTok panelinde ise kayıt
// KV'deki kendi publish geçmişimizdir (line1 + timestamp) — fonksiyon generic,
// yalnız `recent` besleme kaynağı değişir.
//
// Anahtar: deterministik başlık/caption satır-1 + zaman penceresi.
// ═══════════════════════════════════════════════════════════════════════════

export const DEDUP_WINDOW_HOURS = 20;

export interface RecentUpload {
  title?: string | null; // YT: video başlığı · TikTok: caption satır-1 (line1)
  publishedAt?: string | null; // ISO 8601
}

/**
 * Bu başlık/anahtar pencere içinde zaten yüklenmiş mi?
 *
 * Pencere MUTLAK farkla ölçülür (`Math.abs`): YT yüklemelerimiz `private` +
 * `publishAt` ile ZAMANLI çıkıyor, dolayısıyla publishedAt GELECEKTE olabilir.
 * İşaretli fark kullanılsaydı "az önce yükledim ama yayını 6 saat sonra"
 * durumu pencere dışına düşer ve çift yükleme kapıyı geçerdi.
 */
export function isDuplicateUpload(
  title: string,
  recent: RecentUpload[],
  nowMs: number,
  windowHours: number = DEDUP_WINDOW_HOURS,
): boolean {
  const key = title.trim();
  if (!key) return false;
  const windowMs = windowHours * 3600 * 1000;
  return recent.some((v) => {
    if (!v.title || !v.publishedAt) return false;
    if (v.title.trim() !== key) return false;
    const delta = Math.abs(nowMs - new Date(v.publishedAt).getTime());
    return Number.isFinite(delta) && delta < windowMs;
  });
}
