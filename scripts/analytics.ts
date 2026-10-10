// ═══════════════════════════════════════════════════════════════════════════
// analytics.ts — Yayın analitiği CLI'si
//
//   tsx scripts/analytics.ts pull      → arşivdeki günlükleri indir
//   tsx scripts/analytics.ts collect   → yayınların durum + sayaçlarını oku, snapshot yaz, rapor üret
//   tsx scripts/analytics.ts report    → yalnız rapor
//   tsx scripts/analytics.ts push      → bu koşunun günlüğünü arşive ekle
//
// Env: ANALYTICS_LOOKBACK_DAYS (1..90, vars. 30) · POSTPEER_METRICS_BUDGET (0..10, vars. 0 = kapalı)
// Yayın workflow'larında yalnız `push` çalışır ve HİÇBİR koşulda job'ı kırmaz.
// ═══════════════════════════════════════════════════════════════════════════

import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ledgerDir,
  latestPublications,
  readEvents,
  writeEvent,
  emptyMetrics,
} from "./analytics/ledger";
import { pullJournals, pushJournal } from "./analytics/archive";
import {
  createCollector,
  issueCode,
  type Observation,
} from "./analytics/providers";
import { buildReport } from "./analytics/report";

async function main() {
  const command = process.argv[2];
  if (command === "push") {
    // Yayın workflow'larında çalışır: arşiv hatası yayını/job'ı ASLA kırmaz.
    try {
      pushJournal();
    } catch {
      console.warn("::warning::Analytics arşivi yazılamadı; yayın etkilenmedi.");
    }
    return;
  }
  if (command === "pull") return pullJournals();
  if (!["collect", "report"].includes(command))
    throw new Error("Usage: tsx scripts/analytics.ts pull|collect|report|push");
  const days = Number(process.env.ANALYTICS_LOOKBACK_DAYS || 30);
  const budget = Number(process.env.POSTPEER_METRICS_BUDGET || 0);
  if (!Number.isInteger(days) || days < 1 || days > 90)
    throw new Error("ANALYTICS_LOOKBACK_DAYS must be 1..90");
  if (!Number.isInteger(budget) || budget < 0 || budget > 10)
    throw new Error("POSTPEER_METRICS_BUDGET must be 0..10");
  let events = readEvents();
  if (command === "collect") {
    const collector = createCollector({ postpeerMetricsBudget: budget });
    const candidates = latestPublications(events).filter(
      (e) =>
        (e.providerId || e.platformId) &&
        !["skipped", "failed"].includes(e.state) &&
        Date.now() - Date.parse(e.at) < days * 86400000,
    );
    for (const e of candidates) {
      // 20 saatte en fazla bir ölçüm: tekrarlanan koşular metrik kredisini iki kez harcamasın.
      if (
        events.some(
          (s) =>
            s.kind === "snapshot" &&
            s.provider === e.provider &&
            (e.providerId
              ? s.providerId === e.providerId
              : s.platformId === e.platformId) &&
            Date.now() - Date.parse(s.at) < 20 * 3600000,
        )
      )
        continue;
      let observation: Observation;
      try {
        observation = await collector(e);
      } catch (error) {
        observation = {
          state: "unknown" as const,
          metrics: emptyMetrics(),
          issues: [issueCode(error)],
        };
      }
      writeEvent({
        kind: "snapshot",
        platform: e.platform,
        provider: e.provider,
        attemptId: e.attemptId,
        content: {
          ...e.content,
          durationSec: observation.durationSec ?? e.content.durationSec,
        },
        providerId: e.providerId,
        platformId: observation.platformId || e.platformId,
        url: observation.url || e.url,
        publishAt: e.publishAt,
        publishedAt: observation.publishedAt,
        state: observation.state,
        metrics: observation.metrics,
        issues: observation.issues,
      });
      console.log(
        `${e.platform} ${e.content.contentId}: ${observation.state}; ${observation.issues.join(", ") || "ok"}`,
      );
    }
    events = readEvents();
  }
  const report = buildReport(events, Date.now(), days);
  mkdirSync(ledgerDir(), { recursive: true });
  writeFileSync(join(ledgerDir(), "report.md"), report);
  writeFileSync(
    join(ledgerDir(), "report.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), events }, null, 2),
  );
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  console.log(`Report: ${join(ledgerDir(), "report.md")}`);
}

main().catch(() => {
  console.error(
    "Analytics failed. Check credentials, archive availability and JSON schema; no upload was attempted.",
  );
  process.exitCode = 1;
});
