// ═══════════════════════════════════════════════════════════════════════════
// analytics/providers.ts — Platform durum + metrik okuyucuları (YT / IG / PostPeer)
//
// FAIL-SOFT: Okuyucular hiçbir koşulda yayın akışına dokunmaz (yalnız
// video-analytics.yml çağırır). Yetki eksikse (403 / insufficient scope) hata
// fırlatmak yerine snapshot'a "needs_scope:<scope>" sorunu yazılır ve devam edilir.
//   • YouTube: videos.list → youtube.readonly gerekir (token şu an YALNIZ upload)
//   • Instagram: /insights → instagram_business_manage_insights gerekir
// Ham API yanıtları / hata mesajları ASLA kaydedilmez; yalnız normalize kodlar.
// ═══════════════════════════════════════════════════════════════════════════

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { youtube_v3 } from "googleapis";
import {
  emptyMetrics,
  type Event,
  type Metrics,
  type PublishState,
} from "./ledger";

export type Observation = {
  state: PublishState;
  metrics: Metrics;
  issues: string[];
  platformId?: string;
  url?: string;
  publishedAt?: string;
  durationSec?: number;
};

export const NEEDS_YT_SCOPE = "needs_scope:youtube.readonly";
export const NEEDS_IG_SCOPE = "needs_scope:instagram_business_manage_insights";

