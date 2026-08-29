// ═══════════════════════════════════════════════════════════════════════════
// reply-comments.ts — Instagram yorumlarına otomatik yanıt
//
// Akış (graph.instagram.com, upload-instagram.ts ile aynı token):
//   1) GET /me                   → kendi username'imiz
//   2) GET /me/media             → son N gönderi (caption ile)
//   3) GET /{media}/comments     → yorumlar + mevcut yanıtlar
//   4) POST /{comment}/replies   → uygun olanlara yanıt
//
// DEDUP DURUMSUZ: yorumun replies listesinde kendi username'imiz varsa atlanır.
// Dosya/KV tutmuyoruz → Actions cache'i ya da geri commit gerekmiyor.
//
// İZİN: kendi medyamıza yorum atabildiğimiz için token'da
// instagram_business_manage_comments zaten var. YENİ İZİN GEREKMİYOR.
//
// Kullanım:
//   tsx scripts/reply-comments.ts --dry   → hiçbir şey göndermez, ne yapacağını yazar
//   tsx scripts/reply-comments.ts         → gerçekten yanıtlar
// ═══════════════════════════════════════════════════════════════════════════

const IG_BASE = "https://graph.instagram.com";

// ─── Ayarlar ──────────────────────────────────────────────────────────────
// Instagram Login API'de "tüm medyadaki son yorumlar" diye tek bir uç YOK.
// Gönderi gönderi dolaşmak zorundayız → son N gönderiyi tarıyoruz.
// Günde ~2 paylaşımda 40 gönderi ≈ son 3 hafta. Daha eskisine yorum gelirse
// kaçar; gerçek zamanlı istiyorsak Meta webhook'u gerekir (bkz. dosya sonu).
const MEDIA_SCAN = 40; // kaç gönderi taransın (sayfalama ile)
const MEDIA_PAGE = 25; // /me/media sayfa boyutu
const COMMENT_PAGES = 4; // gönderi başına en fazla kaç yorum sayfası çekilsin
const MAX_COMMENT_AGE_DAYS = 30; // bundan eski yorumlara yanıt verilmez
const MAX_PER_MEDIA = 6; // gönderi başına en fazla kaç yanıt
const MAX_TOTAL = 20; // bir çalıştırmada toplam en fazla kaç yanıt
const MIN_LEN = 12; // bundan kısa yorumlar atlanır (soru işareti varsa yine cevaplanır)
const DELAY_MS = 4000; // yanıtlar arası bekleme — hız sınırı + doğal ritim

// Bu ifadeler geçen yoruma BOT DOKUNMAZ; elle cevaplanmalı.
// Acı/hassas içerik ya da şikayet altına uygulama linki koymak markaya zarar verir.
const SKIP_PATTERNS = [
  "ayrıld", "ayrild", "boşan", "bosan", "terk et", "aldat",
  "öldü", "ölüm", "vefat", "cenaze", "kaybettim", "rahmetli",
  "hastay", "hastane", "kanser", "ameliyat", "tedavi",
  "depresyon", "intihar", "psikolog", "panik atak",
  "dolandır", "para iade", "çalışmıyor", "calismiyor",
  "hata veriyor", "açılmıyor", "acilmiyor", "şikayet", "sikayet",
];

