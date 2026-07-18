// ═══════════════════════════════════════════════════════════════════════════
// upload-tiktok.ts — TikTok Content Posting API (inbox/drafts'a video yükle)
//
// Python tiktok_upload.py'ın TS portu. `video.upload` scope → video TikTok
// app'inin "drafts/inbox" alanına düşer; kullanıcı telefondan tek tıkla
// yayınlar (caption + ilk yorum .tiktok.txt'den panoya alınır).
//
// Tam otomatik publish için `video.publish` scope + Direct Post API gerek.
//
// Env: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REFRESH_TOKEN
//
// Çalıştırma:
//   npx tsx scripts/upload-tiktok.ts --video out/v.mp4 --category challenge --id level-042
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { buildInstagramCaption, buildFirstComment } from "./metadata";

const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const INIT_URL =
  "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} environment variable not set`);
  return v;
}

// ─── refresh_token → access_token ──────────────────────────────────────────
async function refreshAccessToken(): Promise<string> {
  const body = new URLSearchParams({
    client_key: requireEnv("TIKTOK_CLIENT_KEY"),
    client_secret: requireEnv("TIKTOK_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: requireEnv("TIKTOK_REFRESH_TOKEN"),
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) {
    throw new Error(`Token refresh failed: ${r.status} ${await r.text()}`);
  }
  const j = (await r.json()) as {
    access_token?: string;
    refresh_token?: string;
  };
  if (!j.access_token) {
    throw new Error(`Token refresh missing access_token: ${JSON.stringify(j)}`);
  }
  // TikTok refresh_token her kullanımda yenilenir; CI secret'ı otomatik
  // güncellenmez → yenisini bilgi olarak yazdır (yılda bir manuel rotasyon).
  if (j.refresh_token && j.refresh_token !== process.env.TIKTOK_REFRESH_TOKEN) {
    console.log(
      "  ℹ Yeni refresh_token üretildi — TIKTOK_REFRESH_TOKEN secret'ını güncelleyebilirsin:",
    );
    console.log(`    ${j.refresh_token}`);
  }
  return j.access_token;
}

// ─── Video'yu drafts/inbox'a yükle → publish_id ─────────────────────────────
async function uploadToDrafts(
  videoPath: string,
  accessToken: string,
): Promise<string> {
  const fileSize = statSync(videoPath).size;
  if (fileSize === 0) throw new Error(`Empty video file: ${videoPath}`);

  // 1) Init upload session (tek chunk — videolarımız < 64MB)
  const init = await fetch(INIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      source_info: {
        source: "FILE_UPLOAD",
        video_size: fileSize,
        chunk_size: fileSize,
        total_chunk_count: 1,
      },
    }),
  });
  if (!init.ok) {
    throw new Error(`Init failed: ${init.status} ${await init.text()}`);
  }
  const initJson = (await init.json()) as {
    data?: { publish_id?: string; upload_url?: string };
  };
  const publishId = initJson.data?.publish_id;
  const uploadUrl = initJson.data?.upload_url;
  if (!publishId || !uploadUrl) {
    throw new Error(`Init response missing fields: ${JSON.stringify(initJson)}`);
  }

  // 2) PUT video bytes (Content-Length fetch tarafından otomatik set edilir)
  const bytes = new Uint8Array(readFileSync(videoPath));
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes 0-${fileSize - 1}/${fileSize}`,
      "Content-Type": "video/mp4",
    },
    body: bytes,
  });
  if (put.status !== 200 && put.status !== 201) {
    throw new Error(`Upload failed: ${put.status} ${await put.text()}`);
  }
  console.log(`  ✓ Video TikTok drafts/inbox'a yüklendi. publish_id=${publishId}`);
  return publishId;
}

// ─── Pipeline'dan çağrılabilir ──────────────────────────────────────────────
/**
 * Video'yu TikTok drafts'a yükler ve caption + ilk yorumu video'nun yanına
 * `.tiktok.txt` olarak kaydeder. TikTok inbox upload caption SET ETMEZ →
 * kullanıcı telefondan yayınlarken panoya alıp yapıştırır.
 * Başarısızlıkta null döner (pipeline'ı kırmaz).
 */
export async function postToTikTokFromFile(
  videoPath: string,
  category: string,
  id: string,
): Promise<string | null> {
  try {
    if (!existsSync(videoPath)) throw new Error(`Video bulunamadı: ${videoPath}`);
    const accessToken = await refreshAccessToken();
    const publishId = await uploadToDrafts(videoPath, accessToken);

    // Caption (IG caption TikTok için de ideal: hook + Kaydet/Gönder/Yorum +
    // 5 hashtag + bio link) ve ilk yorum → yanına .txt olarak kaydet.
    const caption = buildInstagramCaption(category, id);
    const firstComment = buildFirstComment(category, id);
    const capPath = join(
      dirname(videoPath),
      basename(videoPath).replace(/\.mp4$/i, "") + ".tiktok.txt",
    );
    writeFileSync(
      capPath,
      `${caption}\n\n--- İLK YORUM (yayınlayınca ekle + sabitle) ---\n${firstComment}\n`,
      "utf-8",
    );
    console.log(`  📝 Caption kaydedildi: ${capPath}`);
    // Caption + ilk yorumu Actions log'una da bas — telefondan run log'undan
    // kopyalanabilsin (.tiktok.txt bulut runner'da kalir, telefona inmez).
    console.log("\n" + "=".repeat(56));
    console.log("📋 TIKTOK CAPTION (drafts'tan yayinlarken bunu yapistir):");
    console.log("-".repeat(56));
    console.log(caption);
    console.log("-".repeat(56));
    console.log("💬 ILK YORUM (yayinlayinca ekle + sabitle):");
    console.log(firstComment);
    console.log("=".repeat(56) + "\n");
    return publishId;
  } catch (e) {
    console.error(`  ✗ TikTok upload başarısız:`, e);
    return null;
  }
}

// ─── CLI ─────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (k: string) =>
    args.includes(k) ? args[args.indexOf(k) + 1] : null;
  return {
    video: get("--video"),
    category: get("--category"),
    id: get("--id"),
  };
}

async function main() {
  const a = parseArgs();
  if (!a.video || !a.category || !a.id) {
    console.error(
      "❌ Kullanım: --video <path> --category <cat> --id <id>",
    );
    console.log("   Örn: --video out/v.mp4 --category challenge --id level-042");
    process.exit(1);
  }
  if (!existsSync(a.video)) {
    console.error(`❌ Video bulunamadı: ${a.video}`);
    process.exit(1);
  }
  console.log(`🎵 TikTok → ${a.category}/${a.id}`);
  const pid = await postToTikTokFromFile(a.video, a.category, a.id);
  if (pid) {
    console.log(
      `\n🎉 TikTok drafts'ta. Telefon → TikTok → Inbox/Drafts → caption'ı .tiktok.txt'den yapıştır → Post.`,
    );
  } else {
    process.exit(1);
  }
}

// Sadece doğrudan çalıştırılınca CLI'yi tetikle (import edilince değil)
if (process.argv[1] && process.argv[1].includes("upload-tiktok")) {
  main().catch((e) => {
    console.error("\n💥 TikTok upload başarısız:", e);
    process.exit(1);
  });
}
