// ═══════════════════════════════════════════════════════════════════════════
// src/tiktok/oauthCore.ts — TikTok OAuth çekirdeği (SAF fetch, PAYLAŞILAN)
//
// Node'a bağlı import YOK (process.env / node:fs / spawnSync YOK) — kimlik
// bilgileri PARAMETRE olarak geçer. Node script'leri (tiktok-oauth.ts,
// upload-tiktok.ts) kendi glue'suyla (process.env / gh secret) bunu sarar;
// Cloudflare Worker (worker/) aynı fonksiyonları KV'den beslenen creds'le çağırır.
// TEK KAYNAK → drift yok.
//
// SCOPE (DÜZELTİLDİ): "user.info.basic,video.publish" — Direct Post PUBLISH
// scope'u. (video.upload = yalnız draft/inbox; video.list ÇIKARILDI — dedup'ı
// KV'deki kendi publish kaydımızdan besliyoruz, /v2/video/list/ çağırmıyoruz.)
// ═══════════════════════════════════════════════════════════════════════════

export const TIKTOK_AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/";
export const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
export const TIKTOK_SCOPES = "user.info.basic,video.publish";

export interface TikTokTokenResponse {
  access_token?: string;
  refresh_token?: string; // TikTok her kullanımda rotasyonla yeniler
  expires_in?: number; // access_token ömrü (sn)
  refresh_expires_in?: number;
  open_id?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

/** Authorize URL üretir (SAF string — ağ çağrısı YOK). state CSRF için çağıran tarafından verilir. */
export function buildAuthorizeUrl(params: {
  clientKey: string;
  redirectUri: string;
  state: string;
  scopes?: string;
}): string {
  const q = new URLSearchParams({
    client_key: params.clientKey,
    scope: params.scopes ?? TIKTOK_SCOPES,
    response_type: "code",
    redirect_uri: params.redirectUri,
    state: params.state,
  });
  return `${TIKTOK_AUTH_BASE}?${q.toString()}`;
}

/** authorization_code → token (refresh_token + open_id içerir). */
export async function exchangeCodeForToken(params: {
  clientKey: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<TikTokTokenResponse> {
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: params.clientKey,
      client_secret: params.clientSecret,
      code: params.code,
      grant_type: "authorization_code",
      redirect_uri: params.redirectUri,
    }),
  });
  return (await res.json()) as TikTokTokenResponse;
}

/** refresh_token → yeni access_token (+ rotasyonlu yeni refresh_token). */
export async function refreshAccessToken(params: {
  clientKey: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<TikTokTokenResponse> {
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: params.clientKey,
      client_secret: params.clientSecret,
      grant_type: "refresh_token",
      refresh_token: params.refreshToken,
    }),
  });
  return (await res.json()) as TikTokTokenResponse;
}
