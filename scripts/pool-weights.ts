// ═══════════════════════════════════════════════════════════════════════════
// pool-weights.ts — Instagram performansından kategori (pool) ağırlıkları
//
// computePoolWeights(olaylar, asOf) SAF fonksiyon (ağ yok, saat yok):
//   örnek     IG snapshot'ı; her gönderinin (platformId) EN SON ölçümü;
//             yayın tarihi son 28 gün içinde; ölçüldüğünde ≥3 günlük
//             (taze videonun izlenmesi henüz birikmedi, cezalandırılmasın).
//   değer     ln(1 + izlenme + 10 × (paylaşım + kaydetme))
//             → log: tek bir viral video ortalamayı tek başına sürüklemez,
//               ama ORTANCA gibi hit'leri tamamen de yok saymaz (Reels'te
//               başarı = arada bir patlayan video). Paylaşım/kaydetme izlenmeden
//               çok daha güçlü sinyal: her biri 10 izlenme sayılır.
//   skor      pool ortalaması, genel ortalamaya ÇEKİLMİŞ (shrinkage):
//             (n·ort + K·genel) / (n + K), K = 6 → 1-3 videolu pool tek
//             şansla uçmaz; verisi olmayan pool genel ortalamada kalır.
//   ağırlık   2 × exp(skor − genel)  (geometrik ortalamanın genele oranı ×2),
//             [1, 4] aralığına kırpılır, 0,25'e yuvarlanır (haftalık titreşim olmasın).
//             2 = BUGÜNKÜ SIKLIK (nötr), 4 = iki katı, 1 = yarısı. Hiçbir pool 1'in
//             altına inmez → hiçbir kategori kapanmaz (keşif payı, aşağıda).
//
// Ağırlık sıklığa nasıl dönüşür (rotation.ts): pool payı ∝ ağırlık × pool boyu
// (eski rotasyonda her öğe döngüde bir kez geçtiği için bugünkü sıklık pool
// boyuyla orantılı; ağırlık bunun ÇARPANI). Tek pool payı en çok %40.
//
// Çıktı: src/data/pool-weights.json — EKLENEN kayıtlar listesi (en yeni sonda).
// Her kaydın `from` günü var; rotasyon bir günü o gün yürürlükte olan kayıtla
// planlar. Geçmiş kayıtlar SİLİNMEZ: planlayıcı geçmişi aynı ağırlıklarla yeniden
// kurabilsin (tekrar önleme bu geçmişe dayanıyor).
//
// CLI:
//   tsx scripts/pool-weights.ts report            → yalnız hesapla, yazdır
//   tsx scripts/pool-weights.ts propose [--from YYYY-MM-DD] [--as-of YYYY-MM-DD]
//       → değiştiyse dosyaya yeni kayıt ekler (from vars. = as-of + 3 gün)
//   Olaylar ANALYTICS_DIR'den (analytics:pull ile indirilmiş arşiv) okunur.
// ═══════════════════════════════════════════════════════════════════════════

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Event } from "./analytics/ledger";

export const WEIGHT_POOLS = [
  "dream",
  "tarot",
  "zodiac",
  "ranking",
  "behavior",
  "compat",
  "numerology",
  "angel",
  "manifest",
] as const;
export type WeightPool = (typeof WEIGHT_POOLS)[number];
export type Weights = Record<WeightPool, number>;

export const WINDOW_DAYS = 28;
export const MIN_AGE_DAYS = 3;
export const SHRINK_K = 6;
export const ENGAGE_FACTOR = 10;
export const MIN_WEIGHT = 1;
export const MAX_WEIGHT = 4;
export const NEUTRAL_WEIGHT = 2;
/** Bundan az örnekle öneri yapılmaz (önceki kayıt geçerli kalır). */
export const MIN_TOTAL_SAMPLES = 15;
const DAY = 86400000;

export type WeightEntry = {
  /** Bu ağırlıkların geçerli olduğu ilk gün (YYYY-MM-DD, UTC/İstanbul günü). */
  from: string;
  computedAt: string;
  method: string;
  window: { from: string; to: string };
  samples: Record<string, number>;
  /** Pool başına geometrik ortalama "değer" (izlenme + 10×(paylaşım+kaydetme)), ham. */
  geoMean: Record<string, number>;
  weights: Weights;
};
export type WeightFile = { schema: 1; note: string; entries: WeightEntry[] };

