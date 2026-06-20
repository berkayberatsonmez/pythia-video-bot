// GEÇİCİ test — seslendirmeli video render et (uçtan uca doğrulama, çok kategori).
import { writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildVoiceover } from "./voiceover-build";

type T = { category: string; id: string; comp: string; propKey: string };
const TESTS: T[] = [
  { category: "manifest", id: "confidence", comp: "ManifestVideo", propKey: "manifestId" },
  { category: "dream", id: "snake", comp: "DreamSymbolVideo", propKey: "symbolId" },
];

async function one(t: T): Promise<void> {
  console.log(`\n🎙 ${t.category}/${t.id} seslendirme...`);
  const vo = await buildVoiceover(t.category, t.id);
  if (!vo) throw new Error(`narration yok: ${t.category}/${t.id}`);
  const total = vo.intro.dur + vo.m1.dur + vo.m2.dur + vo.m3.dur + vo.close.dur;
  console.log(`   konuşma ≈ ${total.toFixed(1)}s`);
  const props = { [t.propKey]: t.id, voiceover: vo };
  const propsFile = join(tmpdir(), `voiced-${t.category}.json`);
  writeFileSync(propsFile, JSON.stringify(props));
  const out = `out/test-${t.category}.mp4`;
  const r = spawnSync(
    "npx",
    ["remotion", "render", "src/index.ts", t.comp, out, `--props=${propsFile}`],
    { stdio: "inherit", shell: true },
  );
  if (r.status !== 0) throw new Error(`render başarısız: ${t.comp}`);
  console.log(`✓ ${out}`);
}

async function main(): Promise<void> {
  mkdirSync("out", { recursive: true });
  for (const t of TESTS) await one(t);
  console.log("\n🎉 Tüm test render'ları bitti.");
}

main().catch((e) => {
  console.error("💥", e);
  process.exit(1);
});
