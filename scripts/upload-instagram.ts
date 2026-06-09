// ═══════════════════════════════════════════════════════════════════════════
// upload-instagram.ts — Instagram Reels otomatik yayın (Instagram Login API)
//
// Akış (3 adım, graph.instagram.com):
//   1) Videoyu GitHub Release'e yükle → public URL (IG cURL ile çeker)
//   2) POST /me/media (media_type=REELS, video_url, caption) → container
//   3) status_code FINISHED olana kadar bekle → POST /me/media_publish
//
// Token: IG_ACCESS_TOKEN env (GitHub Secret). /me kullanır → ID karmaşası yok.
// CLI test: tsx scripts/upload-instagram.ts <category> <id> <videoPath>
// ═══════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";
import { basename } from "node:path";
import { buildMetadata } from "./metadata";

// graph.instagram.com sürümsüz çalışıyor (Instagram Login API) — deprecation derdi yok
const IG_BASE = "https://graph.instagram.com";
const REPO = "berkayberatsonmez/pythia-video-bot";

function token(): string {
  const t = (process.env.IG_ACCESS_TOKEN || "").replace(/^﻿/, "").trim();
  if (!t) throw new Error("IG_ACCESS_TOKEN env değişkeni tanımlı değil!");
  return t;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── IG Graph API yardımcıları ───────────────────────────────────────────
async function igPost(path: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams({ ...params, access_token: token() });
  const res = await fetch(`${IG_BASE}/${path}`, { method: "POST", body });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json?.error) {
    throw new Error(`IG POST ${path} → ${JSON.stringify(json?.error ?? json)}`);
  }
  return json;
}

async function igGet(path: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ ...params, access_token: token() });
  const res = await fetch(`${IG_BASE}/${path}?${qs}`);
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json?.error) {
    throw new Error(`IG GET ${path} → ${JSON.stringify(json?.error ?? json)}`);
  }
  return json;
}

// ─── IG caption: YouTube metadata'sından üret (Reels'e uyarla) ────────────
export function buildReelCaption(category: string, id: string): string {
  const meta = buildMetadata(category, id);
  // YouTube'a özel #shorts → IG keşfet etiketleri
  const caption = meta.description.replace(/#shorts/gi, "#reels #keşfet #keşfetteyiz");
  return caption.length > 2150 ? caption.slice(0, 2150) : caption;
}

// ─── Videoyu GitHub Release'e yükle → public URL döndür ───────────────────
export function uploadToRelease(videoPath: string, tag: string): string {
  // Release yoksa oluştur (zaten varsa hata yutulur)
  spawnSync(
    "gh",
    ["release", "create", tag, "--repo", REPO, "--title", `Reels (${tag})`,
     "--notes", "Pythia Reels — IG için geçici public hosting (otomatik)"],
    { shell: true, stdio: "ignore" },
  );
  // Asset'i yükle (varsa üzerine yaz)
  const up = spawnSync(
    "gh",
    ["release", "upload", tag, videoPath, "--clobber", "--repo", REPO],
    { shell: true, stdio: "inherit" },
  );
  if (up.status !== 0) {
    throw new Error(`gh release upload başarısız: ${videoPath}`);
  }
  const file = basename(videoPath);
  return `https://github.com/${REPO}/releases/download/${tag}/${encodeURIComponent(file)}`;
}

// ─── Yayınlanan asset'i sil (IG zaten çekti — storage şişmesin) ───────────
function deleteReleaseAsset(tag: string, videoPath: string): void {
  spawnSync(
    "gh",
    ["release", "delete-asset", tag, basename(videoPath), "--yes", "--repo", REPO],
    { shell: true, stdio: "ignore" },
  );
}

// ─── Reels yayınla (3 adım) ──────────────────────────────────────────────
export async function publishReel(videoUrl: string, caption: string): Promise<string> {
  // 1) Container oluştur
  console.log(`   📦 Container oluşturuluyor...`);
  const container = await igPost("me/media", {
    media_type: "REELS",
    video_url: videoUrl,
    caption,
  });
  const creationId: string = container.id;

  // 2) Video işlenene kadar bekle (poll, ~max 4 dk)
  console.log(`   ⏳ Video işleniyor (container ${creationId})...`);
  let status = "IN_PROGRESS";
  for (let i = 0; i < 30; i++) {
    await sleep(8000);
    const s = await igGet(creationId, { fields: "status_code" });
    status = s.status_code;
    if (status === "FINISHED") break;
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Container ${status} — video işlenemedi`);
    }
    console.log(`      ... ${status} (${(i + 1) * 8}s)`);
  }
  if (status !== "FINISHED") {
    throw new Error("Container zaman aşımı (FINISHED olmadı)");
  }

  // 3) Yayınla
  console.log(`   🚀 Yayınlanıyor...`);
  const published = await igPost("me/media_publish", { creation_id: creationId });
  return published.id;
}

// ─── Yüksek seviye: hosting + caption + publish + temizlik ────────────────
export async function postReelFromFile(
  videoPath: string,
  category: string,
  id: string,
  tag: string,
): Promise<string> {
  const url = uploadToRelease(videoPath, tag);
  console.log(`   🌍 Public URL: ${url}`);
  const caption = buildReelCaption(category, id);
  const mediaId = await publishReel(url, caption);
  // Sadece başarıda temizle (hata olursa asset debug için kalsın)
  deleteReleaseAsset(tag, videoPath);
  return mediaId;
}

// ─── CLI: tek video testi ────────────────────────────────────────────────
if (process.argv[1]?.includes("upload-instagram")) {
  const [, , category, id, videoPath] = process.argv;
  if (!category || !id || !videoPath) {
    console.error(
      "Kullanım: tsx scripts/upload-instagram.ts <category> <id> <videoPath>",
    );
    process.exit(1);
  }
  postReelFromFile(videoPath, category, id, "reels-test")
    .then((mediaId) => console.log(`\n🎉 Reels yayınlandı! Media ID: ${mediaId}`))
    .catch((e) => {
      console.error("\n💥 IG yayın hatası:", e);
      process.exit(1);
    });
}
