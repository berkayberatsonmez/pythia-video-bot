// ═══════════════════════════════════════════════════════════════════════════
// worker/src/index.ts — TikTok Direct Post yayın paneli (Cloudflare Worker)
//
// Deploy/secret YOK (sende). Bu dosya gerçek akışı implemente eder; secret + KV
// olmadan yalnız deploy sonrası çalışır. Token frontend'e ASLA gitmez (KV'de).
//
// PAYLAŞILAN çekirdek (Node + Worker ortak, drift yok — ../../src):
//   oauthCore: buildAuthorizeUrl / exchangeCodeForToken / refreshAccessToken
//   dedup:     isDuplicateUpload (KV publish geçmişiyle beslenir)
//   privacy:   enforcePrivacy (AUDIT_MODE=true → SELF_ONLY kilidi)
// caption + line1 (dedup anahtarı) worker'da ÜRETİLMEZ: klibin Release .meta.json'ı
// SUNUCU tarafında okunur — bu, render-tiktok.ts'in buildTikTokMetadata çıktısıdır
// (persist edilmiş TEK KAYNAK; seed sabitine gerek yok, client'a güvenilmez).
// ═══════════════════════════════════════════════════════════════════════════

// PYTHIA: paylaşılan saf modüller pythia-video-bot'ta YOK → worker içine VENDOR
// edildi (drift kabul — ayrı proje). Conveyor'da bunlar ../../src/'ten gelir.
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  refreshAccessToken,
} from "./shared/oauthCore";
import { isDuplicateUpload, type RecentUpload } from "./shared/dedup";
import { enforcePrivacy, type TikTokPrivacy } from "./shared/privacy";

export interface Env {
  TIKTOK_KV: KVNamespace;
  TIKTOK_CLIENT_KEY: string;
  TIKTOK_CLIENT_SECRET: string;
  GH_RELEASE_TOKEN: string;
  AUDIT_MODE: string;
  GH_REPO: string;
  REDIRECT_URI: string;
  EXPECTED_TIKTOK_OPEN_ID?: string; // SET İSE hesap guard'ı; boşsa ilk kurulum (blokla-maz)
  CRON_SECRET?: string; // SET İSE cron çağrısı X-Cron-Secret ile doğrulanır
}

const FRONTEND_ORIGIN = "https://berkayberatsonmez.github.io";

// Token endpoint'i oauthCore içinde; burada gerekmez.
const TT_CREATOR_INFO = "https://open.tiktokapis.com/v2/post/publish/creator_info/query/";
const TT_PUBLISH_INIT = "https://open.tiktokapis.com/v2/post/publish/video/init/";
const TT_PUBLISH_STATUS = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";

const RECENT_PUBLISHES_KEY = "recent_publishes";
const RECENT_MAX = 50;

// ─── PYTHIA parametreleri (Conveyor'dan TEK yapısal fark) ───────────────────
// Conveyor: release tag'i + asset adı "tiktok-" önekli (tiktok-1 / tiktok-<format>.mp4).
// Pythia demo: tag "pythia-<run>" (ör. pythia-1), asset adı ÖNEKSİZ = "<format>.<ext>"
// (format = "<category>-<id>", ör. "tarot-the-tower.mp4" + "tarot-the-tower.meta.json").
const TAG_PREFIX = "pythia-";
const assetName = (format: string, ext: string): string => `${format}.${ext}`;

// ─── HTTP yardımcıları ──────────────────────────────────────────────────────
class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly detail?: string,
  ) {
    super(code);
  }
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// TikTok yanıt zarfı: { data, error:{ code, message, log_id } }. code!=="ok" → hata.
async function ttFetch(url: string, accessToken: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
  const j = (await res.json().catch(() => ({}))) as {
    data?: Record<string, unknown>;
    error?: { code?: string; message?: string };
  };
  if (!res.ok || (j.error?.code && j.error.code !== "ok")) {
    throw new HttpError(502, "tiktok_error", `${url} → ${JSON.stringify(j.error ?? { status: res.status })}`);
  }
  return j.data ?? {};
}

