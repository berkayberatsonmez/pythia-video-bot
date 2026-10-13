// ═══════════════════════════════════════════════════════════════════════════
// analytics/ledger.ts — Yayın günlüğü (append-only JSONL) + okuma yardımcıları
//
// İki tür kayıt: "publication" (started/submitted/published/skipped/failed…) ve
// "snapshot" (yayın sonrası ölçüm). Conveyor Sort bot'undaki şemanın birebir
// aynısı — iki hattın raporları aynı biçimde okunur.
//
// ⚠️ Yayın yolu (upload-youtube / upload-instagram / record-postpeer) bunu
//    çağırır: buradaki HİÇBİR hata yayını bozmamalı. trackPublication bu yüzden
//    yazma hatalarını yutar (uyarı basar), yükleme hatasını ise AYNEN yeniden fırlatır.
// ═══════════════════════════════════════════════════════════════════════════

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";

export type Platform = "youtube" | "instagram" | "tiktok";
export type PublishState =
  | "started"
  | "submitted"
  | "scheduled"
  | "published"
  | "draft"
  | "skipped"
  | "failed"
  | "unknown"
  | "private"
  | "unlisted";
export type Content = {
  contentId: string; // rotasyondaki öğe id'si (örn. "the-tower", "yilan")
  format: string; // rotasyon havuzu: dream/tarot/zodiac/angel/manifest…
  title: string;
  slot?: string;
  hook?: string;
  props?: Record<string, unknown>;
  durationSec?: number;
};
export type Metrics = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  reach: number | null;
  // Opsiyonel (eski satırlar/okuyucular etkilenmez; emptyMetrics'e KONMAZ): IG Reels izlenme süresi.
  avgWatchTimeMs?: number | null; // ig_reels_avg_watch_time (ms)
  totalWatchTimeMs?: number | null; // ig_reels_video_view_total_time (ms)
  totalInteractions?: number | null; // total_interactions
};
export type Event = {
  schema: 1;
  eventId: string;
  at: string;
  runId: string;
  revision?: string;
  kind: "publication" | "snapshot";
  platform: Platform;
  provider: "youtube" | "instagram" | "postpeer" | "tiktok-drafts";
  attemptId: string;
  content: Content;
  state: PublishState;
  platformId?: string;
  providerId?: string;
  url?: string;
  publishAt?: string;
  publishedAt?: string;
  metrics?: Metrics;
  issues?: string[];
};
export type EventInput = Omit<
  Event,
  "schema" | "eventId" | "at" | "runId" | "revision"
>;
export const emptyMetrics = (): Metrics => ({
  views: null,
  likes: null,
  comments: null,
  shares: null,
  saves: null,
  reach: null,
});
export const ledgerDir = () =>
  process.env.ANALYTICS_DIR || join(process.cwd(), "out", "analytics");
export const localJournal = () => join(ledgerDir(), "events.jsonl");

// Günlük PUBLIC depoda arşivlenir (bkz. archive.ts) → içine sır sızmamalı.
// Savunma katmanı: ortamdaki gizli değerlerden biri ya da bilinen token
// kalıpları satırda geçiyorsa kayıt YAZILMAZ (throw → çağıran yutar).
const SECRET_ENV = [
  "IG_ACCESS_TOKEN",
  "POSTPEER_API_KEY",
  "POSTPEER_ACCOUNT_ID",
  "GOOGLE_TOKEN_B64",
  "GOOGLE_CREDENTIALS_B64",
  "TIKTOK_CLIENT_SECRET",
  "TIKTOK_REFRESH_TOKEN",
  "GH_TOKEN",
];
const SECRET_PATTERNS = [
  /access_token=/i,
  /bearer\s+[\w.-]{8,}/i,
  /\bya29\.[\w-]+/,
  /\b1\/\/[\w-]{20,}/,
  /\b(?:EAA|IGAA)[\w-]{20,}/,
  /\bgh[pousr]_[\w]{20,}/,
];
export function assertNoSecrets(line: string): void {
  for (const name of SECRET_ENV) {
    const value = (process.env[name] || "").trim();
    if (value.length >= 8 && line.includes(value))
      throw new Error("analytics_event_contains_secret");
  }
  if (SECRET_PATTERNS.some((p) => p.test(line)))
    throw new Error("analytics_event_contains_secret");
}

