// ═══════════════════════════════════════════════════════════════════════════
// reply-comments.ts — Instagram yorumlarına otomatik yanıt
//
// DURUM (2026-10-28): Facebook Login rotasına geçildi; ESKİ "BEKLEMEDE" durumu bitti.
//
//   Eski sorun (2026-08-29): Instagram Login API'sinde (graph.instagram.com,
//   IG_ACCESS_TOKEN) Meta, Advanced Access olmadan başkalarının yorum METNİNİ
//   gizliyordu (comments_count geliyor ama /comments data:[] dönüyordu).
//   Advanced Access ise Tech Provider + business verification istiyor.
//
//   Çözüm: "Instagram API with Facebook Login". Instagram business hesabı bir
//   Facebook Sayfasına bağlı; Sayfa erişim token'ı ile graph.facebook.com
//   üzerinden okuma/yanıt yapılıyor. 2026-10-28 akşamı DOĞRULANDI:
//     GET /17841442281703919/media?fields=caption,comments_count,
//         comments{text,username,timestamp}   (v26.0)
//   → başkalarının yorum metinleri döndü.
//
//   Hesap: @pythiamystic, IG business id 17841442281703919 (gizli değil),
//   bağlı Facebook Sayfası 1399339156599999. Süresiz Sayfa token'ı GitHub
//   secret'ı IG_PAGE_TOKEN'dır (sahibi ekler).
//
//   ⚠️ Workflow cron'u HÂLÂ KAPALI. Bir insan `reply:dry` (workflow_dispatch,
//   dry=true) çıktısını kontrol edip onaylamadan açılmaz. Açmak için
//   reply-comments.yml'deki schedule bloğunun yorumunu kaldır.
//
// Akış (https://graph.facebook.com/v26.0, token: IG_PAGE_TOKEN):
//   1) GET /{ig-user-id}?fields=username       → kendi username'imiz
//   2) GET /{ig-user-id}/media                 → son N gönderi (caption ile)
//   3) GET /{media}/comments                   → yorumlar + mevcut yanıtlar
//   4) POST /{comment}/replies (message=...)   → uygun olanlara yanıt
//
// ENV: IG_PAGE_TOKEN (zorunlu) · IG_FB_USER_ID (isteğe bağlı,
//      varsayılan 17841442281703919)
//
// DEDUP DURUMSUZ: yorumun replies listesinde kendi username'imiz varsa atlanır.
// Dosya/KV tutmuyoruz → Actions cache'i ya da geri commit gerekmiyor.
//
// Kullanım:
//   tsx scripts/reply-comments.ts --dry   → hiçbir şey göndermez, ne yapacağını yazar
//   tsx scripts/reply-comments.ts         → gerçekten yanıtlar
// ═══════════════════════════════════════════════════════════════════════════

import { createHash } from "node:crypto";

const GRAPH_BASE = "https://graph.facebook.com/v26.0";
const DEFAULT_IG_USER_ID = "17841442281703919"; // @pythiamystic IG business id (gizli değil)

// ─── Ayarlar ──────────────────────────────────────────────────────────────
// Graph API'de "tüm medyadaki son yorumlar" diye tek bir uç YOK.
// Gönderi gönderi dolaşmak zorundayız → son N gönderiyi tarıyoruz.
// Günde ~2 paylaşımda 40 gönderi ≈ son 3 hafta. Daha eskisine yorum gelirse
// kaçar; gerçek zamanlı istiyorsak Meta webhook'u gerekir (bkz. dosya sonu).
const MEDIA_SCAN = 40; // kaç gönderi taransın (sayfalama ile)
const MEDIA_PAGE = 25; // /media sayfa boyutu
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
// Token ASLA loglanmaz: hata mesajlarına yalnız yol, HTTP durumu ve Meta'nın
// error.message/code alanı girer. (paging.next URL'leri token taşır → yazdırılmaz.)
function token(): string {
  const t = (process.env.IG_PAGE_TOKEN || "").replace(/^\uFEFF/, "").trim();
  if (!t) throw new Error("IG_PAGE_TOKEN env değişkeni tanımlı değil!");
  return t;
}

function igUserId(): string {
  return (process.env.IG_FB_USER_ID || "").trim() || DEFAULT_IG_USER_ID;
}

async function parse(res: Response, what: string): Promise<any> {
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json?.error) {
    const err = json?.error;
    const detail = err ? `${err.message ?? "?"} (code ${err.code ?? "?"}${err.error_subcode ? `/${err.error_subcode}` : ""})` : "yanıt gövdesi okunamadı";
    throw new Error(`${what} → HTTP ${res.status}: ${detail}`);
  }
  return json;
}

async function igGet(path: string, params: Record<string, string> = {}): Promise<any> {
  const qs = new URLSearchParams({ ...params, access_token: token() });
  const res = await fetch(`${GRAPH_BASE}/${path}?${qs}`);
  return parse(res, `GET ${path}`);
}

