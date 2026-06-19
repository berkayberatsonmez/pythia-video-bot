// ═══════════════════════════════════════════════════════════════════════════
// render-rotation.ts — Bugünün 2 videosunu rotasyona göre render eder
//
//   npm run rotation         → bugünün 2 videosunu render et
//   npm run rotation:preview → sadece hangi 2 video seçileceğini göster
//
// Cron: 0 6 * * * cd /path && npm run rotation
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

// CLI bayrakları:
//   --upload        YouTube'a da yükle
//   --now           zamanlı değil, hemen yayınla (test için)
//   --privacy <p>   --now ile birlikte gizlilik (public/unlisted/private)
const DO_UPLOAD = process.argv.includes("--upload");
const DO_INSTAGRAM = process.argv.includes("--instagram");
const DO_TIKTOK = process.argv.includes("--tiktok");
const UPLOAD_NOW = process.argv.includes("--now");
// --slot morning|evening → sadece o slotun videosunu işle (IG zamanlı paylaşım için)
const SLOT_FILTER = process.argv.includes("--slot")
  ? process.argv[process.argv.indexOf("--slot") + 1]
  : null;
const PRIVACY = process.argv.includes("--privacy")
  ? process.argv[process.argv.indexOf("--privacy") + 1]
  : "public";

// ─── Optimal yayın saatleri (TR, UTC+3) ──────────────────────────────────
// YouTube Shorts en yüksek etkileşim: öğle 13:00 + akşam 20:00 TR
const SLOT_HOUR_TR: Record<"morning" | "evening", number> = {
  morning: 13,
  evening: 20,
};
const TR_UTC_OFFSET = 3; // TR sabit UTC+3 (DST yok)

/** Bir slot için bugünkü yayın zamanını UTC ISO döndürür. Saat geçtiyse yarına atar. */
function slotPublishAt(slot: "morning" | "evening"): string {
  const hourTR = SLOT_HOUR_TR[slot];
  const now = new Date();
  const d = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hourTR - TR_UTC_OFFSET,
      0,
      0,
    ),
  );
  // En az 20 dk sonrasına olmalı (YouTube anlık geçmiş publishAt kabul etmez)
  if (d.getTime() <= Date.now() + 20 * 60 * 1000) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d.toISOString();
}

function todayStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function renderOne(v: SelectedVideo): string {
  const outPath = join(
    OUTPUT_DIR,
    `${todayStamp()}_${v.slot}_${v.category}-${v.id}.mp4`,
  );
  const propsFile = join(tmpdir(), `pythia-rot-${Date.now()}-${v.slot}.json`);
  writeFileSync(propsFile, JSON.stringify({ [v.propKey]: v.id }));

  console.log(`\n🎬 ${v.label} → ${v.id}  (${v.slot})`);
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

  if (result.status !== 0) {
    throw new Error(`Render başarısız: ${v.label} ${v.id}`);
  }
  return outPath;
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  let picks = getTodaysVideos();
  if (SLOT_FILTER) {
    picks = picks.filter((v) => v.slot === SLOT_FILTER);
    console.log(`🎯 Slot filtresi: ${SLOT_FILTER} → ${picks.length} video`);
  }

  console.log(`\n🌙 Pythia Rotasyon — ${todayStamp()}`);
  console.log(`   Mod: ${DO_UPLOAD ? `RENDER + UPLOAD (${PRIVACY})` : "sadece RENDER"}`);
  console.log("─".repeat(60));

  // 1) Render
  const rendered: { v: SelectedVideo; path: string }[] = [];
  for (const v of picks) {
    const path = renderOne(v);
    rendered.push({ v, path });
  }

  console.log(`\n✅ ${rendered.length} video render edildi.`);

  // 2) Upload (opsiyonel)
  if (DO_UPLOAD) {
    console.log(
      `\n📤 YouTube'a yükleniyor (${UPLOAD_NOW ? `hemen, ${PRIVACY}` : "zamanlı yayın"})...`,
    );
    const auth = await authorize();
    for (const { v, path } of rendered) {
      try {
        // Zamanlı mod: slot saatinde otomatik public. Hemen mod: PRIVACY ile şimdi.
        const publishAt = UPLOAD_NOW ? undefined : slotPublishAt(v.slot);
        await uploadVideoFile(auth, path, v.category, v.id, PRIVACY, publishAt);
      } catch (e) {
        console.error(`❌ Upload başarısız (${v.label} ${v.id}):`, e);
      }
    }
    console.log(`\n🎉 Rotasyon tamamlandı — ${rendered.length} video YouTube'da!`);
    if (!UPLOAD_NOW) {
      console.log(
        `   📅 Sabah video → 13:00 TR · Akşam video → 20:00 TR (otomatik yayın)`,
      );
      console.log(`   ℹ️ Yüklendikten sonra PC kapalı olsa bile YouTube yayınlar.`);
    }
  } else {
    console.log(`\n📋 YouTube'a yüklemek için:`);
    console.log(`   npm run rotation:test    (test → unlisted, hemen)`);
    console.log(`   npm run daily            (üretim → zamanlı yayın)`);
  }

  // 3) Instagram Reels (opsiyonel) — YouTube'dan bağımsız, anında yayın
  if (DO_INSTAGRAM) {
    console.log(`\n📸 Instagram Reels'e yükleniyor (anında yayın)...`);
    for (const { v, path } of rendered) {
      try {
        const mediaId = await postReelFromFile(path, v.category, v.id, "reels");
        if (mediaId === "skipped") {
          console.log(`   ⏭️ ${v.label} → atlandı (mükerrer koruması)`);
        } else {
          console.log(`   ✅ ${v.label} → Reels yayında (media ${mediaId})`);
        }
      } catch (e) {
        console.error(`   ❌ IG yayın başarısız (${v.label} ${v.id}):`, e);
      }
    }
    console.log(`\n🎉 Instagram Reels tamamlandı!`);
  }

  // 4) TikTok (opsiyonel) — drafts/inbox'a yükle; caption .tiktok.txt yanına.
  //    inbox upload caption set etmez → telefondan yayınlarken yapıştırılır.
  if (DO_TIKTOK) {
    console.log(`\n🎵 TikTok drafts'a yükleniyor...`);
    for (const { v, path } of rendered) {
      const pid = await postToTikTokFromFile(path, v.category, v.id);
      if (pid) {
        console.log(`   ✅ ${v.label} → TikTok drafts (publish_id ${pid})`);
      } else {
        console.log(`   ❌ ${v.label} → TikTok upload başarısız`);
      }
    }
    console.log(
      `\n🎉 TikTok tamamlandı — telefondan Inbox/Drafts'tan yayınla (caption .tiktok.txt'de).`,
    );
  }

  console.log();
}

main().catch((e) => {
  console.error("\n💥 Rotasyon hatası:", e);
  process.exit(1);
});
