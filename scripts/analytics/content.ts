// ═══════════════════════════════════════════════════════════════════════════
// analytics/content.ts — Yayın günlüğündeki "content" alanını üretir
//
//   format    = rotasyon havuzu (dream/tarot/zodiac/angel/numerology/manifest…)
//               → rapor "platform / format / slot" kırılımına dayanır
//   contentId = havuzdaki öğe id'si (the-tower, yilan, aslan…)
//   hook      = videonun açılış cümlesi (IG caption'ın ilk satırı)
//   title     = platformun başlığı (YT başlığı / IG ilk satır / TikTok line1)
//
// Yayın yolunda çağrıldığı için ASLA fırlatmaz: metadata üretilemezse
// kimlik alanlarıyla düşük ayrıntılı bir kayda iner.
// ═══════════════════════════════════════════════════════════════════════════

import {
  buildInstagramCaption,
  buildMetadata,
  buildTikTokMetadata,
} from "../metadata";
import { POOLS, type PoolKey } from "../rotation";
import type { Content, Platform } from "./ledger";

export type ContentContext = Partial<
  Pick<Content, "slot" | "hook" | "props" | "durationSec" | "format">
>;

/** (category, id) → havuz anahtarı. numerology/angel aynı "number" kategorisini paylaşır. */
export function poolKeyFor(category: string, id: string): string {
  if (category === "sky") return "sky";
  for (const [key, pool] of Object.entries(POOLS)) {
    if (pool.category === category && pool.ids.includes(id)) return key;
  }
  return category;
}

const firstLine = (s: string) => s.split("\n")[0].trim();

export function publicationContent(
  platform: Platform,
  category: string,
  id: string,
  context: ContentContext = {},
): Content {
  let format = category;
  let title = id;
  let hook: string | undefined;
  try {
    format = poolKeyFor(category, id) as PoolKey | string;
  } catch {
    /* havuz bulunamadı → kategori adı */
  }
  try {
    hook = firstLine(buildInstagramCaption(category, id));
    if (platform === "youtube") title = buildMetadata(category, id).title;
    else if (platform === "tiktok") title = buildTikTokMetadata(category, id).line1;
    else title = hook;
  } catch {
    /* metadata üretilemedi → title = id */
  }
  return {
    ...context,
    contentId: id,
    format: context.format || format,
    title,
    hook: context.hook || hook,
  };
}