export function writeEvent(input: EventInput): Event {
  const event: Event = {
    ...input,
    schema: 1,
    eventId: randomUUID(),
    at: new Date().toISOString(),
    runId: process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT || "1"}`
      : "local",
    revision: process.env.GITHUB_SHA,
  };
  const line = JSON.stringify(event);
  assertNoSecrets(line);
  mkdirSync(ledgerDir(), { recursive: true });
  // Her olay hemen eklenir (istekten ÖNCEKİ niyet dahil). Token / ham API hatası YOK.
  appendFileSync(localJournal(), line + "\n", "utf8");
  return event;
}

/** Yayın yolunda kullanılan güvenli yazım: asla fırlatmaz. */
export function writeEventSafe(input: EventInput): Event | undefined {
  try {
    return writeEvent(input);
  } catch {
    console.warn(
      "::warning::Yayın kaydı yazılamadı (analytics); yayın akışı etkilenmedi.",
    );
    return undefined;
  }
}

export function readEvents(dir = ledgerDir()): Event[] {
  if (!existsSync(dir)) return [];
  const all = new Map<string, Event>();
  const visit = (path: string) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const file = join(path, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith(".jsonl")) {
        for (const line of readFileSync(file, "utf8")
          .split(/\r?\n/)
          .filter(Boolean)) {
          const e = JSON.parse(line) as Event;
          if (
            e.schema !== 1 ||
            !e.eventId ||
            !e.at ||
            !e.content?.contentId ||
            !e.attemptId ||
            !["publication", "snapshot"].includes(e.kind)
          ) {
            throw new Error(`Invalid analytics event in ${entry.name}`);
          }
          const previous = all.get(e.eventId);
          if (previous && JSON.stringify(previous) !== JSON.stringify(e))
            throw new Error("Conflicting analytics event IDs");
          all.set(e.eventId, e);
        }
      }
    }
  };
  visit(dir);
  return [...all.values()].sort((a, b) => a.at.localeCompare(b.at));
}

export function publicationKey(e: Event): string {
  // Platform kimliği öncelikli: aynı içeriğin iki kazara yüklemesi iki satır kalır.
  return `${e.platform}:${e.provider}:${e.providerId || e.platformId || e.attemptId}`;
}

export function latestPublications(events: Event[]): Event[] {
  const attempts = new Map<string, Event>();
  for (const e of events)
    if (e.kind === "publication") attempts.set(e.attemptId, e);
  const videos = new Map<string, Event>();
  for (const e of attempts.values()) videos.set(publicationKey(e), e);
  return [...videos.values()];
}

export function contentFingerprint(content: Content): string {
  return createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex")
    .slice(0, 16);
}

/**
 * Bir yükleme çağrısını günlüğe sarar. DAVRANIŞ GARANTİSİ:
 *  - `send` AYNEN çalışır; dönüş değeri / fırlattığı hata değişmez
 *    (aynı Error nesnesi yeniden fırlatılır).
 *  - Günlük yazımının (başlangıç dahil) her hatası yutulur → yayın asla bozulmaz.
 */
export async function trackPublication<R>(
  base: Pick<EventInput, "platform" | "provider" | "content">,
  send: () => Promise<R>,
  describe: (
    result: R,
  ) => Omit<
    EventInput,
    "platform" | "provider" | "content" | "attemptId" | "kind"
  >,
): Promise<R> {
  const attemptId = randomUUID();
  writeEventSafe({ ...base, kind: "publication", attemptId, state: "started" });
  const record = (
    result: Omit<
      EventInput,
      "platform" | "provider" | "content" | "attemptId" | "kind"
    >,
  ) => writeEventSafe({ ...base, ...result, kind: "publication", attemptId });
  let value: R;
  try {
    value = await send();
  } catch (error) {
    record({
      state: "unknown",
      issues: ["upload_exception_check_platform_before_retry"],
    });
    throw error;
  }
  try {
    record(describe(value));
  } catch {
    // describe() bile patlasa gönderilmiş video yeniden-yüklemeye dönmesin.
    console.warn(
      "::warning::Yayın sonucu kaydedilemedi; tekrar denemeden önce 'started' kaydını incele.",
    );
  }
  return value;
}
