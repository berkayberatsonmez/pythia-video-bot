// ═══════════════════════════════════════════════════════════════════════════
// render-one.ts — Tek video render (Windows tırnak sorununu çözer)
//
// Kullanım:
//   npm run video -- dream snake
//   npm run video -- tarot death
//   npm run video -- number a777
//
// Kategori + id veriyorsun, gerisini hallediyor (props'u temp dosyaya yazar).
// ═══════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// kategori → { composition, propKey }
const CATEGORIES: Record<string, { comp: string; key: string }> = {
  dream: { comp: "DreamSymbolVideo", key: "symbolId" },
  tarot: { comp: "TarotVideo", key: "cardId" },
  number: { comp: "NumberVideo", key: "numberId" },
  zodiac: { comp: "ZodiacVideo", key: "signId" },
  manifest: { comp: "ManifestVideo", key: "manifestId" },
};

function main() {
  const [category, id] = process.argv.slice(2);

  if (!category || !id) {
    console.error("❌ Kullanım: npm run video -- <kategori> <id>");
    console.log("\nKategoriler:");
    console.log("  dream  → npm run video -- dream snake");
    console.log("  tarot  → npm run video -- tarot death");
    console.log("  number → npm run video -- number a777");
    process.exit(1);
  }

  const cat = CATEGORIES[category];
  if (!cat) {
    console.error(`❌ Bilinmeyen kategori: ${category}`);
    console.log(`Geçerli: ${Object.keys(CATEGORIES).join(", ")}`);
    process.exit(1);
  }

  // Output dizini
  const outDir = join(process.cwd(), "out");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${category}-${id}.mp4`);

  // Props'u temp dosyaya yaz (Windows tırnak sorununu atlar)
  const propsFile = join(tmpdir(), `pythia-${Date.now()}.json`);
  writeFileSync(propsFile, JSON.stringify({ [cat.key]: id }));

  console.log(`\n🎬 ${category} → ${id}`);
  console.log(`   Composition: ${cat.comp}`);
  console.log(`   Output: ${outPath}\n`);

  const result = spawnSync(
    "npx",
    [
      "remotion",
      "render",
      "src/index.ts",
      cat.comp,
      outPath,
      `--props=${propsFile}`,
    ],
    { stdio: "inherit", shell: true },
  );

  try {
    unlinkSync(propsFile);
  } catch {
    // ignore
  }

  if (result.status !== 0) {
    console.error(`\n❌ Render başarısız`);
    process.exit(1);
  }

  console.log(`\n✅ Hazır: ${outPath}`);
}

main();
