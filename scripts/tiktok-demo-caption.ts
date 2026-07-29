// ═══════════════════════════════════════════════════════════════════════════
// tiktok-demo-caption.ts — MİNİMAL demo caption (audit submit için, PRIVATE post)
//
// ⚠️ Bu SADECE demo/audit hattını açmak için. Native TikTok caption (bio-link'siz,
//    3-5 TikTok-yerli tag, kategori-özel) SONRAKİ iş — burada YOK. Demo post
//    SELF_ONLY/private olduğu için içerik kalitesi/shadowban ÖNEMSİZ.
//
// IG/YT'nin buildInstagramCaption / buildMetadata'sına DOKUNMAZ — ayrı, küçük,
// bağımsız fonksiyon. Deterministik: aynı (category,id) → aynı caption + line1.
// ═══════════════════════════════════════════════════════════════════════════

export interface DemoCaption {
  caption: string; // TikTok post başlığı (Direct Post post_info.title)
  line1: string; // dedup anahtarı (Worker KV mükerrer koruması) — DETERMİNİSTİK
}

/**
 * (category, id) → basit demo caption + deterministik line1.
 * line1 tamamen (category,id)'den türetilir → dedup stabil, RNG yok.
 */
export function buildDemoCaption(category: string, id: string): DemoCaption {
  // line1: insan-okur ama deterministik; Worker dedup bunu title olarak kullanır.
  const line1 = `Pythia demo — ${category}/${id}`;
  const caption = `${line1}\n(audit demo · private)\n#pythia #mistik #fal`;
  return { caption, line1 };
}
