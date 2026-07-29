// ═══════════════════════════════════════════════════════════════════════════
// src/tiktok/privacy.ts — Direct Post gizlilik kararı (SAF, PAYLAŞILAN)
//
// AUDIT KİLİDİ: TikTok app'i audit onayı almadan önce her post SELF_ONLY (private)
// olmalı. Bu SAF fonksiyon UI seçimine GÜVENMEZ — AUDIT_MODE açıkken seçim ne
// olursa olsun SELF_ONLY'ye EZER (asıl kilit sunucu/Worker tarafında). Onay
// gelince tek değişiklik: AUDIT_MODE=false. (İleride verify:guards deseninde
// test edilebilir — saf, I/O yok.)
// ═══════════════════════════════════════════════════════════════════════════

export type TikTokPrivacy =
  | "SELF_ONLY" // yalnız ben (private)
  | "PUBLIC_TO_EVERYONE"
  | "MUTUAL_FOLLOW_FRIENDS"
  | "FOLLOWER_OF_CREATOR";

export const TIKTOK_PRIVACY_LEVELS: readonly TikTokPrivacy[] = [
  "SELF_ONLY",
  "PUBLIC_TO_EVERYONE",
  "MUTUAL_FOLLOW_FRIENDS",
  "FOLLOWER_OF_CREATOR",
];

/**
 * Nihai gizlilik seviyesini belirler.
 * - auditMode=true  → HER ZAMAN "SELF_ONLY" (seçimi yok say — audit kilidi).
 * - auditMode=false → geçerli bir seçim ise onu, değilse güvenli varsayılan "SELF_ONLY".
 *
 * NOT: gerçek dünyada `selected` ayrıca creator_info'nun döndürdüğü
 * privacy_level_options ile de sınırlanır (izin verilmeyen seviye seçilemez);
 * o kesişim çağıran tarafta yapılır, bu fonksiyon audit kilidi + varsayılanı verir.
 */
export function enforcePrivacy(
  selected: string | undefined,
  auditMode: boolean,
): TikTokPrivacy {
  if (auditMode) return "SELF_ONLY";
  return TIKTOK_PRIVACY_LEVELS.includes(selected as TikTokPrivacy)
    ? (selected as TikTokPrivacy)
    : "SELF_ONLY";
}
