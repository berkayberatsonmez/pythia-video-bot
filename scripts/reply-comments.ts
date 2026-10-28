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
// YANIT ÜRETİMİ (2026-10-28): sabit havuz yerine LLM. Her yoruma, gönderi başlığı +
//   kategorisi + yorum + KODDA hesaplanan olgular (burç, yaşam yolu sayısı) verilerek
//   OpenAI'dan 1–2 cümlelik, uygulamaya yumuşak yönlendiren bir yanıt istenir.
//   Model sayı hesaplamaz; yaşam yolu kodda hesaplanır (reply-helpers.ts).
//   Üretim başarısızsa o yorum atlanır (log), koşu çökmez.
//
// ENV: IG_PAGE_TOKEN (zorunlu) · OPENAI_API_KEY (zorunlu; yoksa gerçek modda hata,
//      kuru modda yalnız ne yapılacağı yazılır) · OPENAI_MODEL (varsayılan gpt-4o-mini)
//      · REPLY_MAX_PER_RUN (varsayılan 20) · IG_FB_USER_ID (isteğe bağlı,
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
import { detectSigns, parseBirthDate, lifePath, sanitizeReply, onlyMentions, lower } from "./reply-helpers";

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
const MAX_TOTAL_DEFAULT = 20; // bir çalıştırmada toplam en fazla kaç yanıt (REPLY_MAX_PER_RUN ile değişir)
const CAPTION_MAX = 600; // modele giden başlık uzunluğu
const OPENAI_TIMEOUT_MS = 25000;
const DEFAULT_MODEL = "gpt-4o-mini";

function maxTotal(): number {
  const n = parseInt(process.env.REPLY_MAX_PER_RUN || "", 10);
  return Number.isFinite(n) && n > 0 ? n : MAX_TOTAL_DEFAULT;
}
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

// ─── LLM yanıt üretimi ────────────────────────────────────────────────────
// Aynı metni tekrar tekrar göndermek Meta'nın spam tespitine takılır; LLM her yoruma
// özgü yanıt üretir, aynı gönderide önceki yanıtlar modele verilir (açılış tekrar etmesin).
export const SYSTEM_PROMPT = `Sen @pythiamystic Instagram hesabının yorum yanıtlayıcısısın. Pythia; yapay zekâ destekli rüya yorumu, tarot, burç yorumu ve numeroloji uygulamasıdır.

SES: Sıcak, gizemli, samimi. Karşındakine "sen" diye hitap et. 1–2 cümle, en fazla ~220 karakter. En fazla 1–2 emoji (🌙 ✨ 🔮 🤍 gibi). Yorumun diliyle yanıtla (varsayılan Türkçe).

İÇERİĞE CEVAP VER:
- Yorumda burç varsa ("Koç", "Yengeç 🤍" gibi): o burca özel kısa, olumlu bir içgörü ver. "Yükselen" varsa ona da değin.
- "YAŞAM YOLU SAYISI" verilmişse (doğum tarihi var demektir): o sayıyı AYNEN kullan ve tek cümlelik anlamını söyle. Sayıyı ASLA kendin hesaplama, verilmeyen sayı uydurma.
- Soru varsa kısaca cevapla.
- Emoji ya da çok kısa yorum ("Evet", "🔥") ise gönderinin konusuna bağlı sıcak, kısa bir karşılık ver.
- Gönderi başlığı ve kategorisi bağlamdır; yorumla alakasız şeyler anlatma.

HER YANITI yumuşak ve çeşitli bir uygulama yönlendirmesiyle bitir. URL YAZMA. Örnekler (aynen kopyalama, her seferinde farklı kur): "profildeki linkten Pythia'da rüyanı yorumlat 🌙", "Pythia'da kendi haritana da bakabilirsin, link profilde ✨", "günün kartı için profildeki linke göz at 🔮". Yönlendirmeyi konuya uydur (rüya, tarot, burç, sayı).

YASAKLAR: Kesin kehanet ("kesin olacak" gibi) yok. Sağlık, finans, hukuk tavsiyesi yok. Dini iddia yok. Yapay zekâ ya da bot olduğundan asla söz etme. Kişisel veri isteme (doğum tarihini yorumda zaten paylaşan kişiye teşekkür/değinme serbest). Link, "www", "@" kullanma; kimseyi etiketleme.

Daha önce bu gönderide verilen yanıtlar listelenirse aynı açılışı, aynı kalıbı ve aynı yönlendirme cümlesini TEKRARLAMA.

ÇIKTI: Yalnızca yanıt metni. Tırnak, başlık, açıklama yok.`;

export interface ReplyCtx {
  caption: string;
  category: string;
  comment: string;
  previous: string[]; // aynı gönderide bu koşuda üretilen yanıtlar
}