// ─── Yanıt havuzları (gönderi kategorisine göre) ──────────────────────────
// Aynı metni tekrar tekrar göndermek Meta'nın spam tespitine takılır: yorumlar
// gizlenir, hesap geçici aksiyon bloğu yiyebilir. Bu yüzden her kategoride
// birden fazla varyant var; yorum id'sine göre deterministik seçiliyor.
const POOLS: Record<string, string[]> = {
  compat: [
    "Bu ikili gerçekten çok konuşuluyor 😄 Uyum tek bir puana sığmıyor aslında — aşk, iletişim ve tutku ayrı ayrı işliyor. Pythia'da iki burcu seçince üçünü de ayrı görüyorsun. Profildeki linkten ücretsiz ✨",
    "Kendi ikilinize de bakmak isterseniz Pythia'da aşk, iletişim ve tutku puanlarınız ayrı ayrı çıkıyor 🌙 Profildeki linkten ücretsiz ✨",
    "Uyumun tek bir cevabı yok, karşı burca göre tamamen değişiyor 🌙 Pythia'da iki burcu seçiyorsun, sonucu kart olarak da paylaşabiliyorsun. Profildeki link ✨",
    "Çatışma her zaman uyumsuzluk değil, bazen ikisinin de aynı derecede inatçı olması demek 😄 Pythia'da ikilinizin puanına bakabilirsiniz — profildeki link ✨",
    "Tabloda zor görünen ikililer çoğu zaman en sağlam yürüyenler oluyor 🌙 Pythia'da aşk, iletişim ve tutku puanlarınızı ayrı ayrı görebilirsiniz. Profildeki link ✨",
  ],
  dream: [
    "Aynı sembol herkeste aynı şeye gelmiyor — rüyanın geri kalanı ve uyandığındaki his çok şey değiştiriyor 🌙 Rüyanı kendi cümlelerinle yazarsan Pythia sana özel yorumluyor. Profildeki linkten ücretsiz ✨",
    "Sembolün anlamı rüyanın bütününe göre değişiyor 🌙 Rüyanı yazarsan Pythia hazır sözlükten değil, senin yazdığına özel yorumluyor. Profildeki link ✨",
    "Bunu doğru yorumlamak için rüyanın tamamını görmek gerekiyor 🌙 Pythia'ya yazarsan sembolleri ve duygusal tonu birlikte değerlendiriyor. Profildeki linkten ücretsiz ✨",
    "Tekrar eden rüyalar genelde tek tek bakıldığında değil, birikince anlam kazanıyor 🌙 Pythia rüya günlüğünde tekrarlayan sembolleri çıkarıyor. Profildeki link ✨",
  ],
  tarot: [
    "Kartın anlamı sorduğun soruya göre değişiyor 🔮 Pythia'da günün kartını çekip kendi sorunla yorumlatabilirsin — profildeki linkten ücretsiz ✨",
    "Tek kart mı üç kart mı çektiğin de sonucu değiştiriyor 🔮 Pythia'da geçmiş–şu an–gelecek açılımı var. Profildeki link ✨",
    "Her sabah günün kartı otomatik geliyor 🔮 Kendi kartına bakmak istersen profildeki linkten Pythia'ya göz atabilirsin ✨",
  ],
  number: [
    "Yaşam yolu sayın doğum tarihinden çıkıyor 🔢 Pythia'da kendi sayını hesaplayıp ne anlama geldiğini okuyabilirsin — profildeki link ✨",
    "Sayılar tek başına değil, üçü birlikte anlam kazanıyor: yaşam yolu, ifade ve ruh sayısı 🔢 Pythia'da üçünü de görebilirsin. Profildeki linkten ücretsiz ✨",
    "Kendi haritana bakmak istersen Pythia adın ve doğum tarihinle hesaplıyor 🔢 Profildeki link ✨",
  ],
  zodiac: [
    "Burcunun günlük yorumunu her sabah Pythia'dan okuyabilirsin 🌙 Aşk ve kariyer için ayrı ayrı da var. Profildeki linkten ücretsiz ✨",
    "Bu özellikler yükselen ve diğer etkilerle de değişiyor 🌙 Kendi burcunun günlük yorumu için profildeki linkten Pythia'ya bakabilirsin ✨",
    "Burcuna özel günlük ve haftalık yorumlar Pythia'da 🌙 Profildeki linkten ücretsiz ✨",
  ],
  general: [
    "Kendine özel yorumu Pythia'da bulabilirsin 🌙 Profildeki linkten ücretsiz deneyebilirsin ✨",
    "Buna benzer içerikler ve sana özel yorumlar Pythia'da 🌙 Profildeki link ✨",
    "Merak ettiysen Pythia'da kendine özel olanına bakabilirsin 🌙 Profildeki linkten ücretsiz ✨",
  ],
};

// ─── API yardımcıları ─────────────────────────────────────────────────────
function token(): string {
  const t = (process.env.IG_ACCESS_TOKEN || "").replace(/^﻿/, "").trim();
  if (!t) throw new Error("IG_ACCESS_TOKEN env değişkeni tanımlı değil!");
  return t;
}

async function igGet(path: string, params: Record<string, string> = {}): Promise<any> {
  const qs = new URLSearchParams({ ...params, access_token: token() });
  const res = await fetch(`${IG_BASE}/${path}?${qs}`);
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json?.error) {
    throw new Error(`IG GET ${path} → ${JSON.stringify(json?.error ?? json)}`);
  }
  return json;
}

async function igPost(path: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams({ ...params, access_token: token() });
  const res = await fetch(`${IG_BASE}/${path}`, { method: "POST", body });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json?.error) {
    throw new Error(`IG POST ${path} → ${JSON.stringify(json?.error ?? json)}`);
  }
  return json;
}

/**
 * Sayfalı GET — paging.next zincirini takip eder.
 * Yorumlar tek sayfaya sığmayabiliyor; ilk sayfayla yetinirsek çok yorumlu
 * gönderilerde yeni yorumları kaçırırız.
 */
async function igGetAll(
  path: string,
  params: Record<string, string>,
  maxPages: number,
  maxItems: number,
): Promise<any[]> {
  const out: any[] = [];
  let url = `${IG_BASE}/${path}?${new URLSearchParams({ ...params, access_token: token() })}`;

  for (let page = 0; page < maxPages && url && out.length < maxItems; page++) {
    const res = await fetch(url);
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json?.error) {
      throw new Error(`IG GET ${path} → ${JSON.stringify(json?.error ?? json)}`);
    }
    out.push(...(json.data ?? []));
    url = json.paging?.next ?? "";
  }
  return out.slice(0, maxItems);
}

