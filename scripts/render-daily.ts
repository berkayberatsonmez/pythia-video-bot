// ═══════════════════════════════════════════════════════════════════════════
// render-daily.ts — Otomatik günlük Pythia video render scripti
//
// Çalıştırma:
//   npx tsx scripts/render-daily.ts                 → Bugünün sembolü
//   npx tsx scripts/render-daily.ts --symbol snake  → Belirli sembol
//   npx tsx scripts/render-daily.ts --all           → Hepsi (10 video)
//
// Cron için:
//   0 6 * * * cd /path/to/remotion && npx tsx scripts/render-daily.ts
// ═══════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  DREAM_SYMBOLS,
  getTodaysSymbol,
  getSymbolById,
  type DreamSymbol,
} from "../src/data/dream-symbols";

// ─── Config ──────────────────────────────────────────────────────────────
const OUTPUT_DIR = join(process.cwd(), "out", "daily");
const COMPOSITION_ID = "DreamSymbolVideo";
const ENTRY = "src/index.ts";

// ─── CLI args ────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    symbol: args.includes("--symbol")
      ? args[args.indexOf("--symbol") + 1]
      : null,
    all: args.includes("--all"),
  };
}

// ─── Tarih helper'ı — YYYY-MM-DD ─────────────────────────────────────────
function todayStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Render fonksiyonu — cross-platform (Windows + Mac/Linux) ────────────
function renderSymbol(symbol: DreamSymbol): string {
  const outputPath = join(
    OUTPUT_DIR,
    `${todayStamp()}_${symbol.id}.mp4`,
  );

  // Windows quote problemini çöz: props'u temp dosyaya yaz
  const propsFile = join(tmpdir(), `pythia-props-${Date.now()}.json`);
  writeFileSync(propsFile, JSON.stringify({ symbolId: symbol.id }));

  console.log(`\n🎬 Rendering: ${symbol.symbolName}`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Props: ${propsFile}`);

  const result = spawnSync(
    "npx",
    [
      "remotion",
      "render",
      ENTRY,
      COMPOSITION_ID,
      outputPath,
      `--props=${propsFile}`,
    ],
    {
      stdio: "inherit",
      shell: true, // Windows + Mac/Linux uyumlu
    },
  );

  // Cleanup temp file
  try {
    unlinkSync(propsFile);
  } catch {}

  if (result.status !== 0) {
    console.error(`❌ Failed: ${symbol.symbolName}`);
    throw new Error(`Render exited with code ${result.status}`);
  }

  console.log(`✅ Done: ${outputPath}`);
  return outputPath;
}

// ─── Main ────────────────────────────────────────────────────────────────
async function main() {
  // Output dizinini oluştur
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created: ${OUTPUT_DIR}`);
  }

  const args = parseArgs();

  if (args.all) {
    console.log(`\n🚀 Rendering all ${DREAM_SYMBOLS.length} symbols...`);
    const startTime = Date.now();
    const results: string[] = [];
    for (const symbol of DREAM_SYMBOLS) {
      const path = renderSymbol(symbol);
      results.push(path);
    }
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✨ Rendered ${results.length} videos in ${elapsed}s`);
    return;
  }

  let symbol: DreamSymbol;
  if (args.symbol) {
    const found = getSymbolById(args.symbol);
    if (!found) {
      console.error(`❌ Unknown symbol: ${args.symbol}`);
      console.log(
        `Available: ${DREAM_SYMBOLS.map((s) => s.id).join(", ")}`,
      );
      process.exit(1);
    }
    symbol = found;
    console.log(`🎯 Manual symbol: ${symbol.symbolName}`);
  } else {
    symbol = getTodaysSymbol();
    console.log(
      `📅 Today's symbol (auto): ${symbol.symbolName} (${symbol.id})`,
    );
  }

  const outputPath = renderSymbol(symbol);

  // Caption ve YouTube metadata da generate et — log olarak
  console.log("\n📝 YouTube Metadata:\n");
  console.log("─".repeat(60));
  console.log(`TITLE: Rüyanda ${symbol.symbolNameUpper.replace("\n", " ")} Gördüysen 🌙 Bilinçaltın Bu 3 Şeyi Söylüyor #Shorts`);
  console.log("─".repeat(60));
  console.log("DESCRIPTION:");
  console.log(generateYouTubeDescription(symbol));
  console.log("─".repeat(60));
  console.log(`TAGS: rüyatabiri, rüya, ${symbol.symbolName}, mistik, bilinçaltı, ruyayorumu`);
  console.log("─".repeat(60));
  console.log(`\n✅ Output: ${outputPath}`);
}

// ─── YouTube açıklaması generator ────────────────────────────────────────
function generateYouTubeDescription(symbol: DreamSymbol): string {
  const lines = [
    `Rüyanda ${symbol.symbolName} gördüysen bilinçaltın bunu söylüyor 🌙`,
    "",
    "Bilinçaltının sana söylediği 3 ana mesaj:",
    "",
    ...symbol.meanings.map(
      (m, i) =>
        `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`,
    ),
    "",
    `${symbol.questionTitle.toLowerCase().replace("peki senin", "Asıl detay: senin ")}: ${symbol.questionBody.replace(/\n/g, " ")}`,
    "",
    `${symbol.questionFooter}`,
    "",
    "Senin nasıl bir tecrübeydi? Yorumlara yaz, beraber yorumlayalım!",
    "",
    "📱 Pythia uygulaması — AI ile detaylı rüya tabiri",
    "🌍 8 dilde, 175 ülkede",
    "🎁 3 gün ücretsiz dene",
    "👇 Profil bio'da link",
    "",
    `#rüyatabiri #rüya ${symbol.hashtag} #mistik #bilinçaltı #ruyayorumu #Shorts`,
  ];
  return lines.join("\n");
}

main().catch((e) => {
  console.error("\n💥 Render failed:", e);
  process.exit(1);
});
