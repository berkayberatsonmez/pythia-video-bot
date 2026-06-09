// ═══════════════════════════════════════════════════════════════════════════
// upload-youtube.ts — YouTube Shorts otomatik upload
//
// Kurulum:
//   1. https://console.cloud.google.com/ → Yeni proje
//   2. "YouTube Data API v3" enable
//   3. OAuth consent screen ayarla (External, test mode OK)
//   4. Credentials → OAuth 2.0 Client ID (Desktop app)
//   5. credentials.json'u indirip scripts/credentials.json olarak kaydet
//   6. İlk çalıştırma → tarayıcı açılır, izin ver, token.json oluşur
//
// Çalıştırma:
//   npx tsx scripts/upload-youtube.ts --video out/daily/2026-06-08_snake.mp4 \
//                                     --symbol snake
//
// Cron ile:
//   npx tsx scripts/render-daily.ts && npx tsx scripts/upload-youtube.ts \
//     --video out/daily/$(date +%Y-%m-%d)_$(...)_$(...).mp4
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, existsSync, writeFileSync, createReadStream } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { google } from "googleapis";
import { buildMetadata } from "./metadata";

// googleapis ve google-auth-library iki ayrı OAuth2Client tipi export ediyor
// (duplicate dependency). Runtime'da sorun yok; tsc'yi susturmak için alias.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OAuth2Client = any;

// ─── Config ──────────────────────────────────────────────────────────────
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const CREDENTIALS_PATH = join(process.cwd(), "scripts", "credentials.json");
const TOKEN_PATH = join(process.cwd(), "scripts", "token.json");

// ─── CLI args ────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (k: string) =>
    args.includes(k) ? args[args.indexOf(k) + 1] : null;
  return {
    video: get("--video"),
    category: get("--category"),
    id: get("--id"),
    privacy: get("--privacy") || "public",
  };
}

// ─── OAuth2 setup ────────────────────────────────────────────────────────
async function authorize(): Promise<OAuth2Client> {
  if (!existsSync(CREDENTIALS_PATH)) {
    console.error(`❌ Missing: ${CREDENTIALS_PATH}`);
    console.log("\n📋 Setup steps:");
    console.log("1. https://console.cloud.google.com/");
    console.log("2. Create project → Enable YouTube Data API v3");
    console.log("3. OAuth consent screen (External, your email as test user)");
    console.log("4. Credentials → OAuth 2.0 Client ID → Desktop app");
    console.log(`5. Download JSON → save as: ${CREDENTIALS_PATH}`);
    process.exit(1);
  }

  const creds = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf-8"));
  const { client_secret, client_id, redirect_uris } =
    creds.installed || creds.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );

  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, "utf-8"));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // İlk çalıştırma — kullanıcıdan onay al
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("\n🔐 Authorize this app by visiting this URL:");
  console.log(authUrl);
  console.log();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "Enter the code (or paste full localhost URL) here: ",
      async (input) => {
        rl.close();

        // Helper: input'tan temiz auth code çıkar
        let code = input.trim();

        // Eğer tam URL yapıştırılmışsa, sadece code parametresini al
        if (code.includes("code=")) {
          const match = code.match(/[?&]code=([^&]+)/);
          if (match) code = match[1];
        }

        // URL-encoded ise decode et (4%2F0... → 4/0...)
        try {
          code = decodeURIComponent(code);
        } catch {
          // ignore
        }

        console.log(`🔑 Using code: ${code.substring(0, 25)}...`);

        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log(`✅ Token saved: ${TOKEN_PATH}`);
        resolve(oAuth2Client);
      },
    );
  });
}

// ─── Upload (kategori-bilinçli) ──────────────────────────────────────────
export async function uploadVideoFile(
  auth: OAuth2Client,
  videoPath: string,
  category: string,
  id: string,
  privacy: string,
  publishAt?: string, // ISO 8601 UTC — verilirse zamanlı yayın (private + publishAt)
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const youtube = google.youtube({ version: "v3", auth: auth as any });
  const metadata = buildMetadata(category, id);

  // Zamanlı yayın için YouTube private + publishAt ister
  const status: Record<string, unknown> = {
    privacyStatus: publishAt ? "private" : privacy,
    selfDeclaredMadeForKids: false,
  };
  if (publishAt) status.publishAt = publishAt;

  console.log(`\n📤 YouTube'a yükleniyor...`);
  console.log(`   Başlık: ${metadata.title}`);
  console.log(
    publishAt
      ? `   📅 Zamanlı yayın: ${new Date(publishAt).toLocaleString("tr-TR")}`
      : `   Gizlilik: ${privacy}`,
  );

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: "22", // People & Blogs
        defaultLanguage: "tr",
        defaultAudioLanguage: "tr",
      },
      status,
    },
    media: {
      body: createReadStream(videoPath),
    },
  });

  const videoId = res.data.id;
  const url = `https://youtube.com/shorts/${videoId}`;
  console.log(`✅ Yüklendi: ${url}`);
  return url;
}

// ─── CLI ─────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs();

  if (!args.video || !args.category || !args.id) {
    console.error(
      "❌ Kullanım: --video <path> --category <cat> --id <id> [--privacy public|private|unlisted]",
    );
    console.log("   Örn: --video out/v.mp4 --category tarot --id death");
    process.exit(1);
  }

  if (!existsSync(args.video)) {
    console.error(`❌ Video bulunamadı: ${args.video}`);
    process.exit(1);
  }

  console.log(`🎯 ${args.category} → ${args.id}`);

  const auth = await authorize();
  const url = await uploadVideoFile(
    auth,
    args.video,
    args.category,
    args.id,
    args.privacy,
  );
  console.log(`\n🎉 Tamamlandı: ${url}`);
}

// authorize() de export — pipeline tek auth ile çoklu upload yapabilsin
export { authorize };

// Sadece doğrudan çalıştırılınca CLI'yi tetikle (import edilince değil)
if (process.argv[1] && process.argv[1].includes("upload-youtube")) {
  main().catch((e) => {
    console.error("\n💥 Upload başarısız:", e);
    process.exit(1);
  });
}
