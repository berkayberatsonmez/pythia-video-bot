// ═══════════════════════════════════════════════════════════════════════════
// verify-analytics.ts — Yayın analitiği testleri (ağ yok, gerçek API yok)
//
//   npm run verify:analytics
//
// Kapsam: günlük yazımı / yeniden deneme / kimlik, sağlayıcı durumları, kısmi
// metrik, PostPeer kredi bütçesi, yaş-penceresi raporu + Pythia'ya özgü:
//   • yetki eksikse (YT readonly / IG insights) FAIL-SOFT "needs_scope:*"
//   • arşiv kontrolü PUBLIC depoya izin verir
//   • yayın yolu davranışı değişmez (uploadVideoFile / postReelFromFile sarmalayıcıları)
//   • günlüğe sır sızmaz
// ═══════════════════════════════════════════════════════════════════════════

import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  realpathSync,
  chmodSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";
import {
  writeEvent,
  writeEventSafe,
  readEvents,
  latestPublications,
  trackPublication,
  emptyMetrics,
  type Event,
} from "./analytics/ledger";
import { buildReport, windowSnapshot } from "./analytics/report";
import {
  ApiReadError,
  createCollector,
  getJson,
  instagramMetrics,
  metric,
  postpeerObservation,
  youtubeObservation,
  classifyGoogleError,
  NEEDS_YT_SCOPE,
  NEEDS_IG_SCOPE,
  parseChannelId,
  parseYoutubeFeed,
  resolveYoutubeChannelId,
} from "./analytics/providers";
import { archiveRepo } from "./analytics/archive";
import { poolKeyFor, publicationContent } from "./analytics/content";
import { uploadVideoFile } from "./upload-youtube";
import { postReelFromFile, buildReelCaption } from "./upload-instagram";
import { POOLS } from "./rotation";

