// ═══════════════════════════════════════════════════════════════════════════
// record-postpeer.ts — tiktok-auto.yml'in PostPeer isteğini yayın günlüğüne yazar
//
//   tsx scripts/record-postpeer.ts start                 → istek ÖNCESİ niyet kaydı
//   tsx scripts/record-postpeer.ts skip                  → dedup marker nedeniyle atlandı
//   tsx scripts/record-postpeer.ts result <http> <draft> → yanıt (/tmp/pp.json) kaydı
//
// İçerik env'den gelir (workflow "pick" adımının çıktıları):
//   PP_CATEGORY, PP_ID  (+ opsiyonel PP_SLOT, varsayılan "morning")
//
// ⚠️ Bu script POST ATMAZ ve yayını ASLA bozmaz: her hata yutulur, çıkış kodu
//    her zaman 0'dır (workflow zaten `|| true` ile çağırır — iki katmanlı).
// ═══════════════════════════════════════════════════════════════════════════

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { writeEventSafe, type PublishState } from "./analytics/ledger";
import { publicationContent } from "./analytics/content";
import { postpeerObservation } from "./analytics/providers";

const attemptPath = "out/tiktok/postpeer-attempt.json";

function main(): void {
  const command = process.argv[2];
  const category = process.env.PP_CATEGORY || "";
  const id = process.env.PP_ID || "";
  if (!["start", "skip", "result"].includes(command))
    throw new Error("Usage: record-postpeer.ts start|skip|result [http] [draft]");
  if (!category || !id) throw new Error("PP_CATEGORY / PP_ID env gerekli");
  const content = publicationContent("tiktok", category, id, {
    slot: process.env.PP_SLOT || "morning",
  });

  if (command === "start" || command === "skip") {
    const attemptId = randomUUID();
    if (command === "start") {
      mkdirSync("out/tiktok", { recursive: true });
      writeFileSync(attemptPath, JSON.stringify({ attemptId }));
    }
    writeEventSafe({
      kind: "publication",
      provider: "postpeer",
      platform: "tiktok",
      attemptId,
      content,
      state: command === "skip" ? "skipped" : "started",
      issues: command === "skip" ? ["duplicate_marker"] : [],
    });
    return;
  }

  const { attemptId } = JSON.parse(readFileSync(attemptPath, "utf8"));
  const http = Number(process.argv[3]);
  const draft = process.argv[4] === "true";
  let payload: any = {};
  try {
    // http=000 (ağ hatası): curl gövdeyi yazmaz, /tmp/pp.json önceki denemeden
    // kalmış olabilir → eski yanıt yeni denemeye karışmasın.
    if (http > 0 && existsSync("/tmp/pp.json"))
      payload = JSON.parse(readFileSync("/tmp/pp.json", "utf8"));
  } catch {
    /* yanıt çözülemedi → bilinmeyen */
  }
  const accepted = http >= 200 && http < 300;
  const observed = postpeerObservation(payload, draft);
  const state: PublishState = accepted
    ? payload.success === false
      ? "failed"
      : draft
        ? "draft"
        : observed.state === "unknown"
          ? "submitted"
          : observed.state
    : http >= 400 && http < 500
      ? "failed"
      : "unknown";
  const providerId = payload.postId || payload.id || payload.data?.postId;
  writeEventSafe({
    kind: "publication",
    provider: "postpeer",
    platform: "tiktok",
    attemptId,
    content,
    state,
    providerId: typeof providerId === "string" ? providerId : undefined,
    platformId: observed.platformId,
    url: observed.url,
    publishedAt: observed.publishedAt,
    issues: [
      accepted
        ? "postpeer_request_accepted"
        : `postpeer_http_${http || "unknown"}`,
      ...(!providerId ? ["provider_id_missing_manual_check_required"] : []),
    ],
  });
}

try {
  main();
} catch (e) {
  // Günlük yardımcı: asla yayını düşürme.
  console.warn(
    `::warning::record-postpeer atlandı: ${e instanceof Error ? e.message : "hata"}`,
  );
}
