// ═══════════════════════════════════════════════════════════════════════════
// daily-pipeline.ts — Tek komutla render + upload
//
// Cron için ideal:
//   0 6 * * * cd /path/to/remotion && npm run daily
// ═══════════════════════════════════════════════════════════════════════════

import { execSync } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { getTodaysSymbol } from "../src/data/dream-symbols";

const OUTPUT_DIR = join(process.cwd(), "out", "daily");

function todayStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

async function main() {
  const symbol = getTodaysSymbol();
  const videoPath = join(OUTPUT_DIR, `${todayStamp()}_${symbol.id}.mp4`);

  console.log(`\n🌙 Pythia Daily Pipeline`);
  console.log(`📅 ${todayStamp()} | Symbol: ${symbol.symbolName}`);
  console.log("─".repeat(60));

  if (!existsSync(videoPath)) {
    console.error(`❌ Video not rendered yet: ${videoPath}`);
    console.log("Run: npm run render:today");
    process.exit(1);
  }

  console.log(`\n📤 Uploading to YouTube...`);
  try {
    execSync(
      `tsx scripts/upload-youtube.ts --video "${videoPath}" --symbol ${symbol.id} --privacy public`,
      { stdio: "inherit" },
    );
    console.log(`\n✨ Daily pipeline complete!`);
  } catch (e) {
    console.error(`\n💥 Upload failed`);
    process.exit(1);
  }
}

main();