async function main() {
  const temp = mkdtempSync(join(tmpdir(), "pythia-analytics-test-"));
  const saved = {
    dir: process.env.ANALYTICS_DIR,
    ig: process.env.IG_ACCESS_TOKEN,
    pp: process.env.POSTPEER_API_KEY,
    repo: process.env.GITHUB_REPOSITORY,
    path: process.env.PATH,
    fetch: globalThis.fetch,
  };
  process.env.ANALYTICS_DIR = temp;
  try {
    const base = {
      platform: "youtube" as const,
      provider: "youtube" as const,
      content: {
        contentId: "the-tower",
        format: "tarot",
        title: "Test",
        slot: "morning",
      },
    };
    await trackPublication(
      base,
      async () => "ok",
      () => ({
        state: "scheduled" as const,
        platformId: "video-a",
        publishAt: "2026-09-14T10:00:00Z",
      }),
    );
    await assert.rejects(
      trackPublication(
        base,
        async () => {
          throw new Error("secret-token-must-not-be-stored");
        },
        () => ({ state: "submitted" as const }),
      ),
    );
    const events = readEvents();
    assert.equal(events.length, 4);
    assert.deepEqual(
      latestPublications(events).map((e) => e.state),
      ["scheduled", "unknown"],
    );
    assert.ok(
      !readFileSync(join(temp, "events.jsonl"), "utf8").includes(
        "secret-token",
      ),
    );
    mkdirSync(join(temp, "archive"));
    writeFileSync(
      join(temp, "archive/copy.jsonl"),
      readFileSync(join(temp, "events.jsonl")),
    );
    assert.equal(
      readEvents().length,
      4,
      "archive re-import must not double-count events",
    );
    const duplicate = writeEvent({
      ...base,
      kind: "publication",
      attemptId: "second-upload",
      state: "submitted",
      platformId: "video-b",
    });
    assert.equal(
      latestPublications(readEvents()).length,
      3,
      "two platform IDs of one content remain visible",
    );
    await trackPublication(
      base,
      async () => "skipped",
      () => ({ state: "skipped" as const, issues: ["duplicate"] }),
    );
    assert.ok(
      latestPublications(readEvents()).some(
        (e) => e.platformId === "video-a" && e.state === "scheduled",
      ),
    );

    for (const value of [null, undefined, "", false, "nope", -1])
      assert.equal(metric(value), null);
    assert.equal(metric("0"), 0);
    assert.equal(metric("17"), 17);
    const video = {
      id: "video-a",
      snippet: {
        channelId: "UC-pythia",
        publishedAt: "2026-09-14T10:00:00Z",
      },
      status: { uploadStatus: "processed", privacyStatus: "public" },
      statistics: { viewCount: "0", likeCount: "2" },
      contentDetails: { duration: "PT1M2S" },
    };
    const observed = youtubeObservation(video, "UC-pythia");
    assert.equal(observed.state, "published");
    assert.equal(observed.metrics.views, 0);
    assert.equal(observed.metrics.comments, null);
    assert.equal(observed.durationSec, 62);
    assert.equal(
      youtubeObservation({
        ...video,
        status: { privacyStatus: "private", publishAt: "2026-09-20T10:00:00Z" },
      }).state,
      "scheduled",
    );
    assert.equal(
      youtubeObservation({
        ...video,
        status: { privacyStatus: "unlisted", uploadStatus: "processed" },
      }).state,
      "unlisted",
    );
    assert.equal(
      youtubeObservation({ ...video, status: { uploadStatus: "rejected" } })
        .state,
      "failed",
    );
    assert.equal(youtubeObservation(undefined).state, "unknown");
    assert.throws(() =>
      youtubeObservation(
        { ...video, snippet: { channelId: "wrong" } },
        "UC-pythia",
      ),
    );

    assert.equal(
      instagramMetrics(
        { data: [{ name: "views", values: [{ value: 0 }] }] },
        {},
      ).views,
      0,
    );
    assert.equal(instagramMetrics({}, {}).views, null);
    assert.equal(
      instagramMetrics(
        { data: [{ name: "saved", total_value: { value: 4 } }] },
        {},
      ).saves,
      4,
    );
    assert.equal(
      postpeerObservation({
        success: true,
        status: "publishing",
        platforms: [{ platform: "tiktok", success: true }],
      }).state,
      "submitted",
    );
    const ppBody = {
      success: true,
      post: {
        postId: "p1",
        platforms: [
          {
            platform: "tiktok",
            status: "published",
            platformPostId: "tt1",
            publishedAt: "2026-09-14T10:00:00Z",
          },
        ],
      },
    };
    assert.equal(postpeerObservation(ppBody).state, "published");
    assert.equal(
      postpeerObservation(ppBody, true).state,
      "draft",
      "drafts cannot be counted as confirmed public posts",
    );
    assert.equal(
      postpeerObservation({
        post: { platforms: [{ platform: "tiktok", status: "failed" }] },
      }).state,
      "failed",
    );
    assert.equal(postpeerObservation({ success: true }).state, "unknown");

    process.env.POSTPEER_API_KEY = "test-only";
    let analyticsCalls = 0;
    const fakeFetch = (async (url: string | URL | Request) => {
      if (String(url).includes("/analytics?")) {
        analyticsCalls++;
        return new Response(
          JSON.stringify({
            post: {
              platforms: [
                {
                  platform: "tiktok",
                  platformPostId: "tt1",
                  metrics: { views: 321, likes: 0 },
                },
              ],
            },
          }),
        );
      }
      return new Response(JSON.stringify(ppBody));
    }) as typeof fetch;
    const tt: Event = {
      ...duplicate,
      platform: "tiktok",
      provider: "postpeer",
      providerId: "p1",
      platformId: undefined,
    };
    const noCreditCollector = createCollector(
      { postpeerMetricsBudget: 0 },
      fakeFetch,
    );
    assert.equal((await noCreditCollector(tt)).state, "published");
    assert.equal(
      analyticsCalls,
      0,
      "default TikTok status checks must not call paid analytics",
    );
    const creditCollector = createCollector(
      { postpeerMetricsBudget: 1 },
      fakeFetch,
    );
    assert.equal((await creditCollector(tt)).metrics.views, 321);
    assert.equal((await creditCollector(tt)).metrics.views, null);
    assert.equal(analyticsCalls, 1, "budget bounds actual analytics requests");

    process.env.IG_ACCESS_TOKEN = "test-only";
    const igFetch = (async (url: string | URL | Request) => {
      if (String(url).includes("/insights?"))
        return new Response("access_token=test-only", { status: 403 });
      return new Response(
        JSON.stringify({ id: "ig1", like_count: 9, comments_count: 0 }),
      );
    }) as typeof fetch;
    const igEvent: Event = {
      ...duplicate,
      platform: "instagram",
      provider: "instagram",
      platformId: "ig1",
    };
    const ig = await createCollector({ postpeerMetricsBudget: 0 }, igFetch)(
      igEvent,
    );
    assert.equal(ig.state, "published");
    assert.equal(ig.metrics.likes, 9);
    assert.equal(ig.metrics.views, null);
    assert.deepEqual(
      ig.issues,
      [NEEDS_IG_SCOPE],
      "IG insights 403 → fail-soft needs_scope, no throw",
    );
    // Meta izin hatası çoğu zaman HTTP 400 + error.code 10 ile gelir.
    const igCode10 = await createCollector(
      { postpeerMetricsBudget: 0 },
      (async (url: string | URL | Request) =>
        String(url).includes("/insights?")
          ? new Response(
              JSON.stringify({ error: { code: 10, message: "SECRET-MSG" } }),
              { status: 400 },
            )
          : new Response(JSON.stringify({ id: "ig1", like_count: 1 }))) as typeof fetch,
    )(igEvent);
    assert.deepEqual(igCode10.issues, [NEEDS_IG_SCOPE]);
    assert.ok(!JSON.stringify(igCode10).includes("SECRET-MSG"));
    // Başka bir hata (429) yetki sorunu gibi etiketlenmez.
    const ig429 = await createCollector(
      { postpeerMetricsBudget: 0 },
      (async (url: string | URL | Request) =>
        String(url).includes("/insights?")
          ? new Response("{}", { status: 429 })
          : new Response(JSON.stringify({ id: "ig1" }))) as typeof fetch,
    )(igEvent);
    assert.deepEqual(ig429.issues, ["instagram_insights_http_429"]);
    // İzlenme süresi metrikleri: HER BİRİ AYRI çağrı; biri desteklenmezse (400) diğerleri ve
    // temel metrikler snapshot'ta kalır, yalnız o metrik null + sorun kodu.
    const watchCalls: string[] = [];
    const igWatch = await createCollector(
      { postpeerMetricsBudget: 0 },
      (async (url: string | URL | Request) => {
        const u = String(url);
        if (!u.includes("/insights?"))
          return new Response(JSON.stringify({ id: "ig1", like_count: 3 }));
        const metric = new URL(u).searchParams.get("metric")!;
        watchCalls.push(metric);
        if (metric === "ig_reels_video_view_total_time")
          return new Response(JSON.stringify({ error: { code: 100 } }), { status: 400 });
        const value: Record<string, number> = {
          "views,reach,shares,saved": 0,
          ig_reels_avg_watch_time: 4210,
          total_interactions: 17,
        };
        const rows =
          metric === "views,reach,shares,saved"
            ? [
                { name: "views", values: [{ value: 120 }] },
                { name: "reach", values: [{ value: 90 }] },
                { name: "shares", values: [{ value: 4 }] },
                { name: "saved", values: [{ value: 5 }] },
              ]
            : [{ name: metric, values: [{ value: value[metric] }] }];
        return new Response(JSON.stringify({ data: rows }));
      }) as typeof fetch,
    )(igEvent);
    assert.deepEqual(watchCalls, [
      "views,reach,shares,saved",
      "ig_reels_avg_watch_time",
      "ig_reels_video_view_total_time",
      "total_interactions",
    ]);
    assert.equal(igWatch.metrics.views, 120);
    assert.equal(igWatch.metrics.saves, 5);
    assert.equal(igWatch.metrics.avgWatchTimeMs, 4210);
    assert.equal(igWatch.metrics.totalInteractions, 17);
    assert.equal(igWatch.metrics.totalWatchTimeMs, undefined, "desteklenmeyen metrik null/undefined, snapshot düşmez");
    assert.deepEqual(igWatch.issues, ["instagram_ig_reels_video_view_total_time_http_400"]);
    // Eski şema: ek alan yok → emptyMetrics aynı kalır (okuyucular etkilenmez).
    assert.ok(!("avgWatchTimeMs" in emptyMetrics()));
    await assert.rejects(
      getJson(
        "https://example.invalid",
        {},
        (async () =>
          new Response("token=SECRET", { status: 429 })) as typeof fetch,
      ),
      /http_429/,
    );

    // ── YouTube: token yalnız youtube.upload → readonly çağrıları 403 ──
    const scopeError = Object.assign(
      new Error("Request had insufficient authentication scopes."),
      { code: 403 },
    );
    assert.equal(classifyGoogleError(scopeError), NEEDS_YT_SCOPE);
    assert.equal(
      classifyGoogleError({
        code: 403,
        errors: [{ reason: "quotaExceeded" }],
        message: "quota",
      }),
      "youtube_quota_exceeded",
    );
    assert.equal(
      classifyGoogleError(new Error("invalid_grant")),
      "needs_reauth:youtube",
    );
    assert.equal(classifyGoogleError({ code: "500" }), "youtube_http_500");
    let ytCalls = 0;
    const scopeCollector = createCollector(
      { postpeerMetricsBudget: 0 },
      fetch,
      async () =>
        ({
          channels: {
            list: async () => {
              ytCalls++;
              throw scopeError;
            },
          },
          videos: { list: async () => assert.fail("videos.list çağrılmamalı") },
        }) as never,
    );
    const ytEvent: Event = {
      ...duplicate,
      provider: "youtube",
      platform: "youtube",
      platformId: "video-a",
    };
    process.env.YT_RSS_FALLBACK = "0"; // bu blok yalnız OAuth yolunu sınar
    for (let i = 0; i < 2; i++)
      await assert.rejects(scopeCollector(ytEvent), (e: unknown) => {
        assert.ok(e instanceof ApiReadError);
        assert.equal(e.code, NEEDS_YT_SCOPE);
        return true;
      });
    delete process.env.YT_RSS_FALLBACK;
    assert.equal(ytCalls, 1, "yetki hatası sonrası diğer videolar için API tekrar çağrılmaz");
    // Yetki VARSA: kanal doğrulanır, sayaçlar okunur.
    const okCollector = createCollector(
      { postpeerMetricsBudget: 0 },
      fetch,
      async () =>
        ({
          channels: { list: async () => ({ data: { items: [{ id: "UC-pythia" }] } }) },
          videos: { list: async () => ({ data: { items: [video] } }) },
        }) as never,
    );
    const okYt = await okCollector(ytEvent);
    assert.equal(okYt.state, "published");
    assert.equal(okYt.metrics.views, 0);
    const otherChannel = createCollector(
      { postpeerMetricsBudget: 0 },
      fetch,
      async () =>
        ({
          channels: { list: async () => ({ data: { items: [{ id: "UC-other" }] } }) },
          videos: { list: async () => ({ data: { items: [video] } }) },
        }) as never,
    );
    await assert.rejects(otherChannel(ytEvent), /youtube_channel_mismatch/);

    // ── YouTube RSS yedeği (OAuth'suz izlenme) — sabit veriyle, ağ yok ──
    const CHANNEL = "UC" + "a".repeat(22);
    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <title>Pythia</title><published>2025-01-01T00:00:00+00:00</published>
 <entry><id>yt:video:AAAAAAAAAAA</id><yt:videoId>AAAAAAAAAAA</yt:videoId><title>Bir</title>
  <published>2026-10-01T10:00:00+00:00</published>
  <media:group><media:community><media:starRating count="3" average="5.00" min="1" max="5"/><media:statistics views="1234"/></media:community></media:group></entry>
 <entry><yt:videoId>BBBBBBBBBBB</yt:videoId><published>2026-10-02T10:00:00+00:00</published>
  <media:group><media:title>statistics yok</media:title></media:group></entry>
 <entry><title>videoId yok</title></entry>
</feed>`;
    const parsed = parseYoutubeFeed(feedXml);
    assert.equal(parsed.length, 2, "videoId'siz girdi atlanır");
    assert.deepEqual(parsed[0], {
      videoId: "AAAAAAAAAAA",
      publishedAt: "2026-10-01T10:00:00+00:00",
      views: 1234,
    });
    assert.equal(parsed[1].views, null, "statistics yoksa null");
    assert.deepEqual(parseYoutubeFeed("not xml"), []);

    assert.equal(
      parseChannelId(
        `<link rel="canonical" href="https://www.youtube.com/channel/${CHANNEL}"><script>{"channelId":"UC${"b".repeat(22)}"}</script>`,
      ),
      CHANNEL,
      "canonical link önceliklidir",
    );
    assert.equal(parseChannelId(`x{"channelId":"${CHANNEL}"}y`), CHANNEL);
    assert.equal(parseChannelId(`{"externalId":"${CHANNEL}"}`), CHANNEL);
    assert.equal(parseChannelId(`{"channelId":"UCkisa"}`), undefined);
    assert.equal(parseChannelId("<html></html>"), undefined);

    const calls: string[] = [];
    const rssFetch = (async (url: string, init?: RequestInit) => {
      calls.push(String(url));
      assert.ok(init?.signal, "zaman aşımı sinyali olmalı");
      assert.match(
        String((init?.headers as Record<string, string>)["User-Agent"]),
        /Mozilla\/5\.0/,
      );
      if (String(url).includes("/feeds/videos.xml")) {
        assert.ok(String(url).endsWith(`channel_id=${CHANNEL}`));
        return new Response(feedXml);
      }
      assert.match(String(url), /youtube\.com\/@\w+$/);
      return new Response(`<link rel="canonical" href="https://www.youtube.com/channel/${CHANNEL}">`);
    }) as unknown as typeof fetch;
    const rssDir = mkdtempSync(join(tmpdir(), "pythia-analytics-rss-"));
    const savedRss = {
      dir: process.env.ANALYTICS_DIR,
      id: process.env.YT_CHANNEL_ID,
      handle: process.env.YT_CHANNEL_HANDLE,
    };
    process.env.ANALYTICS_DIR = rssDir;
    delete process.env.YT_CHANNEL_ID;
    delete process.env.YT_CHANNEL_HANDLE;
    try {
      // Handle → kanal ID, sonra önbellekten (ikinci çağrıda ağ yok).
      assert.equal(await resolveYoutubeChannelId(rssFetch, 0), CHANNEL);
      assert.equal(calls.length, 1);
      assert.ok(calls[0].endsWith("/@Pythiamystic"), "varsayılan handle");
      assert.equal(await resolveYoutubeChannelId(rssFetch, 0), CHANNEL);
      assert.equal(calls.length, 1, "önbellek varken handle sorgusu atlanır");
      process.env.YT_CHANNEL_HANDLE = "@baskaKanal";
      rmSync(join(rssDir, "yt-channel-id.json"));
      assert.equal(await resolveYoutubeChannelId(rssFetch, 0), CHANNEL);
      assert.ok(calls[1].endsWith("/@baskaKanal"));
      delete process.env.YT_CHANNEL_HANDLE;
      process.env.YT_CHANNEL_ID = `UC${"c".repeat(22)}`;
      assert.equal(await resolveYoutubeChannelId(rssFetch, 0), process.env.YT_CHANNEL_ID);
      assert.equal(calls.length, 2, "YT_CHANNEL_ID varken ağ yok");
      delete process.env.YT_CHANNEL_ID;
      rmSync(join(rssDir, "yt-channel-id.json"), { force: true });

      // Yetki hatası → RSS: feed'deki video dolar, eksik/eski olanlar null + sorun kodu.
      const noScope = () =>
        ({
          channels: { list: async () => { throw scopeError; } },
          videos: { list: async () => assert.fail("videos.list çağrılmamalı") },
        }) as never;
      calls.length = 0;
      const rssCollector = createCollector(
        { postpeerMetricsBudget: 0, rssRetryDelayMs: 0 },
        rssFetch,
        noScope,
      );
      const inFeed = await rssCollector({ ...ytEvent, platformId: "AAAAAAAAAAA" });
      assert.equal(inFeed.metrics.views, 1234);
      assert.equal(inFeed.metrics.likes, null);
      assert.equal(inFeed.metrics.comments, null);
      assert.equal(inFeed.state, "published");
      assert.equal(inFeed.publishedAt, "2026-10-01T10:00:00+00:00");
      assert.ok(inFeed.issues.includes("views_source:rss"));
      assert.ok(inFeed.issues.includes(NEEDS_YT_SCOPE));
      const noStats = await rssCollector({ ...ytEvent, platformId: "BBBBBBBBBBB" });
      assert.equal(noStats.metrics.views, null);
      assert.ok(noStats.issues.includes("rss_statistics_missing"));
      const old = await rssCollector({ ...ytEvent, platformId: "OLDOLDOLD11" });
      assert.equal(old.metrics.views, null);
      assert.equal(old.state, "unknown");
      assert.deepEqual(old.issues, [NEEDS_YT_SCOPE, "views_source:rss_not_in_feed"]);
      assert.equal(
        calls.filter((c) => c.includes("/feeds/")).length,
        1,
        "feed koşu başına bir kez çekilir",
      );

      // Kimlik dosyası hiç yok (varsayılan üretici scripts/token.json arar) → yine RSS.
      const noCreds = await createCollector(
        { postpeerMetricsBudget: 0, rssRetryDelayMs: 0 },
        rssFetch,
        async () => {
          throw new ApiReadError("youtube_credentials_missing");
        },
      )({ ...ytEvent, platformId: "AAAAAAAAAAA" });
      assert.equal(noCreds.metrics.views, 1234);

      // Yedek YALNIZ yetki/kimlik hatasında seçilir: kota, yeniden-yetki ve başarılı OAuth'ta ağ yok.
      calls.length = 0;
      for (const failure of [
        Object.assign(new Error("quota"), { code: 403, errors: [{ reason: "quotaExceeded" }] }),
        new Error("invalid_grant"),
        Object.assign(new Error("boom"), { code: 500 }),
      ])
        await assert.rejects(
          createCollector({ postpeerMetricsBudget: 0, rssRetryDelayMs: 0 }, rssFetch, async () =>
            ({ channels: { list: async () => { throw failure; } } }) as never,
          )(ytEvent),
          ApiReadError,
        );
      await okCollector(ytEvent);
      assert.equal(calls.length, 0, "yetki hatası dışında RSS çağrılmaz");

      // Ağ hatası → fırlatmaz; sorun kodu "rss_unavailable". Yeniden deneme: 2 deneme / istek.
      let attempts = 0;
      const dead = (async () => {
        attempts++;
        throw new TypeError("fetch failed");
      }) as unknown as typeof fetch;
      const down = await createCollector(
        { postpeerMetricsBudget: 0, rssRetryDelayMs: 0 },
        dead,
        noScope,
      )(ytEvent);
      assert.deepEqual(down.issues, [NEEDS_YT_SCOPE, "rss_unavailable"]);
      assert.equal(down.metrics.views, null);
      assert.equal(attempts, 2, "tek yeniden deneme");
      // Handle sayfası çözümlenemez / feed 404 / bozuk gövde: yine sessizce rss_unavailable.
      for (const bad of [
        async () => new Response("<html>kanal yok</html>"),
        async () => new Response("yok", { status: 404 }),
        async (url: string) =>
          url.includes("/feeds/")
            ? new Response("<html>not a feed</html>")
            : new Response(`"channelId":"${CHANNEL}"`),
      ])
        assert.deepEqual(
          (
            await createCollector(
              { postpeerMetricsBudget: 0, rssRetryDelayMs: 0 },
              bad as unknown as typeof fetch,
              noScope,
            )(ytEvent)
          ).issues,
          [NEEDS_YT_SCOPE, "rss_unavailable"],
        );
      // 5xx bir kez yeniden denenir ve toparlanırsa kullanılır.
      let flaky = 0;
      const recovering = (async (url: string) => {
        if (String(url).includes("/feeds/")) {
          if (flaky++ === 0) return new Response("", { status: 503 });
          return new Response(feedXml);
        }
        return new Response(`"channelId":"${CHANNEL}"`);
      }) as unknown as typeof fetch;
      const recovered = await createCollector(
        { postpeerMetricsBudget: 0, rssRetryDelayMs: 0 },
        recovering,
        noScope,
      )({ ...ytEvent, platformId: "AAAAAAAAAAA" });
      assert.equal(recovered.metrics.views, 1234);
    } finally {
      for (const [key, value] of Object.entries({
        ANALYTICS_DIR: savedRss.dir,
        YT_CHANNEL_ID: savedRss.id,
        YT_CHANNEL_HANDLE: savedRss.handle,
      })) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      rmSync(rssDir, { recursive: true, force: true });
    }

    // ── CLI uçtan uca: yetki/kimlik yok → snapshot'a sorun yazılır, çıkış kodu 0 ──
    const cliDir = mkdtempSync(join(tmpdir(), "pythia-analytics-cli-"));
    const cliLedger = join(cliDir, "ledger");
    mkdirSync(cliLedger);
    writeFileSync(
      join(cliLedger, "events.jsonl"),
      JSON.stringify({
        ...duplicate,
        platform: "youtube",
        provider: "youtube",
        platformId: "video-a",
        at: new Date().toISOString(),
      }) + "\n",
    );
    const cli = spawnSync(
      join(process.cwd(), "node_modules", ".bin", "tsx"),
      [join(process.cwd(), "scripts", "analytics.ts"), "collect"],
      {
        cwd: cliDir, // scripts/token.json yok → youtube_credentials_missing
        env: { ...process.env, ANALYTICS_DIR: cliLedger, YT_RSS_FALLBACK: "0" }, // ağsız, deterministik
        encoding: "utf8",
      },
    );
    assert.equal(cli.status, 0, `collect fail-soft olmalı: ${cli.stderr}`);
    const snapshots = readEvents(cliLedger).filter((e) => e.kind === "snapshot");
    assert.equal(snapshots.length, 1);
    assert.deepEqual(snapshots[0].issues, ["youtube_credentials_missing"]);
    rmSync(cliDir, { recursive: true, force: true });

    // ── Arşiv: PUBLIC depo bilinçli olarak İZİN VERİLİR (Conveyor'daki private-only kontrolü yok) ──
    process.env.GITHUB_REPOSITORY = "berkayberatsonmez/pythia-video-bot";
    const asked: string[][] = [];
    assert.equal(
      archiveRepo((args) => {
        asked.push(args);
        return JSON.stringify({ name: "pythia-video-bot", isPrivate: false });
      }),
      "berkayberatsonmez/pythia-video-bot",
      "public repo must be accepted for the analytics archive",
    );
    assert.deepEqual(asked[0].slice(0, 2), ["repo", "view"]);
    process.env.GITHUB_REPOSITORY = "bad repo; rm -rf";
    assert.throws(() => archiveRepo(() => "{}"), /Invalid analytics archive/);
    process.env.GITHUB_REPOSITORY = "berkayberatsonmez/pythia-video-bot";
    assert.throws(
      () =>
        archiveRepo(() => {
          throw new Error("gh failed");
        }),
      /gh failed/,
      "erişilemeyen depo sessizce geçmemeli",
    );

    // ── Sır koruması ──
    process.env.IG_ACCESS_TOKEN = "IGAAsecretsecretsecret1234567890";
    assert.throws(
      () =>
        writeEvent({
          ...base,
          kind: "publication",
          attemptId: "leak",
          state: "failed",
          issues: ["x " + process.env.IG_ACCESS_TOKEN],
        }),
      /contains_secret/,
    );
    assert.throws(() =>
      writeEvent({
        ...base,
        kind: "publication",
        attemptId: "leak2",
        state: "failed",
        url: "https://graph.instagram.com/x?access_token=abc",
      }),
    );
    assert.equal(
      writeEventSafe({
        ...base,
        kind: "publication",
        attemptId: "leak3",
        state: "failed",
        issues: [process.env.IG_ACCESS_TOKEN],
      }),
      undefined,
      "safe writer swallows",
    );
    assert.ok(
      !readFileSync(join(temp, "events.jsonl"), "utf8").includes("secretsecret"),
    );
    process.env.IG_ACCESS_TOKEN = "test-only";

    // ── İçerik: format = rotasyon havuzu, contentId = öğe id'si ──
    const angelId = POOLS.angel.ids[0];
    const lifeId = POOLS.numerology.ids[0];
    assert.equal(poolKeyFor("number", angelId), "angel");
    assert.equal(poolKeyFor("number", lifeId), "numerology");
    assert.equal(poolKeyFor("tarot", POOLS.tarot.ids[0]), "tarot");
    assert.equal(poolKeyFor("bilinmeyen", "x"), "bilinmeyen");
    const yc = publicationContent("youtube", "tarot", POOLS.tarot.ids[0], {
      slot: "evening",
    });
    assert.equal(yc.format, "tarot");
    assert.equal(yc.contentId, POOLS.tarot.ids[0]);
    assert.equal(yc.slot, "evening");
    assert.ok(yc.title && yc.hook, "title + hook dolu");
    assert.equal(
      publicationContent("instagram", "tarot", POOLS.tarot.ids[0]).title,
      publicationContent("instagram", "tarot", POOLS.tarot.ids[0]).hook,
    );
    // metadata üretilemeyen kimlik: fırlatmaz, düşük ayrıntıya iner.
    const unknown = publicationContent("youtube", "tarot", "yok-boyle-bir-id");
    assert.equal(unknown.contentId, "yok-boyle-bir-id");

    // ── Yayın yolu DAVRANIŞI DEĞİŞMEZ ──
    // 1) trackPublication: aynı dönüş, aynı Error nesnesi, send tam 1 kez.
    const marker = new Error("boom");
    let sends = 0;
    await assert.rejects(
      trackPublication(
        base,
        async () => {
          sends++;
          throw marker;
        },
        () => ({ state: "submitted" as const }),
      ),
      (e: unknown) => e === marker,
    );
    assert.equal(sends, 1);
    // 2) Günlük dizini YAZILAMAZ olsa da (dosya, dizin değil) yayın sonucu aynı.
    const blocked = join(temp, "not-a-dir");
    writeFileSync(blocked, "x");
    process.env.ANALYTICS_DIR = join(blocked, "ledger");
    sends = 0;
    const returned = await trackPublication(
      base,
      async () => {
        sends++;
        return { sentinel: 42 };
      },
      () => {
        throw new Error("describe patlasa da yayın sonucu korunmalı");
      },
    );
    assert.deepEqual(returned, { sentinel: 42 });
    assert.equal(sends, 1, "journal yazım hatası yeniden-gönderime yol açmaz");
    // 3) uploadVideoFile: sahte OAuth istemcisi; dönüş değeri/hata aynı, günlük bozuk dizinde bile.
    const videoFile = join(temp, "v.mp4");
    writeFileSync(videoFile, "fake");
    const requests: any[] = [];
    const fakeAuth = (impl: (o: any) => any) => ({
      request: async (o: any) => {
        requests.push(o);
        return impl(o);
      },
      // googleapis, auth nesnesinden bunları da yoklayabilir
      getRequestHeaders: async () => ({}),
    });
    const tarotId = POOLS.tarot.ids[0];
    const url = await uploadVideoFile(
      fakeAuth(() => ({ data: { id: "vid-123" }, status: 200 })) as never,
      videoFile,
      "tarot",
      tarotId,
      "public",
      "2030-01-01T10:00:00.000Z",
      { slot: "morning", format: "tarot" },
    );
    assert.equal(url, "https://youtube.com/shorts/vid-123");
    assert.equal(requests.length, 1, "tek videos.insert isteği");
    const ytBody = JSON.stringify(requests[0].body ?? requests[0].data ?? requests[0]);
    assert.ok(ytBody.includes("private") || requests[0].params, "insert isteği gönderildi");
    const uploadFailure = new Error("upload exploded");
    await assert.rejects(
      uploadVideoFile(
        fakeAuth(() => {
          throw uploadFailure;
        }) as never,
        videoFile,
        "tarot",
        tarotId,
        "public",
      ),
      (e: unknown) => e === uploadFailure || (e as Error).message === "upload exploded",
    );
    // Günlük DOĞRU dizindeyken kayıtlar: started + scheduled, ve started + unknown.
    process.env.ANALYTICS_DIR = join(temp, "journal2");
    requests.length = 0;
    await uploadVideoFile(
      fakeAuth(() => ({ data: { id: "vid-9" }, status: 200 })) as never,
      videoFile,
      "tarot",
      tarotId,
      "public",
      "2030-01-01T10:00:00.000Z",
      { slot: "evening", format: "tarot" },
    );
    const ytEvents = readEvents().filter((e) => e.kind === "publication");
    assert.deepEqual(ytEvents.map((e) => e.state), ["started", "scheduled"]);
    assert.equal(ytEvents[1].platformId, "vid-9");
    assert.equal(ytEvents[1].content.contentId, tarotId);
    assert.equal(ytEvents[1].content.slot, "evening");
    assert.equal(ytEvents[1].publishAt, "2030-01-01T10:00:00.000Z");
    // 4) postReelFromFile — "skipped" yolu (mükerrer): ağ çağrısı yalnız media listesi, gh YOK.
    const caption = buildReelCaption("tarot", tarotId);
    const hook = caption.split("\n")[0].trim();
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          data: [{ caption: hook + "\nx", timestamp: new Date().toISOString() }],
        }),
      )) as typeof fetch;
    const skipped = await postReelFromFile(videoFile, "tarot", tarotId, "reels-test", {
      slot: "morning",
    });
    assert.equal(skipped, "skipped", "mükerrer koruması aynen çalışır");
    assert.ok(
      readEvents().some((e) => e.platform === "instagram" && e.state === "skipped"),
    );
    // 5) postReelFromFile — gh BAŞARISIZ: orijinal hata yayılır, 'unknown' kaydı düşer, yorum denenmez.
    const shim = mkdtempSync(join(tmpdir(), "pythia-gh-shim-"));
    writeFileSync(join(shim, "gh"), "#!/bin/sh\nexit 1\n");
    chmodSync(join(shim, "gh"), 0o755);
    process.env.PATH = `${shim}:${saved.path}`;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ data: [] }))) as typeof fetch;
    await assert.rejects(
      postReelFromFile(videoFile, "tarot", tarotId, "reels-test"),
      /gh release upload başarısız/,
    );
    process.env.PATH = saved.path;
    rmSync(shim, { recursive: true, force: true });
    assert.ok(
      readEvents().some((e) => e.platform === "instagram" && e.state === "unknown"),
    );
    globalThis.fetch = saved.fetch;
    process.env.ANALYTICS_DIR = temp;

    const publication = {
      ...duplicate,
      at: "2026-09-14T10:00:00Z",
      publishedAt: "2026-09-14T10:00:00Z",
      state: "published" as const,
    };
    const snap = (at: string, views: number | null): Event => ({
      ...publication,
      kind: "snapshot",
      at,
      eventId: at,
      metrics: { ...emptyMetrics(), views },
    });
    const history = [
      snap("2026-09-14T11:00:00Z", 5),
      snap("2026-09-15T11:00:00Z", 100),
      snap("2026-09-15T12:00:00Z", 120),
      snap("2026-09-21T11:00:00Z", 1000),
    ];
    assert.equal(windowSnapshot(history, 24, 48)?.metrics?.views, 100);
    assert.equal(windowSnapshot(history, 168, 192)?.metrics?.views, 1000);
    assert.equal(windowSnapshot([history[0]], 24, 48), undefined);
    const report = buildReport(
      [publication, ...history],
      Date.parse("2026-09-22T12:00:00Z"),
    );
    assert.ok(report.includes("| 1 | 1 | 100 | 1 | 1000 |"));
    assert.ok(buildReport([]).includes("Henüz kayıt yok"));
    console.log(
      "Analytics: journaling, retries, identity, provider states, partial metrics, credit budget, age-window reports, fail-soft scopes, YouTube RSS fallback, public-repo archive, secret guard and unchanged-publish-path passed.",
    );
  } finally {
    for (const [key, value] of Object.entries({
      ANALYTICS_DIR: saved.dir,
      IG_ACCESS_TOKEN: saved.ig,
      POSTPEER_API_KEY: saved.pp,
      GITHUB_REPOSITORY: saved.repo,
      PATH: saved.path,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    globalThis.fetch = saved.fetch;
    // Sahte upload'larda açılıp tüketilmeyen ReadStream'ler temp silinmeden açılsın.
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.equal(dirname(realpathSync(temp)), realpathSync(tmpdir()));
    assert.ok(basename(temp).startsWith("pythia-analytics-test-"));
    rmSync(temp, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