export const METHOD =
  `ig snapshot, son ${WINDOW_DAYS} gün, ≥${MIN_AGE_DAYS} günlük; değer=ln(1+izlenme+${ENGAGE_FACTOR}×(paylaşım+kaydetme)); ` +
  `shrinkage K=${SHRINK_K}; ağırlık=${NEUTRAL_WEIGHT}×exp(skor−genel) ∈ [${MIN_WEIGHT},${MAX_WEIGHT}], 0,25 adım`;

const isPool = (s: string): s is WeightPool => (WEIGHT_POOLS as readonly string[]).includes(s);
const round = (x: number, step: number) => Math.round(x / step) * step;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export type WeightResult = {
  weights: Weights;
  samples: Record<string, number>;
  geoMean: Record<string, number>;
  total: number;
  window: { from: string; to: string };
};

/** Saf: aynı olaylar + aynı asOf → aynı sonuç. `sky` raporlanır ama ağırlık almaz (takvimli). */
export function computePoolWeights(events: Event[], asOfMs: number): WeightResult {
  const latest = new Map<string, Event>();
  for (const e of events) {
    if (e.kind !== "snapshot" || e.platform !== "instagram" || !e.platformId) continue;
    if (typeof e.metrics?.views !== "number" || !e.publishedAt) continue;
    const prev = latest.get(e.platformId);
    if (!prev || prev.at < e.at || (prev.at === e.at && prev.eventId < e.eventId)) latest.set(e.platformId, e);
  }
  const values: Record<string, number[]> = {};
  for (const e of latest.values()) {
    const pub = Date.parse(e.publishedAt!);
    const at = Date.parse(e.at);
    if (!Number.isFinite(pub) || pub > asOfMs || asOfMs - pub > WINDOW_DAYS * DAY) continue;
    if (at - pub < MIN_AGE_DAYS * DAY) continue;
    const m = e.metrics!;
    const v = Math.log(1 + m.views! + ENGAGE_FACTOR * ((m.shares ?? 0) + (m.saves ?? 0)));
    (values[e.content.format] ??= []).push(v);
  }
  const poolVals = WEIGHT_POOLS.flatMap((p) => values[p] ?? []);
  const total = poolVals.length;
  const global = total ? poolVals.reduce((a, b) => a + b, 0) / total : 0;
  const weights = {} as Weights;
  const samples: Record<string, number> = {};
  const geoMean: Record<string, number> = {};
  for (const k of Object.keys(values).sort()) {
    const v = values[k];
    samples[k] = v.length;
    geoMean[k] = Math.round(Math.exp(v.reduce((a, b) => a + b, 0) / v.length) - 1);
  }
  for (const p of WEIGHT_POOLS) {
    const v = values[p] ?? [];
    samples[p] ??= 0;
    const mean = v.length ? v.reduce((a, b) => a + b, 0) / v.length : global;
    const shrunk = (v.length * mean + SHRINK_K * global) / (v.length + SHRINK_K);
    const raw = NEUTRAL_WEIGHT * Math.exp(shrunk - global);
    weights[p] = Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, round(raw, 0.25)));
  }
  return { weights, samples, geoMean, total, window: { from: iso(asOfMs - WINDOW_DAYS * DAY), to: iso(asOfMs) } };
}

// ─── Dosya ───────────────────────────────────────────────────────────────
export const WEIGHTS_FILE = join(__dirname, "..", "src", "data", "pool-weights.json");

export function validateWeightFile(f: unknown): WeightFile {
  const file = f as WeightFile;
  if (!file || file.schema !== 1 || !Array.isArray(file.entries)) throw new Error("pool-weights.json: şema 1 değil");
  let prev = "";
  for (const e of file.entries) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.from) || e.from <= prev) throw new Error(`pool-weights.json: from sırasız/geçersiz (${e.from})`);
    prev = e.from;
    for (const p of WEIGHT_POOLS) {
      const w = e.weights?.[p];
      if (typeof w !== "number" || !(w >= MIN_WEIGHT && w <= MAX_WEIGHT)) throw new Error(`pool-weights.json: ${e.from} ${p}=${w} [${MIN_WEIGHT},${MAX_WEIGHT}] dışında`);
    }
  }
  return file;
}

