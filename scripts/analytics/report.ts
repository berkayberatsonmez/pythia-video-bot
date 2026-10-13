// ═══════════════════════════════════════════════════════════════════════════
// analytics/report.ts — Günlükten Markdown performans raporu (format / slot kırılımı)
// Rapor rotasyonu OTOMATİK değiştirmez; yalnız karar için veri sunar.
// ═══════════════════════════════════════════════════════════════════════════

import {
  contentFingerprint,
  latestPublications,
  publicationKey,
  type Event,
} from "./ledger";

const HOUR = 3600000;
const cell = (value: unknown) =>
  String(value ?? "—")
    .replace(/[|\r\n]/g, " ")
    .replace(/[<>]/g, "");
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const i = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[i] : (sorted[i - 1] + sorted[i]) / 2;
}

// Pencere içindeki İLK ölçüm; eski bir videonun bugünkü ömür boyu sayacı ile
// yeni videonun sayacı asla karşılaştırılmaz.
export function windowSnapshot(
  snapshots: Event[],
  minHours: number,
  maxHours: number,
): Event | undefined {
  return [...snapshots]
    .sort((a, b) => a.at.localeCompare(b.at))
    .find((s) => {
      if (s.state !== "published" || !s.publishedAt || s.metrics?.views == null)
        return false;
      const age = (Date.parse(s.at) - Date.parse(s.publishedAt)) / HOUR;
      return age >= minHours && age < maxHours;
    });
}

export function buildReport(
  events: Event[],
  now = Date.now(),
  days = 30,
): string {
  const publications = latestPublications(events).filter(
    (e) => now - Date.parse(e.at) <= days * 24 * HOUR,
  );
  const snapshots = events.filter((e) => e.kind === "snapshot");
  const rows = publications.map((p) => {
    const history = snapshots.filter(
      (s) => publicationKey(s) === publicationKey(p),
    );
    return { p, history, latest: history[history.length - 1] || p };
  });
  const lines = [
    "# Pythia — Yayın ve performans raporu",
    "",
    `Oluşturulma: ${new Date(now).toISOString()} · Son ${days} günde kaydedilen gönderimler`,
    "",
    "Veri yok = —; sıfır yalnız API sıfır döndürdüğünde yazılır. Platformlar kendi içinde değerlendirilir.",
    "24–48 saat ve 7–8 gün sütunları o yaş aralığındaki ilk ölçümü kullanır; tam 24 saat/7 gün ölçümü değildir.",
    "Örnek sayısı 5'in altındaki gruplar karar vermek için yetersizdir. Bu rapor rotasyonu otomatik değiştirmez.",
    "",
  ];
  if (!rows.length)
    return [
      ...lines,
      "Henüz kayıt yok. İlk izlenen yayın koşusundan sonra veri birikir.",
      "",
    ].join("\n");
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!row.p.platformId && !row.p.providerId) continue;
    const key = `${row.p.platform} / ${row.p.content.format} / ${row.p.content.slot || "bilinmiyor"}`;
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  lines.push(
    "## Format karşılaştırması",
    "",
    "| Platform / format / slot | Kayıt | 24–48s ölçüm sayısı | Medyan görüntüleme | 7–8g ölçüm sayısı | Medyan görüntüleme |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
  );
  for (const [key, items] of groups) {
    const values = (min: number, max: number) =>
      items
        .map((r) => windowSnapshot(r.history, min, max)?.metrics?.views)
        .filter((v): v is number => v != null);
    const day = values(24, 48),
      week = values(168, 192);
    lines.push(
      `| ${cell(key)} | ${items.length} | ${day.length} | ${cell(median(day))} | ${week.length} | ${cell(median(week))} |`,
    );
  }
  lines.push(
    "",
    "## Son durumlar",
    "",
    "| İçerik / platform | Durum | Platform / aracı ID | Son kontrol | Görüntüleme | Beğeni | Yorum | Paylaşım | Kayıt | Erişim | Ort. izlenme (sn) | Toplam etkileşim | Sorun / not |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  );
  for (const { p, latest } of rows) {
    const m = latest.metrics;
    const state =
      latest.state === "started" ? "unknown (yanıt kaydı yok)" : latest.state;
    lines.push(
      `| ${cell(p.content.contentId)} / ${p.platform} | ${state} | ${cell(latest.platformId || p.platformId || p.providerId)} | ${latest.kind === "snapshot" ? latest.at : "henüz sorgulanmadı"} | ${cell(m?.views)} | ${cell(m?.likes)} | ${cell(m?.comments)} | ${cell(m?.shares)} | ${cell(m?.saves)} | ${cell(m?.reach)} | ${cell(typeof m?.avgWatchTimeMs === "number" ? Math.round(m.avgWatchTimeMs / 100) / 10 : null)} | ${cell(m?.totalInteractions)} | ${cell(latest.issues?.join(", "))} |`,
    );
  }
  lines.push(
    "",
    "## İçerik ayrıntıları",
    "",
    "| İçerik / platform | Başlık | Video hook | Süre (sn) | İçerik parmak izi |",
    "| --- | --- | --- | ---: | --- |",
  );
  for (const { p, latest } of rows)
    lines.push(
      `| ${cell(p.content.contentId)} / ${p.platform} | ${cell(p.content.title)} | ${cell(p.content.hook)} | ${cell(latest.content.durationSec ?? p.content.durationSec)} | ${contentFingerprint(p.content)} |`,
    );
  return lines.join("\n") + "\n";
}