/** Koda ait olgular + modele giden kullanıcı mesajı. Yaşam yolu burada HESAPLANIR. */
export function buildUserMessage(ctx: ReplyCtx): string {
  const facts: string[] = [];
  const si = detectSigns(ctx.comment);
  if (si.signs.length) facts.push(`Tespit edilen burç(lar): ${si.signs.join(", ")}`);
  if (si.rising) facts.push(`Yükselen burç: ${si.rising}`);
  const bd = parseBirthDate(ctx.comment);
  if (bd) {
    const lp = lifePath(bd);
    facts.push(`Doğum tarihi yorumda var → YAŞAM YOLU SAYISI: ${lp}${lp > 9 ? " (usta sayı)" : ""}`);
  }
  const parts = [
    `Gönderi kategorisi: ${ctx.category}`,
    `Gönderi başlığı: ${ctx.caption.replace(/\s+/g, " ").trim().slice(0, CAPTION_MAX) || "(yok)"}`,
    `Yorum: ${ctx.comment.trim()}`,
    `Kodla hesaplanan olgular: ${facts.length ? facts.join(" · ") : "yok"}`,
  ];
  if (ctx.previous.length) {
    parts.push(`Bu gönderide daha önce verilen yanıtlar (tekrar etme):\n${ctx.previous.map((p) => `- ${p}`).join("\n")}`);
  }
  return parts.join("\n");
}

async function callOpenAI(userMsg: string): Promise<string> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), OPENAI_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctl.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(process.env.OPENAI_API_KEY || "").trim()}`,
      },
      body: JSON.stringify({
        model: (process.env.OPENAI_MODEL || "").trim() || DEFAULT_MODEL,
        temperature: 0.8,
        max_tokens: 120,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${json?.error?.message ?? "?"}`);
    return String(json?.choices?.[0]?.message?.content ?? "");
  } finally {
    clearTimeout(timer);
  }
}

/** Yanıt üretir; 1 yeniden deneme. Başarısızsa null (çağıran atlar). Anahtar loglanmaz. */
async function generateReply(ctx: ReplyCtx): Promise<{ reply: string | null; err?: string }> {
  const msg = buildUserMessage(ctx);
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callOpenAI(msg);
      const clean = sanitizeReply(raw);
      if (clean) return { reply: clean };
      lastErr = "model çıktısı son kontrolden geçmedi (boş/link/@)";
    } catch (e: any) {
      lastErr = e?.name === "AbortError" ? "zaman aşımı" : String(e?.message ?? e);
    }
    if (attempt === 0) await sleep(1500);
  }
  return { reply: null, err: lastErr };
}

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

/** Elle cevaplanmalıysa sebebi (MANUEL), değilse null. */
function manualReason(text: string): string | null {
  const t = lower(text);
  for (const p of SKIP_PATTERNS) {
    if (t.includes(p)) return `hassas/şikayet ifadesi ("${p}")`;
  }
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
  const hasKey = !!(process.env.OPENAI_API_KEY || "").trim();
  if (!hasKey && !dry) {
    throw new Error("OPENAI_API_KEY tanımlı değil — gerçek modda yanıt üretilemez, hiçbir şey gönderilmedi.");
  }
  if (!hasKey) {
    console.log("⚠️  OPENAI_API_KEY yok: kuru çalıştırma yalnızca hangi yorumlara yanıt VERİLECEĞİNİ listeler, yanıt metni üretilmez.");
  }
  const limit = maxTotal();
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
    if (total >= limit) break;

    const count = Number(m.comments_count || 0);
    if (count === 0) continue; // gerçekten yorumsuz — uca hiç gitme

    const poolName = detectPool(String(m.caption || ""));
    const caption = String(m.caption || "");
    const madeHere: string[] = []; // bu gönderide bu koşuda üretilen yanıtlar

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
      if (total >= limit || perMedia >= MAX_PER_MEDIA) break;

      const text = String(c.text || "");
      const user = String(c.username || "");

      if (user === myName) continue; // kendi ilk yorumumuz (hashtag/CTA)
      if (tooOld(String(c.timestamp || ""))) continue; // aylık geçmiş yoruma yanıt tuhaf durur

      const alreadyReplied = (c.replies?.data ?? []).some(
        (r: any) => String(r.username || "") === myName,
      );
      if (alreadyReplied) continue;

      if (onlyMentions(text)) continue; // yalnız @etiket ("@@", "@biri") — yanıtlanacak içerik yok

      const manual = manualReason(text);
      if (manual) {
        skipped++;
        console.log(`  ⏭️  MANUEL @${user}: ${manual} → "${text.slice(0, 80)}"`);
        continue;
      }

      let message: string;
      if (!hasKey) {
        console.log(`  💬 @${user}: "${text.slice(0, 80)}"`);
        console.log(`     ↳ (yanıt üretilmedi — OPENAI_API_KEY yok)`);
        perMedia++;
        total++;
        continue;
      }
      const gen = await generateReply({ caption, category: poolName, comment: text, previous: madeHere });
      if (!gen.reply) {
        console.log(`  ⚠️  @${user}: yanıt üretilemedi, atlandı (${gen.err})`);
        continue;
      }
      message = gen.reply;
      madeHere.push(message);

      if (dry) {
        console.log(`  💬 @${user}: "${text.slice(0, 80)}"`);
        console.log(`     ↳ ${message}`);
      } else {
        console.log(`  💬 @${user}: "${text.slice(0, 80)}"`);
        console.log(`     ↳ ${message}`);
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