// ─── Saf yardımcılar ──────────────────────────────────────────────────────
/** Türkçe'ye uygun küçültme (İ→i, I→ı). */
function lower(s: string): string {
  return s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();
}

/** Caption'daki etiketlerden gönderi kategorisini çıkarır (metadata.ts ile uyumlu). */
function detectPool(caption: string): string {
  const c = lower(caption);
  if (c.includes("#burçuyumu") || c.includes("#burcuyumu")) return "compat";
  if (c.includes("#rüyatabiri") || c.includes("#rüyayorumu") || c.includes("#ruyatabiri")) return "dream";
  if (c.includes("#tarot")) return "tarot";
  if (c.includes("#numeroloji") || c.includes("#yaşamyolu") || c.includes("#meleksayıları")) return "number";
  if (c.includes("#burç") || c.includes("#astroloji")) return "zodiac";
  return "general";
}

/** Yorum id'sinden deterministik varyant seçer → aynı yorum hep aynı cevabı alır. */
function pick(pool: string[], seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

/** Atlanmalıysa sebebi, atlanmayacaksa null döner. */
function shouldSkip(text: string): string | null {
  const t = lower(text);
  for (const p of SKIP_PATTERNS) {
    if (t.includes(p)) return `hassas/şikayet ifadesi ("${p}")`;
  }
  const letters = text.replace(/[^\p{L}\p{N}]/gu, "");
  if (letters.length < MIN_LEN && !text.includes("?")) return "çok kısa";
  return null;
}

/** Çok eski yorumlara yanıt vermek tuhaf duruyor — yaş sınırı. */
function tooOld(timestamp: string): boolean {
  const t = Date.parse(timestamp || "");
  if (!t) return false; // tarih okunamadıysa engelleme
  return Date.now() - t > MAX_COMMENT_AGE_DAYS * 86400000;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Ana akış ─────────────────────────────────────────────────────────────
async function run(dry: boolean): Promise<void> {
  const me = await igGet("me", { fields: "id,username" });
  const myName = String(me.username || "");
  console.log(`👤 Hesap: @${myName}${dry ? "   (DRY RUN — hiçbir şey gönderilmeyecek)" : ""}`);

  const media = await igGetAll(
    "me/media",
    { fields: "id,caption,timestamp,permalink", limit: String(MEDIA_PAGE) },
    Math.ceil(MEDIA_SCAN / MEDIA_PAGE),
    MEDIA_SCAN,
  );
  console.log(`📚 Taranacak gönderi: ${media.length} (en yeniden geriye)`);

  let total = 0;
  let skipped = 0;

  for (const m of media) {
    if (total >= MAX_TOTAL) break;

    const poolName = detectPool(String(m.caption || ""));
    const pool = POOLS[poolName] ?? POOLS.general;

    let comments: any[];
    try {
      comments = await igGetAll(
        `${m.id}/comments`,
        { fields: "id,text,username,timestamp,replies{id,username}", limit: "50" },
        COMMENT_PAGES,
        COMMENT_PAGES * 50,
      );
    } catch (e) {
      console.log(`  ⚠️  ${m.id} yorumları okunamadı: ${e}`);
      continue;
    }

    if (comments.length === 0) continue; // yorumsuz gönderiler logu şişirmesin
    console.log(`\n📸 ${m.id} [${poolName}] — ${comments.length} yorum`);

    let perMedia = 0;
    for (const c of comments) {
      if (total >= MAX_TOTAL || perMedia >= MAX_PER_MEDIA) break;

      const text = String(c.text || "");
      const user = String(c.username || "");

      if (user === myName) continue; // kendi ilk yorumumuz (hashtag/CTA)
      if (tooOld(String(c.timestamp || ""))) continue; // aylık geçmiş yoruma yanıt tuhaf durur

      const alreadyReplied = (c.replies?.data ?? []).some(
        (r: any) => String(r.username || "") === myName,
      );
      if (alreadyReplied) continue;

      const skip = shouldSkip(text);
      if (skip) {
        skipped++;
        console.log(`  ⏭️  @${user}: ${skip} → "${text.slice(0, 40)}"`);
        continue;
      }

      const message = pick(pool, String(c.id));

      if (dry) {
        console.log(`  💬 @${user}: "${text.slice(0, 45)}"`);
        console.log(`     ↳ ${message.slice(0, 72)}…`);
      } else {
        try {
          await igPost(`${c.id}/replies`, { message });
          console.log(`  ✅ @${user} yanıtlandı`);
        } catch (e) {
          console.log(`  ❌ @${user} yanıtlanamadı: ${e}`);
          continue;
        }
        await sleep(DELAY_MS);
      }
      perMedia++;
      total++;
    }
  }

  console.log(`\n🎯 ${dry ? "Gönderilecek" : "Gönderilen"} yanıt: ${total} · elle bırakılan: ${skipped}`);
}

if (require.main === module) {
  run(process.argv.includes("--dry")).catch((e) => {
    console.error("💥 Yorum yanıtlama hatası:", e);
    process.exit(1);
  });
}
