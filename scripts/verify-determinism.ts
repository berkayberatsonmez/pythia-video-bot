// ═══════════════════════════════════════════════════════════════════════════
// verify-determinism.ts — TS port'unun Dart ground-truth ile BİREBİR olduğunu doğrular
//
// Ground-truth (.parity-groundtruth.json) gerçek oyun kodundan `flutter test`
// ile üretildi (conveyor_sort_app/test/_parity_dump_test.dart). Bu betik aynı
// seed'lerle TS buildSpawnSequence + simulateSequence çalıştırıp karşılaştırır.
//
//   npx tsx scripts/verify-determinism.ts
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DartRandom, dartShuffle } from "../src/game/dartRandom";
import {
  buildSpawnSequence,
  forLevel,
  effectiveWindowTriplets,
  maxRun,
  type LevelConfig,
} from "../src/game/levelConfig";
import { simulateSequence } from "../src/game/sequenceValidator";
import { dailyConfig } from "../src/game/dailyConfig";

const GT_PATH = join(process.cwd(), "test", "fixtures", "parity-groundtruth.json");

function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

let failures = 0;
function check(name: string, got: unknown, want: unknown): void {
  if (eq(got, want)) {
    console.log(`  ✅ ${name}`);
  } else {
    failures++;
    console.log(`  ❌ ${name}`);
    console.log(`     got : ${JSON.stringify(got)}`);
    console.log(`     want: ${JSON.stringify(want)}`);
  }
}

function main() {
  if (!existsSync(GT_PATH)) {
    console.error(`❌ Ground-truth yok: ${GT_PATH}`);
    console.error(`   conveyor_sort_app/test/_parity_dump_test.dart → flutter test ile üret.`);
    process.exit(1);
  }
  const gt = JSON.parse(readFileSync(GT_PATH, "utf-8"));

  console.log("── Primitive: DartRandom + shuffle ──");
  {
    const r = new DartRandom(12345);
    check("Random(12345).nextInt(1000) ×20", Array.from({ length: 20 }, () => r.nextInt(1000)), gt.rand_12345_nextInt1000);
  }
  {
    const r = new DartRandom(1);
    check("Random(1).nextInt(2) ×20", Array.from({ length: 20 }, () => r.nextInt(2)), gt.rand_1_nextInt2);
  }
  {
    const r = new DartRandom(999);
    check("shuffle([0..9], 999)", dartShuffle([...Array(10).keys()], r), gt.shuffle_0to9_seed999);
  }

  console.log("── Dizilim + adalet simülasyonu ──");
  const dumps: { key: string; cfg: LevelConfig; seed: number | undefined }[] = [
    { key: "daily_20260718", cfg: dailyConfig, seed: 20260718 },
    { key: "daily_20260719", cfg: dailyConfig, seed: 20260719 },
    { key: "level_1", cfg: forLevel(1), seed: undefined },
    { key: "level_2", cfg: forLevel(2), seed: undefined },
    { key: "level_3", cfg: forLevel(3), seed: undefined },
    { key: "level_5", cfg: forLevel(5), seed: undefined },
    { key: "level_7", cfg: forLevel(7), seed: undefined },
    { key: "level_15", cfg: forLevel(15), seed: undefined },
    { key: "level_42", cfg: forLevel(42), seed: undefined },
  ];

  for (const { key, cfg, seed } of dumps) {
    const g = gt[key];
    if (!g) {
      console.log(`  ⚠️ ground-truth eksik: ${key}`);
      continue;
    }
    // config türetmeleri
    check(`${key}: effectiveWindowTriplets`, effectiveWindowTriplets(cfg), g.effectiveWindowTriplets);
    check(`${key}: maxRun`, maxRun(cfg), g.maxRun);
    // dizilim
    const seq = buildSpawnSequence(cfg, seed);
    check(`${key}: sequence`, seq, g.sequence);
    // simülasyon (bot kaybı)
    const sim = simulateSequence(seq, cfg.dockSlots);
    check(`${key}: sim.lost`, sim.lost, g.sim_lost);
    check(`${key}: sim.stranded`, sim.strandedInDock, g.sim_stranded);
  }

  console.log();
  if (failures === 0) {
    console.log("🎯 DETERMİNİZM PARİTESİ TAM — TS ⇔ Dart birebir.");
  } else {
    console.error(`💥 ${failures} uyumsuzluk — port Dart'la eşleşmiyor.`);
    process.exit(1);
  }
}

main();
