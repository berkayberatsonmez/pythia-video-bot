// ═══════════════════════════════════════════════════════════════════════════
// generate-daily.ts — Bugünün formatlarını üretir → remotion render → yükle
//
// Faz 2: içerik sentetik oyun tekrarı. rotation.ts hangi format(lar) gideceğini
// belirler; bu betik props'u yazıp `remotion render` çağırır ve (opsiyonel)
// YouTube/Instagram/TikTok'a yükler. Upload + dedup iskeleti Pythia'dan korundu.
//
//   npm run daily:preview            → bugün ne gidecek (render yok)
//   npm run daily                    → render + upload (YT zamanlı + IG + TikTok)
//   npx tsx scripts/generate-daily.ts --slot morning --upload
//   Bayraklar: --upload --instagram --tiktok --now --privacy <p> --slot <s>
// ═══════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getTodaysVideos, type SelectedVideo } from "./rotation";
import { authorize, uploadVideoFile } from "./upload-youtube";
import { postReelFromFile } from "./upload-instagram";
import { postToTikTokFromFile } from "./upload-tiktok";

const OUTPUT_DIR = join(process.cwd(), "out", "daily");

const argHas = (f: string) => process.argv.includes(f);
const argVal = (f: string) => (argHas(f) ? process.argv[process.argv.indexOf(f) + 1] : null);

const DO_UPLOAD = argHas("--upload");
const DO_INSTAGRAM = argHas("--instagram");
const DO_TIKTOK = argHas("--tiktok");
const UPLOAD_NOW = argHas("--now");
const SLOT_FILTER = argVal("--slot");
const PRIVACY = argVal("--privacy") ?? "public";

// ─── Yayın saatleri (TR, UTC+3) ────────────────────────────────────────────
const SLOT_HOUR_TR: Record<"morning" | "evening", number> = { morning: 13, evening: 20 };
const TR_UTC_OFFSET = 3;
function slotPublishAt(slot: "morning" | "evening"): string {
  const hourTR = SLOT_HOUR_TR[slot];
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourTR - TR_UTC_OFFSET, 0, 0));
  if (d.getTime() <= Date.now() + 20 * 60 * 1000) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}
function todayStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ─── Tek video render → çıktı yolu ─────────────────────────────────────────
function renderOne(v: SelectedVideo): string {
  const outPath = join(OUTPUT_DIR, `${todayStamp()}_${v.slot}_${v.id}.mp4`);
  const propsFile = join(tmpdir(), `conveyor-${Date.now()}-${v.slot}.json`);
  writeFileSync(propsFile, JSON.stringify(v.props));

  console.log(`\n🎬 ${v.comp} → ${v.label}  (${v.slot})`);
  console.log(`   ${outPath}`);

  const result = spawnSync(
    "npx",
    ["remotion", "render", "src/index.ts", v.comp, outPath, `--props=${propsFile}`],
    { stdio: "inherit", shell: true },
  );
  try {
    unlinkSync(propsFile);
  } catch {
    // ignore
  }
  if (result.status !== 0) throw new Error(`Render başarısız: ${v.id}`);
  return outPath;
}

async function main() {
  let picks = getTodaysVideos();
  if (SLOT_FILTER) {
    picks = picks.filter((v) => v.slot === SLOT_FILTER);
    console.log(`🎯 Slot filtresi: ${SLOT_FILTER} → ${picks.length} video`);
  }

  if (argHas("--preview")) {
    console.log(`\n📅 ${todayStamp()} — Bugünün videoları:\n`);
    for (const v of picks) {
      console.log(`  ${v.slot === "morning" ? "13:00" : "20:00"}  ${v.label}  [${v.comp}]`);
      console.log(`         hook: ${v.hook}`);
    }
    console.log();
    return;
  }

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n📦 Conveyor Sort — ${todayStamp()}`);
  console.log(`   Mod: ${DO_UPLOAD ? `RENDER + UPLOAD (${PRIVACY})` : "sadece RENDER"}`);
  console.log("─".repeat(60));

  // 1) Render
  const rendered: { v: SelectedVideo; path: string }[] = [];
  for (const v of picks) {
    rendered.push({ v, path: renderOne(v) });
  }
  console.log(`\n✅ ${rendered.length} video render edildi.`);

  // 2) YouTube (opsiyonel, zamanlı)
  if (DO_UPLOAD) {
    console.log(`\n📤 YouTube'a yükleniyor (${UPLOAD_NOW ? `hemen, ${PRIVACY}` : "zamanlı"})...`);
    const auth = await authorize();
    for (const { v, path } of rendered) {
      try {
        const publishAt = UPLOAD_NOW ? undefined : slotPublishAt(v.slot);
        await uploadVideoFile(auth, path, v.category, v.id, PRIVACY, publishAt);
      } catch (e) {
        console.error(`❌ Upload başarısız (${v.label}):`, e);
      }
    }
    console.log(`\n🎉 YouTube tamamlandı.`);
    if (!UPLOAD_NOW) console.log(`   📅 Sabah → 13:00 TR · Akşam → 20:00 TR (server-side yayın)`);
  }

  // 3) Instagram Reels
  if (DO_INSTAGRAM) {
    console.log(`\n📸 Instagram Reels...`);
    for (const { v, path } of rendered) {
      try {
        const mediaId = await postReelFromFile(path, v.category, v.id, "reels");
        console.log(mediaId === "skipped" ? `   ⏭️ ${v.label} atlandı (mükerrer)` : `   ✅ ${v.label} → Reels (${mediaId})`);
      } catch (e) {
        console.error(`   ❌ IG başarısız (${v.label}):`, e);
      }
    }
  }

  // 4) TikTok drafts
  if (DO_TIKTOK) {
    console.log(`\n🎵 TikTok drafts...`);
    for (const { v, path } of rendered) {
      const pid = await postToTikTokFromFile(path, v.category, v.id);
      console.log(pid ? `   ✅ ${v.label} → TikTok drafts (${pid})` : `   ❌ ${v.label} → başarısız`);
    }
  }

  console.log();
}

main().catch((e) => {
  console.error("\n💥 Hata:", e);
  process.exit(1);
});