// ─── Access token (cache + rotasyonlu refresh write-back) ───────────────────
async function getAccessToken(env: Env): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const cachedRaw = await env.TIKTOK_KV.get("access_token");
  if (cachedRaw) {
    const cached = JSON.parse(cachedRaw) as { token: string; expEpoch: number };
    if (cached.token && cached.expEpoch > nowSec + 60) return cached.token;
  }
  const refreshToken = await env.TIKTOK_KV.get("refresh_token");
  if (!refreshToken) throw new HttpError(409, "not_connected", "TikTok bağlı değil — /auth/start");

  const j = await refreshAccessToken({
    clientKey: env.TIKTOK_CLIENT_KEY,
    clientSecret: env.TIKTOK_CLIENT_SECRET,
    refreshToken,
  });
  if (j.error || !j.access_token) {
    throw new HttpError(502, "refresh_failed", JSON.stringify(j.error ?? j));
  }
  // TikTok refresh_token HER kullanımda rotasyonla yenilenir → KV'ye write-back ŞART.
  if (j.refresh_token) await env.TIKTOK_KV.put("refresh_token", j.refresh_token);
  if (j.open_id) await env.TIKTOK_KV.put("open_id", j.open_id);
  const expEpoch = nowSec + (j.expires_in ?? 3600) - 60;
  await env.TIKTOK_KV.put("access_token", JSON.stringify({ token: j.access_token, expEpoch }));
  return j.access_token;
}

// ─── GitHub Release asset (PRIVATE repo → Bearer GH_RELEASE_TOKEN) ──────────
// SSRF koruması: yalnız kendi repomuzun api.github.com asset URL'leri.
function assertOurAssetUrl(url: string, env: Env): void {
  const u = new URL(url);
  if (u.hostname !== "api.github.com" || !u.pathname.startsWith(`/repos/${env.GH_REPO}/releases/`)) {
    throw new HttpError(400, "bad_asset_url", url);
  }
}