export function metric(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
export function isoDuration(value: string): number | undefined {
  const m = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(
    value,
  );
  return m
    ? Number(m[1] || 0) * 86400 +
        Number(m[2] || 0) * 3600 +
        Number(m[3] || 0) * 60 +
        Number(m[4] || 0)
    : undefined;
}

// API yanıtları burada normalize edilir; ham yanıt (hata mesajları dahil) saklanmaz.
// expectedChannelId: token'ın bağlı olduğu kanal (channels.list?mine) — başka kanalın
// videosu gelirse reddedilir. (Pythia'da sabit kanal ID'si yok; kanal token'dan öğrenilir.)
export function youtubeObservation(
  video: any,
  expectedChannelId?: string,
): Observation {
  const result: Observation = {
    state: "unknown",
    metrics: emptyMetrics(),
    issues: [],
  };
  if (!video) {
    result.issues.push("video_not_returned");
    return result;
  }
  if (expectedChannelId && video.snippet?.channelId !== expectedChannelId)
    throw new ApiReadError("youtube_channel_mismatch");
  const status = video.status || {};
  if (["failed", "rejected", "deleted"].includes(status.uploadStatus))
    result.state = "failed";
  else if (
    status.uploadStatus === "processed" &&
    status.privacyStatus === "public"
  )
    result.state = "published";
  else if (status.publishAt) result.state = "scheduled";
  else if (["private", "unlisted"].includes(status.privacyStatus))
    result.state = status.privacyStatus;
  else result.state = "submitted";
  result.metrics.views = metric(video.statistics?.viewCount);
  result.metrics.likes = metric(video.statistics?.likeCount);
  result.metrics.comments = metric(video.statistics?.commentCount);
  result.platformId = video.id;
  result.url = `https://youtube.com/shorts/${video.id}`;
  if (result.state === "published")
    result.publishedAt = video.snippet?.publishedAt;
  result.durationSec = isoDuration(video.contentDetails?.duration || "");
  return result;
}

export function instagramMetrics(payload: any, basic: any): Metrics {
  const metrics = emptyMetrics();
  metrics.likes = metric(basic.like_count);
  metrics.comments = metric(basic.comments_count);
  const names: Record<string, keyof Metrics> = {
    views: "views",
    reach: "reach",
    shares: "shares",
    saved: "saves",
  };
  for (const row of payload.data || []) {
    const key = names[row.name];
    if (key)
      metrics[key] = metric(row.values?.[0]?.value ?? row.total_value?.value);
  }
  return metrics;
}

export function postpeerObservation(
  payload: any,
  draftRequested = false,
): Observation {
  const post = payload.post || payload;
  const targets = (post.platforms || []).filter(
    (p: any) => p.platform === "tiktok",
  );
  const target = targets.length === 1 ? targets[0] : undefined;
  const result: Observation = {
    state: "unknown",
    metrics: emptyMetrics(),
    issues: [],
  };
  if (!target) {
    result.issues.push("tiktok_target_missing_or_ambiguous");
    return result;
  }
  const status = target.status || post.status;
  if (status === "failed" || target.success === false) result.state = "failed";
  else if (status === "draft" || draftRequested) result.state = "draft";
  else if (
    status === "published" &&
    (target.platformPostId || target.platformPostUrl)
  )
    result.state = "published";
  else if (status === "scheduled") result.state = "scheduled";
  else if (
    ["publishing", "pending", "processing", "published"].includes(status)
  )
    result.state = "submitted";
  result.platformId = target.platformPostId;
  result.url = target.platformPostUrl;
  if (result.state === "published") result.publishedAt = target.publishedAt;
  if (result.state === "failed") result.issues.push("postpeer_platform_failed");
  return result;
}

export class ApiReadError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
export const issueCode = (error: unknown): string =>
  error instanceof ApiReadError ? error.code : "api_read_failed";

/**
 * googleapis hatasını (GaxiosError) normalize koda çevirir. Mesaj / gövde saklanmaz.
 *  - 403 (insufficientPermissions / insufficient authentication scopes) → needs_scope
 *  - kota → youtube_quota_exceeded ; süresi dolmuş refresh token → needs_reauth
 */
export function classifyGoogleError(error: any): string {
  if (error instanceof ApiReadError) return error.code;
  const status = Number(
    error?.code ?? error?.status ?? error?.response?.status,
  );
  const message = String(error?.message || "");
  const reason = String(
    error?.errors?.[0]?.reason ??
      error?.response?.data?.error?.errors?.[0]?.reason ??
      "",
  );
  if (/invalid_grant/i.test(message)) return "needs_reauth:youtube";
  if (/quota/i.test(reason) || /quota/i.test(message))
    return "youtube_quota_exceeded";
  if (
    status === 403 ||
    /insufficient/i.test(reason) ||
    /insufficient.*scope/i.test(message)
  )
    return NEEDS_YT_SCOPE;
  return Number.isFinite(status) && status > 0
    ? `youtube_http_${status}`
    : "api_read_failed";
}

/** Meta Graph: 403 ya da izin kodları (10, 200–299) → yetki eksik; 190 → token geçersiz. */
function classifyGraphFailure(
  status: number,
  body: any,
  permissionIssue?: string,
): string {
  const code = Number(body?.error?.code);
  if (code === 190) return "instagram_token_invalid";
  if (status === 403 || code === 10 || (code >= 200 && code <= 299))
    return permissionIssue || `http_${status}`;
  return `http_${status}`;
}

export async function getJson(
  url: string,
  headers: Record<string, string>,
  fetcher: typeof fetch = fetch,
  permissionIssue?: string,
): Promise<any> {
  let response: Response;
  try {
    response = await fetcher(url, {
      headers,
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new ApiReadError("network_or_timeout");
  }
  if (!response.ok) {
    // Gövde yalnız hata KODUNU sınıflamak için okunur; metni hiçbir yere yazılmaz.
    let errorBody: any = {};
    try {
      errorBody = await response.json();
    } catch {
      /* JSON olmayan gövde */
    }
    throw new ApiReadError(
      classifyGraphFailure(response.status, errorBody, permissionIssue),
    );
  }
  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new ApiReadError("invalid_json");
  }
  if (body.error || body.success === false)
    throw new ApiReadError(
      body.error
        ? classifyGraphFailure(200, body, permissionIssue).replace(
            /^http_200$/,
            "api_error_response",
          )
        : "api_error_response",
    );
  return body;
}

export function createCollector(
  options: { postpeerMetricsBudget: number },
  fetcher: typeof fetch = fetch,
  // Test için enjekte edilebilir: YouTube istemcisi (varsayılan: gerçek OAuth).
  youtubeFactory?: () => Promise<youtube_v3.Youtube>,
) {
  let youtubeClient: youtube_v3.Youtube | undefined;
  let youtubeChannelId: string | undefined;
  let youtubeBlocked: string | undefined; // ilk kalıcı yetki hatası → diğer videolarda tekrar denenmez
  let remainingCredits = options.postpeerMetricsBudget;
  const ig = (
    path: string,
    params: Record<string, string>,
    permissionIssue?: string,
  ) =>
    getJson(
      `https://graph.instagram.com/${path}?${new URLSearchParams(params)}`,
      { Authorization: `Bearer ${(process.env.IG_ACCESS_TOKEN || "").trim()}` },
      fetcher,
      permissionIssue,
    );
  const pp = (path: string) =>
    getJson(
      `https://api.postpeer.dev/v1/${path}`,
      { "x-access-key": process.env.POSTPEER_API_KEY || "" },
      fetcher,
    );

  const collectYouTube = async (e: Event): Promise<Observation> => {
    if (youtubeBlocked) throw new ApiReadError(youtubeBlocked);
    try {
      if (!youtubeClient) {
        if (youtubeFactory) youtubeClient = await youtubeFactory();
        else {
          if (
            !existsSync(join(process.cwd(), "scripts/token.json")) ||
            !existsSync(join(process.cwd(), "scripts/credentials.json"))
          )
            throw new ApiReadError("youtube_credentials_missing");
          const { google } = await import("googleapis");
          const { authorize } = await import("../upload-youtube");
          youtubeClient = google.youtube({
            version: "v3",
            auth: await authorize(),
          });
        }
      }
      if (!youtubeChannelId) {
        // Token hangi kanala bağlı? (youtube.readonly ister) — başka kanal videosu reddedilir.
        const own = await youtubeClient.channels.list(
          { part: ["id"], mine: true },
          { timeout: 20_000 },
        );
        youtubeChannelId = own.data.items?.[0]?.id ?? undefined;
        if (!youtubeChannelId) throw new ApiReadError("youtube_channel_unknown");
      }
      const response = await youtubeClient.videos.list(
        {
          id: [e.platformId!],
          part: ["snippet", "status", "statistics", "contentDetails"],
        },
        { timeout: 20_000 },
      );
      return youtubeObservation(response.data.items?.[0], youtubeChannelId);
    } catch (error) {
      const code = classifyGoogleError(error);
      // Yetki / yeniden-yetkilendirme sorunları token düzelene dek her video için aynıdır.
      if (code.startsWith("needs_")) youtubeBlocked = code;
      throw new ApiReadError(code);
    }
  };

  return async (e: Event): Promise<Observation> => {
    if (e.provider === "youtube") return collectYouTube(e);
    if (e.provider === "instagram") {
      if (!process.env.IG_ACCESS_TOKEN?.trim())
        throw new ApiReadError("instagram_token_missing");
      const basic = await ig(encodeURIComponent(e.platformId!), {
        fields: "id,permalink,timestamp,like_count,comments_count",
      });
      if (String(basic.id) !== e.platformId)
        throw new ApiReadError("instagram_media_mismatch");
      const result: Observation = {
        state: "published",
        platformId: basic.id,
        url: basic.permalink,
        publishedAt: basic.timestamp,
        metrics: instagramMetrics({}, basic),
        issues: [],
      };
      try {
        const insight = await ig(
          `${encodeURIComponent(e.platformId!)}/insights`,
          { metric: "views,reach,shares,saved" },
          NEEDS_IG_SCOPE,
        );
        result.metrics = instagramMetrics(insight, basic);
        if (result.metrics.views === null)
          result.issues.push("instagram_views_unavailable");
      } catch (error) {
        const code = issueCode(error);
        result.issues.push(
          code.startsWith("needs_") ? code : `instagram_insights_${code}`,
        );
      }
      return result;
    }
    if (e.provider === "postpeer") {
      if (!process.env.POSTPEER_API_KEY)
        throw new ApiReadError("postpeer_key_missing");
      const data = await pp(`posts/${encodeURIComponent(e.providerId!)}`);
      if (data.post?.postId !== e.providerId)
        throw new ApiReadError("postpeer_post_mismatch");
      const result = postpeerObservation(data, e.state === "draft");
      if (result.state === "published" && remainingCredits > 0) {
        remainingCredits--; // Denemeler (hatalılar dahil) koşu başına açık bütçeden düşer.
        try {
          const analytics = await pp(
            `analytics?postId=${encodeURIComponent(e.providerId!)}`,
          );
          const targets = (analytics.post?.platforms || []).filter(
            (p: any) => p.platform === "tiktok",
          );
          const target = targets.length === 1 ? targets[0] : undefined;
          if (
            !target ||
            (result.platformId && target.platformPostId !== result.platformId)
          )
            throw new ApiReadError("postpeer_metrics_target_mismatch");
          for (const key of Object.keys(result.metrics) as (keyof Metrics)[])
            result.metrics[key] = metric(target.metrics?.[key]);
          if (result.metrics.views === null)
            result.issues.push("postpeer_views_unavailable");
        } catch (error) {
          result.issues.push(`postpeer_metrics_${issueCode(error)}`);
        }
      } else
        result.issues.push(
          result.state === "published"
            ? "postpeer_metrics_budget_disabled_or_exhausted"
            : "metrics_waiting_for_publication",
        );
      return result;
    }
    throw new ApiReadError("legacy_drafts_not_collected");
  };
}