async function igPost(path: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams({ ...params, access_token: token() });
  const res = await fetch(`${GRAPH_BASE}/${path}`, { method: "POST", body });
  return parse(res, `POST ${path}`);
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
  let url = `${GRAPH_BASE}/${path}?${new URLSearchParams({ ...params, access_token: token() })}`;

  for (let page = 0; page < maxPages && url && out.length < maxItems; page++) {
    const res = await fetch(url);
    const json = await parse(res, `GET ${path}`);
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

/**
 * TEŞHİS MERDİVENİ — yorum ucu boş dönerken hangi biçimin çalıştığını bulur.
 * data:[] + dolu imleç, "uç var ama içerik filtrelendi" demek. Alan alan daraltıyoruz.
 */
async function probeComments(mediaId: string): Promise<void> {
  const tries: Array<[string, string]> = [
    ["uc / alansiz", `${mediaId}/comments`],
    ["uc / id", `${mediaId}/comments?fields=id`],
    ["uc / id,text", `${mediaId}/comments?fields=id,text`],
    ["uc / id,text,username", `${mediaId}/comments?fields=id,text,username`],
    ["uc / replies", `${mediaId}/comments?fields=id,text,username,timestamp,replies{username,text}`],
    ["medyadan ic ice", `${mediaId}?fields=comments_count,comments{id,text,username}`],
    ["medyadan ic ice / alansiz", `${mediaId}?fields=comments`],
  ];
  console.log("  -- TESHIS MERDIVENI --");
  for (const [label, path] of tries) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${GRAPH_BASE}/${path}${sep}access_token=${encodeURIComponent(token())}`;
    try {
      const res = await fetch(url);
      const body = await res.text();
      const short = body.length > 220 ? body.slice(0, 220) + "..." : body;
      console.log(`   [${res.status}] ${label}: ${short}`);
    } catch (e) {
      console.log(`   [ERR] ${label}: ${e}`);
    }
  }
  console.log("  ----------------------");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Ana akış ─────────────────────────────────────────────────────────────
async function run(dry: boolean, debug: boolean): Promise<void> {
  const uid = igUserId();
  const me = await igGet(uid, { fields: "username" });
  const myName = String(me.username || "");
  if (debug) {
    // Token PARMAK IZI - token degil, hash. Secret gercekten degisti mi anlamak icin.
    const fp = createHash("sha256").update(token()).digest("hex").slice(0, 10);
    console.log(`   token parmak izi: ${fp} | uzunluk: ${token().length}`);
    console.log(`   ig user id: ${uid}`);
  }
  console.log(`👤 Hesap: @${myName}${dry ? "   (DRY RUN — hiçbir şey gönderilmeyecek)" : ""}`);

  const media = await igGetAll(
    `${uid}/media`,
    {
      // comments_count MEDYA alanı — yorum ucundan bağımsız okunur.
      // Teşhis anahtarı: count > 0 ama uç boş dönüyorsa sorun izinde/uçta,
      // count = 0 ise gönderide gerçekten yorum yok.
      fields: "id,caption,comments_count,timestamp",
      limit: String(MEDIA_PAGE),
    },
    Math.ceil(MEDIA_SCAN / MEDIA_PAGE),
    MEDIA_SCAN,
  );
  const withComments = media.filter((m: any) => Number(m.comments_count || 0) > 0);
  console.log(
    `📚 Taranan gönderi: ${media.length} (en yeniden geriye) · ` +
      `yorumu olan: ${withComments.length} · ` +
      `toplam yorum: ${media.reduce((s: number, m: any) => s + Number(m.comments_count || 0), 0)}`,
  );
  if (debug) {
    console.log("");
    console.log("-- DEBUG: en yeni 5 gonderi --");
    for (const m of media.slice(0, 5) as any[]) {
      console.log(
        `   ${m.id} | ${String(m.timestamp).slice(0, 16)} | ` +
          `comments_count=${m.comments_count ?? "?"} | ${String(m.caption || "").slice(0, 40).replace(/\n/g, " ")}`,
      );
    }
    console.log("------------------------------");
  } else if (media.length) {
    const m0: any = media[0];
    console.log(
      `   en yeni: ${m0.id} ${String(m0.timestamp).slice(0, 10)} ` +
        `comments_count=${m0.comments_count ?? "?"}`,
    );
  }

  let total = 0;
  let skipped = 0;
  let probed = false;

  for (const m of media) {
    if (total >= MAX_TOTAL) break;

    const count = Number(m.comments_count || 0);
    if (count === 0) continue; // gerçekten yorumsuz — uca hiç gitme

    const poolName = detectPool(String(m.caption || ""));
    const pool = POOLS[poolName] ?? POOLS.general;

    let comments: any[];
    try {
      comments = await igGetAll(
        `${m.id}/comments`,
        { fields: "id,text,username,timestamp,replies{username,text}", limit: "50" },
        COMMENT_PAGES,
        COMMENT_PAGES * 50,
      );
    } catch (e) {
      console.log(`\n📸 ${m.id} [${poolName}] — comments_count=${count}`);
      console.log(`  ⚠️  yorum ucu HATA verdi: ${e}`);
      continue;
    }

    console.log(
      `\n📸 ${m.id} [${poolName}] — comments_count=${count}, uçtan gelen=${comments.length}`,
    );

    if (comments.length === 0) {
      // Gönderide yorum VAR ama uç boş döndü → izin ya da alan sorunu.
      console.log(`  🚨 ${count} yorum olmasına rağmen uç BOŞ döndü.`);
      if (debug && !probed) {
        probed = true; // merdiveni tek gönderide çalıştır, logu şişirme
        await probeComments(String(m.id));
      }
      continue;
    }

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
  run(process.argv.includes("--dry"), process.argv.includes("--debug")).catch((e) => {
    console.error("💥 Yorum yanıtlama hatası:", e);
    process.exit(1);
  });
}