async function fetchAssetResponse(url: string, env: Env): Promise<Response> {
  assertOurAssetUrl(url, env);
  // Asset indirmesi 302 ile imzalı S3'e gider; auth başlığını S3'e TAŞIMA
  // (redirect:manual → location'ı auth'suz çek).
  let r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GH_RELEASE_TOKEN}`,
      Accept: "application/octet-stream",
      "User-Agent": "conveyor-tiktok-panel",
    },
    redirect: "manual",
  });
  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get("location");
    if (!loc) throw new HttpError(502, "asset_redirect_missing", url);
    r = await fetch(loc);
  }
  if (!r.ok) throw new HttpError(502, "asset_fetch_failed", `${r.status} ${url}`);
  return r;
}

// Bir Release'in asset listesini tag ile çeker (SUNUCU tarafı — /publish klip
// asset'lerini client URL'ine güvenmeden buradan bulur).
type GhAsset = { name: string; url: string };
async function getReleaseAssets(env: Env, tag: string): Promise<GhAsset[]> {
  const r = await fetch(
    `https://api.github.com/repos/${env.GH_REPO}/releases/tags/${encodeURIComponent(tag)}`,
    {
      headers: {
        Authorization: `Bearer ${env.GH_RELEASE_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "conveyor-tiktok-panel",
      },
    },
  );
  if (r.status === 404) throw new HttpError(404, "release_not_found", tag);
  if (!r.ok) throw new HttpError(502, "release_fetch_failed", `${r.status}`);
  const rel = (await r.json()) as { assets?: GhAsset[] };
  return rel.assets ?? [];
}

// ─── creator_info (nickname/avatar/izinler/privacy_level_options) ───────────
interface CreatorInfo {
  creator_nickname?: string;
  creator_username?: string;
  creator_avatar_url?: string;
  privacy_level_options?: string[];
  comment_disabled?: boolean;
  duet_disabled?: boolean;
  stitch_disabled?: boolean;
  max_video_post_duration_sec?: number;
}

async function fetchCreatorInfo(env: Env, accessToken: string): Promise<CreatorInfo> {
  // creator_info/query gövdesiz POST (Authorization yeter).
  return (await ttFetch(TT_CREATOR_INFO, accessToken, {})) as CreatorInfo;
}

// ─── Rota handler'ları ──────────────────────────────────────────────────────

// GET /auth/start → state'i KV'ye TTL 600s yaz + 302 authorize URL.
async function authStart(env: Env): Promise<Response> {
  const state = crypto.randomUUID();
  await env.TIKTOK_KV.put(`oauth_state:${state}`, "1", { expirationTtl: 600 });
  const url = buildAuthorizeUrl({
    clientKey: env.TIKTOK_CLIENT_KEY,
    redirectUri: env.REDIRECT_URI,
    state,
  });
  return Response.redirect(url, 302);
}

// GET /auth/callback?code&state → state doğrula → token exchange → KV'ye yaz.
async function authCallback(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return html("<h3>Eksik code/state.</h3>", 400);

  const stateOk = await env.TIKTOK_KV.get(`oauth_state:${state}`);
  if (!stateOk) return html("<h3>state doğrulanamadı (CSRF / süresi doldu).</h3>", 403);
  await env.TIKTOK_KV.delete(`oauth_state:${state}`);

  const j = await exchangeCodeForToken({
    clientKey: env.TIKTOK_CLIENT_KEY,
    clientSecret: env.TIKTOK_CLIENT_SECRET,
    code,
    redirectUri: env.REDIRECT_URI,
  });
  if (j.error || !j.refresh_token || !j.access_token) {
    return html(`<h3>Token alınamadı.</h3><pre>${JSON.stringify(j.error ?? j)}</pre>`, 502);
  }
  const nowSec = Math.floor(Date.now() / 1000);
  await env.TIKTOK_KV.put("refresh_token", j.refresh_token);
  if (j.open_id) await env.TIKTOK_KV.put("open_id", j.open_id);
  await env.TIKTOK_KV.put(
    "access_token",
    JSON.stringify({ token: j.access_token, expEpoch: nowSec + (j.expires_in ?? 3600) - 60 }),
  );
  return html(
    "<h2>✓ TikTok bağlandı</h2><p>Bu sekmeyi kapatıp panele dönebilirsin.</p>",
  );
}

// GET /creator-info → creator_info/query (frontend nickname+avatar+privacy gösterir).
async function creatorInfo(env: Env): Promise<Response> {
  const access = await getAccessToken(env);
  const info = await fetchCreatorInfo(env, access);
  return json(info);
}

// GET /clips → Release tiktok-* asset'leri + .meta.json (caption/süre).
async function clips(env: Env): Promise<Response> {
  const relUrl = `https://api.github.com/repos/${env.GH_REPO}/releases?per_page=20`;
  const rel = await fetch(relUrl, {
    headers: {
      Authorization: `Bearer ${env.GH_RELEASE_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "conveyor-tiktok-panel",
    },
  });
  if (!rel.ok) throw new HttpError(502, "releases_fetch_failed", `${rel.status}`);
  type Asset = { name: string; url: string };
  const releases = (await rel.json()) as { tag_name: string; assets: Asset[] }[];

  const out: unknown[] = [];
  for (const r of releases.filter((x) => x.tag_name.startsWith(TAG_PREFIX))) {
    for (const mp4 of r.assets.filter((a) => a.name.endsWith(".mp4"))) {
      const fmt = mp4.name.replace(/\.mp4$/, "");
      const metaAsset = r.assets.find((a) => a.name === assetName(fmt, "meta.json"));
      let caption = "";
      let line1 = "";
      let durationSec: number | undefined;
      if (metaAsset) {
        const metaRes = await fetchAssetResponse(metaAsset.url, env);
        const meta = (await metaRes.json()) as { caption?: string; line1?: string; durationSec?: number };
        caption = meta.caption ?? "";
        line1 = meta.line1 ?? "";
        durationSec = meta.durationSec;
      }
      out.push({ tag: r.tag_name, format: fmt, mp4Url: mp4.url, caption, line1, durationSec });
    }
  }
  return json({ clips: out });
}

// POST /publish → Direct Post init + FILE_UPLOAD PUT + status poll.
interface PublishBody {
  tag?: string; // Release tag (ör. "tiktok-3")
  format?: string; // "gameplay" | "bomb" | "satisfying"
  privacy?: string;
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
  brandOrganicToggle?: boolean; // "Your brand" — kendi markanı tanıtıyorsun
  brandContentToggle?: boolean; // "Branded content" — üçüncü taraf sponsorluk (Paid partnership)
}

async function publish(req: Request, env: Env): Promise<Response> {
  // CRON-AUTH: X-Cron-Secret varsa doğrula. Eşleşir → otomatik (cron) çağrı;
  // yanlış → 403; header YOK → mevcut (panel) davranış (DEĞİŞMEZ).
  const cronHeader = req.headers.get("X-Cron-Secret");
  if (cronHeader && (!env.CRON_SECRET || cronHeader !== env.CRON_SECRET)) {
    throw new HttpError(403, "bad_cron_secret");
  }

  const body = (await req.json().catch(() => ({}))) as PublishBody;
  const tag = body.tag ?? "";
  const format = body.format ?? "";
  if (!new RegExp(`^${TAG_PREFIX}[\\w.-]+$`).test(tag)) throw new HttpError(400, "bad_tag", tag);
  if (!/^[\w-]+$/.test(format)) throw new HttpError(400, "bad_format", format);

  // 1) access token (cache + rotasyonlu refresh write-back)
  const access = await getAccessToken(env);

  // 2) open_id guard: env SET İSE eşleşmeli; boşsa ilk kurulum → blokla-ma.
  const kvOpenId = await env.TIKTOK_KV.get("open_id");
  if (env.EXPECTED_TIKTOK_OPEN_ID && kvOpenId !== env.EXPECTED_TIKTOK_OPEN_ID) {
    throw new HttpError(403, "wrong_account", `open_id (${kvOpenId ?? "?"}) beklenenle uyuşmuyor`);
  }

  // 3) Klibin asset'lerini SUNUCU TARAFINDA bul (mp4 + meta.json) — client URL'ine güvenme.
  const assets = await getReleaseAssets(env, tag);
  const mp4Asset = assets.find((a) => a.name === assetName(format, "mp4"));
  const metaAsset = assets.find((a) => a.name === assetName(format, "meta.json"));
  if (!mp4Asset || !metaAsset) throw new HttpError(404, "clip_not_found", `${tag}/${format}`);

  // 4) caption + line1 SUNUCU'nun okuduğu .meta.json'dan (render-tiktok'un TEK
  //    KAYNAĞI) — client'ın gönderdiği metne GÜVENME. buildTikTokMetadata burada
  //    yeniden ÇAĞRILMAZ; persist edilmiş çıktısı yeterli, seed sabitine gerek yok.
  const metaRes = await fetchAssetResponse(metaAsset.url, env);
  const clip = (await metaRes.json()) as { caption?: string; line1?: string };
  const caption = clip.caption ?? "";
  const line1 = clip.line1 ?? "";
  if (!caption || !line1) throw new HttpError(502, "meta_incomplete", metaAsset.name);

  // 5) dedup: KV'deki kendi publish geçmişimiz (line1 + timestamp)
  const nowMs = Date.now();
  const recentRaw = await env.TIKTOK_KV.get(RECENT_PUBLISHES_KEY);
  const recent: RecentUpload[] = recentRaw ? (JSON.parse(recentRaw) as RecentUpload[]) : [];
  if (isDuplicateUpload(line1, recent, nowMs)) {
    return json({ skipped: true, reason: "duplicate", line1 }, 409);
  }

  // 6) creator_info: privacy_level_options + account izin kısıtları
  const creator = await fetchCreatorInfo(env, access);
  const auditMode = env.AUDIT_MODE === "true";
  let privacy: TikTokPrivacy = enforcePrivacy(body.privacy, auditMode); // audit → SELF_ONLY
  const options = creator.privacy_level_options ?? [];
  if (options.length && !options.includes(privacy)) {
    if (options.includes("SELF_ONLY")) privacy = "SELF_ONLY";
    else throw new HttpError(400, "privacy_not_allowed", options.join(","));
  }

  // Ticari içerik beyanı toggle'ları (ikisi de default false).
  const brandOrganic = Boolean(body.brandOrganicToggle);
  const brandContent = Boolean(body.brandContentToggle);
  // BRANDED CONTENT KİLİDİ (defense in depth): branded content SELF_ONLY (private)
  // OLAMAZ. AUDIT_MODE'da privacy zaten SELF_ONLY'ye ezildiğinden, audit modunda
  // brand_content_toggle=true → 400. (Bizim gerçek postlarımız disclosure KAPALI,
  // buna hiç düşmez; kural yine de sunucuda zorlanır.)
  if (brandContent && privacy === "SELF_ONLY") {
    throw new HttpError(400, "branded_content_private", "branded content 'Only me' (private) olamaz");
  }

  // Account'ta kapalıysa ilgili disable_* = true ZORLA (kullanıcı açamaz).
  const disableComment = Boolean(body.disableComment) || Boolean(creator.comment_disabled);
  const disableDuet = Boolean(body.disableDuet) || Boolean(creator.duet_disabled);
  const disableStitch = Boolean(body.disableStitch) || Boolean(creator.stitch_disabled);

  // 7) Release MP4'ünü çek → bytes (video_size init'ten önce lazım)
  const assetRes = await fetchAssetResponse(mp4Asset.url, env);
  const bytes = new Uint8Array(await assetRes.arrayBuffer());
  const size = bytes.byteLength;
  if (size === 0) throw new HttpError(502, "empty_video", mp4Asset.name);

  // 8) Direct Post init (inbox DEĞİL) → publish_id + upload_url
  const init = await ttFetch(TT_PUBLISH_INIT, access, {
    post_info: {
      title: caption,
      privacy_level: privacy,
      disable_comment: disableComment,
      disable_duet: disableDuet,
      disable_stitch: disableStitch,
      brand_organic_toggle: brandOrganic,
      brand_content_toggle: brandContent,
    },
    source_info: { source: "FILE_UPLOAD", video_size: size, chunk_size: size, total_chunk_count: 1 },
  });
  const publishId = init.publish_id as string | undefined;
  const uploadUrl = init.upload_url as string | undefined;
  if (!publishId || !uploadUrl) throw new HttpError(502, "init_missing_fields", JSON.stringify(init));

  // 9) PUT video bytes (tek chunk)
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Range": `bytes 0-${size - 1}/${size}`, "Content-Type": "video/mp4" },
    body: bytes,
  });
  if (put.status !== 200 && put.status !== 201) {
    throw new HttpError(502, "upload_put_failed", `${put.status}`);
  }

  // 10) DEDUP KAYDINI PUT BAŞARISINDAN HEMEN SONRA yaz (poll'dan BAĞIMSIZ):
  //     poll timeout → 202 döner, retry gelirse dup guard'ı ÇİFT-POST'u keser.
  const publishedAt = new Date(nowMs).toISOString();
  recent.push({ title: line1, publishedAt });
  await env.TIKTOK_KV.put(RECENT_PUBLISHES_KEY, JSON.stringify(recent.slice(-RECENT_MAX)));

  // 11) status poll (backoff) → PUBLISH_COMPLETE / FAILED / timeout
  let status = "PROCESSING_UPLOAD";
  for (let i = 0; i < 12; i++) {
    await sleep(2500);
    const st = await ttFetch(TT_PUBLISH_STATUS, access, { publish_id: publishId });
    status = (st.status as string) ?? status;
    if (status === "PUBLISH_COMPLETE") {
      return json({ published: true, publish_id: publishId, status, privacy, line1 });
    }
    if (status === "FAILED") {
      // Başarısız → dedup kaydını GERİ AL (bu klip tekrar denenebilsin).
      const pruned = recent.filter((r) => !(r.title === line1 && r.publishedAt === publishedAt));
      await env.TIKTOK_KV.put(RECENT_PUBLISHES_KEY, JSON.stringify(pruned.slice(-RECENT_MAX)));
      throw new HttpError(502, "publish_failed", JSON.stringify(st));
    }
  }
  // Timeout: BAŞARISIZ DEĞİL — video yüklendi, TikTok işliyor. KV kaydı KALIR
  // (retry çift-post etmesin). 202 + publish_id ile "gönderildi, işleniyor".
  return json(
    { processing: true, publish_id: publishId, status, privacy, line1, note: "gönderildi, işleniyor" },
    202,
  );
}

// ─── Router (+ CORS + JSON hata gövdeleri) ──────────────────────────────────
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

    const { pathname } = new URL(req.url);
    const m = req.method;
    try {
      if (m === "GET" && pathname === "/auth/start") return await authStart(env);
      if (m === "GET" && pathname === "/auth/callback") return await authCallback(req, env);
      if (m === "GET" && pathname === "/creator-info") return await creatorInfo(env);
      if (m === "GET" && pathname === "/clips") return await clips(env);
      if (m === "POST" && pathname === "/publish") return await publish(req, env);
      return json({ error: "not_found", pathname }, 404);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.code, detail: e.detail }, e.status);
      return json({ error: "internal", detail: String(e) }, 500);
    }
  },
};
