// ═══════════════════════════════════════════════════════════════════════════
// tiktok-rotation.ts — TikTok postu = o günün IG SABAH slotuyla AYNI video
//
// Seçim rotation.ts'in kendi fonksiyonudur (getVideosForDay(gün)[0], Gök Gündemi
// kayması dahil), tema/ses variety.ts'ten (themeFor/voiceFor, sabah slotu) ve
// seslendirme voiceover-build.ts'ten → render-rotation.ts'in sabah videosuyla
// aynı içerik id'si, format, kanca, tema ve ses. IG dosyası indirilmez; aynı
// girdilerle yeniden render edilir (deterministik).
//
// SALT RENDER + PAKETLEME: hiçbir platforma yüklemez, slot-guard'a / IG
// gönderi sayacına / yayın günlüğüne DOKUNMAZ (günlüğe yalnız PostPeer adımı
// record-postpeer.ts ile yazar). IG/YT slotu bu işten etkilenmez.
//
// Kullanım:
//   tsx scripts/tiktok-rotation.ts                 → render + out/tiktok/ paketi
//   tsx scripts/tiktok-rotation.ts --dry           → yalnız seçim + caption (render yok)
//   tsx scripts/tiktok-rotation.ts --date 2026-10-30 [--dry]
//   --json   (--dry ile) tek satır JSON; workflow GITHUB_OUTPUT için `--github-output`
//
// Çıktı (out/tiktok/): <category>-<id>.{mp4,caption.txt,meta.json}
//   (tiktok-auto.yml'in release + PostPeer adımlarının beklediği adlar.)
//
// TikTok temizliği: tiktokClean=true (arka plan müziği ve uygulama CTA logosu
// yok — eski TikTok hattıyla aynı). TIKTOK_CLEAN=0 ile IG ile birebir görünüm.
// ═══════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getVideosForDay, type SelectedVideo } from "./rotation";
import { themeFor, voiceFor } from "./variety";
import { dateToDay } from "./sky-events";
import { buildInstagramCaption, buildTikTokMetadata } from "./metadata";
import { istanbulDate } from "./slot-guard";
import { buildVoiceover } from "./voiceover-build";
import { TTS_VOICE } from "./tts";
import type { Voiceover } from "../src/components/voiceover";

const OUT_DIR = join(process.cwd(), "out", "tiktok");

function arg(k: string): string | null {
  const a = process.argv.slice(2);
  return a.includes(k) ? (a[a.indexOf(k) + 1] ?? null) : null;
}

/** IG sabah slotunun gününü İstanbul tarihinden bul (IG cron'u 10:07 UTC; TR günü = UTC günü). */
export function resolveDate(override?: string | null, nowMs = Date.now()): string {
  const d = override || istanbulDate(nowMs);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error(`Geçersiz tarih: ${d}`);
  return d;
}

export function pickMorning(date: string): SelectedVideo {
  return getVideosForDay(dateToDay(date))[0];
}

/** IG satırları TikTok'ta anlamsız: marka/“Link bio'da” bloğu. Gerisi (kanca, güncel satır, anlamlar,
 *  kaydet/gönder/yorum, hashtag, eğlence uyarısı) IG ile aynı kalır. */
export function tiktokCaptionFromIg(ig: string): string {
  const lines = ig.split("\n").filter((l) => !/bio'da|🔮 Pythia —|📱 Pythia —|🎁 /.test(l));
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function buildPick(date: string) {
  const v = pickMorning(date);
  const opts = { date, slot: "morning" as const };
  const igCaption = buildInstagramCaption(v.category, v.id, opts);
  const caption = tiktokCaptionFromIg(igCaption);
  const line1 = buildTikTokMetadata(v.category, v.id, opts).line1; // dedup/günlük anahtarı
  return { v, date, caption, line1, hook: igCaption.split("\n")[0] };
}

async function render(v: SelectedVideo, date: string): Promise<string> {
  const day = dateToDay(date);
  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, `${v.category}-${v.id}.mp4`);

  // Seslendirme: render-rotation.ts ile aynı mantık (ses/tema sabah slotundan).
  let voiceover: Voiceover | null = null;
  try {
    let voice: string = voiceFor(day, "morning");
    try {
      voiceover = await buildVoiceover(v.category, v.id, voice);
    } catch (e) {
      if (voice === TTS_VOICE) throw e;
      console.error(`⚠️ ${voice} başarısız, ${TTS_VOICE} deneniyor`);
      voiceover = await buildVoiceover(v.category, v.id, TTS_VOICE);
    }
  } catch (e) {
    console.error(`⚠️ Seslendirme atlandı: ${e instanceof Error ? e.message : e}`);
  }

  const props: Record<string, unknown> = { [v.propKey]: v.id };
  if (v.extraProps) Object.assign(props, v.extraProps);
  props.theme = themeFor(day, "morning");
  if (voiceover) props.voiceover = voiceover;
  if (process.env.TIKTOK_CLEAN !== "0") props.tiktokClean = true;
  const propsFile = join(tmpdir(), `pythia-tt-${Date.now()}.json`);
  writeFileSync(propsFile, JSON.stringify(props));
  const r = spawnSync("npx", ["remotion", "render", "src/index.ts", v.comp, outPath, `--props=${propsFile}`], {
    stdio: "inherit",
    shell: true,
  });
  try {
    unlinkSync(propsFile);
  } catch {
    /* ignore */
  }
  if (r.status !== 0) throw new Error(`Render başarısız: ${v.category}/${v.id}`);
  return outPath;
}

async function main() {
  const date = resolveDate(arg("--date"));
  const p = buildPick(date);
  const { v } = p;
  const format = `${v.category}-${v.id}`;
  console.log(`📅 ${date} (İstanbul) — IG sabah slotu = TikTok: ${v.poolKey} ${v.category}/${v.id}`);
  console.log(`   comp=${v.comp} tema=${themeFor(dateToDay(date), "morning")} ses=${voiceFor(dateToDay(date), "morning")}`);
  console.log(`   hook: ${p.hook}\n--- caption ---\n${p.caption}\n---------------`);

  if (process.argv.includes("--github-output") && process.env.GITHUB_OUTPUT) {
    const kv = { comp: v.comp, category: v.category, id: v.id, date: date.replace(/-/g, ""), format };
    appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(kv).map(([k, x]) => `${k}=${x}\n`).join(""));
  }
  if (process.argv.includes("--dry")) return;

  const mp4 = await render(v, date);
  const dur = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4], {
    encoding: "utf8",
  });
  const durationSec = Math.floor(Number((dur.stdout || "").trim())) || undefined;
  writeFileSync(join(OUT_DIR, `${format}.caption.txt`), p.caption + "\n", "utf-8");
  writeFileSync(
    join(OUT_DIR, `${format}.meta.json`),
    JSON.stringify({ format, caption: p.caption, line1: p.line1, durationSec, igDate: date }, null, 2),
    "utf-8",
  );
  rmSync(join(OUT_DIR, "_raw.mp4"), { force: true });
  console.log(`✓ Paketlendi → out/tiktok/${format}.{mp4,meta.json,caption.txt}`);
}

// Yalnız doğrudan çalıştırılınca (verify scriptleri import edebilsin).
if (process.argv[1] && /tiktok-rotation\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error("💥 TikTok rotasyon hatası:", e);
    process.exit(1);
  });
}