export function readWeightFile(file = WEIGHTS_FILE): WeightFile | null {
  if (!existsSync(file)) return null;
  return validateWeightFile(JSON.parse(readFileSync(file, "utf8")));
}

export const NOTE =
  "scripts/pool-weights.ts üretir (haftalık: .github/workflows/pool-weights.yml). Kayıtlar SİLİNMEZ/DEĞİŞTİRİLMEZ: " +
  "rotasyon geçmiş günleri o gün yürürlükteki kayıtla yeniden kurar. Elle ayar: yeni kayıt ekle, from = gelecekteki bir gün. " +
  "Ağırlık 2 = eski rotasyondaki sıklık, 4 = iki katı, 1 = yarısı.";

/** Önceki kayıttan farklıysa yeni kaydı ekler; dönüş: eklendi mi. */
export function appendEntry(file: WeightFile | null, entry: WeightEntry): { file: WeightFile; added: boolean; reason?: string } {
  const f: WeightFile = file ?? { schema: 1, note: NOTE, entries: [] };
  const last = f.entries[f.entries.length - 1];
  if (last && WEIGHT_POOLS.every((p) => last.weights[p] === entry.weights[p]))
    return { file: f, added: false, reason: "ağırlıklar son kayıtla aynı" };
  if (last && entry.from <= last.from) return { file: f, added: false, reason: `from (${entry.from}) son kayıttan (${last.from}) sonra değil` };
  return { file: { ...f, note: NOTE, entries: [...f.entries, entry] }, added: true };
}

export function formatTable(r: WeightResult, prev?: Weights): string {
  const rows = [...WEIGHT_POOLS, ...Object.keys(r.samples).filter((k) => !isPool(k))];
  const lines = ["| kategori | örnek | geo. ort. değer | ağırlık | önceki |", "|---|---:|---:|---:|---:|"];
  for (const k of rows) {
    const w = isPool(k) ? String(r.weights[k]) : "— (takvimli)";
    const p = isPool(k) && prev ? String(prev[k]) : "";
    lines.push(`| ${k} | ${r.samples[k] ?? 0} | ${r.geoMean[k] ?? "—"} | ${w} | ${p} |`);
  }
  return lines.join("\n");
}

// ─── CLI ─────────────────────────────────────────────────────────────────
async function main() {
  const { readEvents } = await import("./analytics/ledger");
  const a = process.argv.slice(2);
  const opt = (k: string) => (a.includes(k) ? a[a.indexOf(k) + 1] : undefined);
  const asOf = opt("--as-of") ? Date.parse(`${opt("--as-of")}T00:00:00Z`) : Date.now();
  const events = readEvents();
  const r = computePoolWeights(events, asOf);
  const file = readWeightFile();
  const prev = file?.entries[file.entries.length - 1]?.weights;
  const table = formatTable(r, prev);
  console.log(`Örnek: ${r.total} IG videosu (${r.window.from} → ${r.window.to})\n${table}`);
  const summary: string[] = [`## Kategori ağırlıkları (${iso(asOf)})`, "", `Yöntem: ${METHOD}`, "", table, ""];
  if (a[0] === "propose") {
    if (r.total < MIN_TOTAL_SAMPLES) {
      summary.push(`Öneri YOK: yalnız ${r.total} örnek (< ${MIN_TOTAL_SAMPLES}).`);
    } else {
      const from = opt("--from") ?? iso(asOf + 3 * DAY);
      const entry: WeightEntry = {
        from,
        computedAt: iso(asOf),
        method: METHOD,
        window: r.window,
        samples: r.samples,
        geoMean: r.geoMean,
        weights: r.weights,
      };
      const res = appendEntry(file, entry);
      if (res.added) {
        writeFileSync(WEIGHTS_FILE, JSON.stringify(res.file, null, 2) + "\n");
        summary.push(`Yeni kayıt eklendi: from=${from} (bu günden ÖNCE main'e alınmalı).`);
      } else summary.push(`Kayıt eklenmedi: ${res.reason}.`);
    }
  }
  const text = summary.join("\n") + "\n";
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, text, { flag: "a" });
  if (process.env.POOL_WEIGHTS_SUMMARY) writeFileSync(process.env.POOL_WEIGHTS_SUMMARY, text);
}

if (process.argv[1] && /pool-weights\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error("pool-weights:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
