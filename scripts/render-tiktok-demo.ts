// ═══════════════════════════════════════════════════════════════════════════
// render-tiktok-demo.ts — MİNİMAL demo: mevcut render çıktısını panel-okunur
// Release asset'lerine PAKETLE (mp4 + meta.json + caption.txt).
//
// ⚠️ Native/kinetik/sessiz render YAZMAZ. Mevcut render-rotation.ts / remotion
//    çıktısını (music+TTS'li, OLDUĞU GİBİ) alır, yalnız isimlendirip meta yazar.
//    render-rotation.ts'e, daily-video.yml'e, IG/YT yoluna DOKUNMAZ.
//
// Kullanım:
//   npx tsx scripts/render-tiktok-demo.ts --in out/daily/<x>.mp4 \
//        --category tarot --id the-tower [--duration 18]
//
// Çıktı (out/tiktok/, workflow bunu Release'e yükler):
//   <category>-<id>.mp4         (kopya)
//   <category>-<id>.meta.json   { format, caption, line1, durationSec? }
//   <category>-<id>.caption.txt (panoya)
//
// Worker (/publish) meta.json'ı SUNUCU tarafında okur → caption + line1 oradan.
// asset adı = "<category>-<id>.<ext>" (Worker'daki assetName ile birebir).
// ═══════════════════════════════════════════════════════════════════════════

import { copyFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildTikTokMetadata } from "./metadata";

const OUT_DIR = join(process.cwd(), "out", "tiktok");

function arg(k: string): string | null {
  const a = process.argv.slice(2);
  return a.includes(k) ? a[a.indexOf(k) + 1] : null;
}

function main() {
  const inMp4 = arg("--in");
  const category = arg("--category");
  const id = arg("--id");
  const durationRaw = arg("--duration");
  if (!inMp4 || !category || !id) {
    console.error("❌ Kullanım: --in <mp4> --category <c> --id <i> [--duration <s>]");
    process.exit(1);
  }
  if (!existsSync(inMp4)) {
    console.error(`❌ Girdi MP4 yok: ${inMp4}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const format = `${category}-${id}`; // Worker format kavramı = asset adı gövdesi
  const mp4Out = join(OUT_DIR, `${format}.mp4`);
  const metaOut = join(OUT_DIR, `${format}.meta.json`);
  const capOut = join(OUT_DIR, `${format}.caption.txt`);

  const { caption, line1 } = buildTikTokMetadata(category, id);
  const durationSec = durationRaw ? Number(durationRaw) : undefined;

  copyFileSync(inMp4, mp4Out);
  writeFileSync(
    metaOut,
    JSON.stringify({ format, caption, line1, durationSec }, null, 2),
    "utf-8",
  );
  writeFileSync(capOut, caption + "\n", "utf-8");

  console.log(`✓ Paketlendi → out/tiktok/${format}.{mp4,meta.json,caption.txt}`);
  console.log(`  line1 (dedup): ${line1}`);
}

main();
