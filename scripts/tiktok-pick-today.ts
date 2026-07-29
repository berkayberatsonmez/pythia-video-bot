// ═══════════════════════════════════════════════════════════════════════════
// tiktok-pick-today.ts — Bugünün TikTok klibini rotasyondan DETERMİNİSTİK seç.
//
// getTodaysVideos()[0] (sabah pick) gün-numarasından türer (rotation.ts):
// aynı gün → aynı klip, ertesi gün → dizideki sonraki. RNG yok, state yok.
// tiktok-auto.yml bunu çağırıp JSON çıktısını GITHUB_OUTPUT'a parse eder.
//
// ⚠️ NOT (audit sonrası): getTodaysVideos()[0] IG/YT sabah slotuyla AYNI klip →
//    cross-platform aynı dosya parmak izi (shadowban tetiği #2). Audit'te post
//    SELF_ONLY olduğu için önemsiz; public'e geçince TikTok'a ayrı bir index
//    offset'i ver (farklı klip). Şimdilik demo/audit için sabah pick yeterli.
// ═══════════════════════════════════════════════════════════════════════════

import { getTodaysVideos } from "./rotation";

const v = getTodaysVideos()[0];
process.stdout.write(
  JSON.stringify({ comp: v.comp, propKey: v.propKey, category: v.category, id: v.id }),
);
