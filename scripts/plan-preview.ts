// plan-preview.ts — Eski rotasyon ile yeni planlayıcıyı yan yana gösterir (ağ yok).
//   tsx scripts/plan-preview.ts [--from YYYY-MM-DD] [--days 30] [--md]
// Varsayılan başlangıç PLANNER_START. Yeni = src/data/pool-weights.json + gündem.
import { createPlanner, legacyVideosForDay, PLANNER_START, poolShares, loadWeightSchedule, type SelectedVideo } from "./rotation";
import { dateToDay, dayToDate } from "./sky-events";

const a = process.argv.slice(2);
const from = a.includes("--from") ? dateToDay(a[a.indexOf("--from") + 1]) : PLANNER_START;
const days = a.includes("--days") ? Number(a[a.indexOf("--days") + 1]) : 30;
const md = a.includes("--md");

const planner = createPlanner();
const fmt = (v: SelectedVideo) => `${v.poolKey}:${v.id}`;
const distOld: Record<string, number> = {};
const distNew: Record<string, number> = {};
const rows: string[] = [];
if (md) rows.push("| gün | eski sabah | eski akşam | yeni sabah | yeni akşam | gündem |", "|---|---|---|---|---|---|");
for (let d = from; d < from + days; d++) {
  const old = legacyVideosForDay(d);
  const p = planner.plan(d);
  for (const v of old) distOld[v.poolKey] = (distOld[v.poolKey] ?? 0) + 1;
  for (const v of p.videos) distNew[v.poolKey] = (distNew[v.poolKey] ?? 0) + 1;
  const cells = [dayToDate(d), fmt(old[0]), fmt(old[1]), fmt(p.videos[0]), fmt(p.videos[1]), p.focus ?? ""];
  rows.push(md ? `| ${cells.join(" | ")} |` : cells.map((c, i) => (i < 5 ? c.padEnd(i ? 30 : 11) : c)).join(""));
}
console.log(rows.join("\n"));
const keys = [...new Set([...Object.keys(distOld), ...Object.keys(distNew)])].sort((x, y) => (distNew[y] ?? 0) - (distNew[x] ?? 0));
const sched = loadWeightSchedule();
const shares = poolShares(sched[sched.length - 1].weights);
console.log(md ? "\n| kategori | eski | yeni | hedef pay (rotasyon slotu) |\n|---|---:|---:|---:|" : "\nkategori     eski  yeni  hedef");
for (const k of keys) {
  const target = k in shares ? `%${Math.round(shares[k as keyof typeof shares] * 100)}` : "takvim";
  console.log(md ? `| ${k} | ${distOld[k] ?? 0} | ${distNew[k] ?? 0} | ${target} |` : `${k.padEnd(12)} ${String(distOld[k] ?? 0).padStart(4)}  ${String(distNew[k] ?? 0).padStart(4)}  ${target}`);
}
