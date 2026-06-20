// ═══════════════════════════════════════════════════════════════════════════
// youtube-reauth.ts — YouTube OAuth token YENİLE + GOOGLE_TOKEN_B64 secret'ı güncelle
//
// Token "invalid_grant" verince (Testing modu = 7 günde ölür) çalıştır.
// ÖNCE Google Cloud Console'da uygulamayı "Production"a al ki bir daha ölmesin!
//
// 2 AŞAMA (CLI-arg — Windows readline takılmasın):
//   1) npx tsx scripts/youtube-reauth.ts            → yetki URL'ini yazar
//   2) (tarayıcıda izin ver → http://localhost/?code=... → adres çubuğunu kopyala)
//   3) npx tsx scripts/youtube-reauth.ts 'KOD_VEYA_URL'  → token al + secret kur
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { google } from "googleapis";

const REPO = "berkayberatsonmez/pythia-video-bot";
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const CREDS = join(process.cwd(), "scripts", "credentials.json");
const TOKEN = join(process.cwd(), "scripts", "token.json");

function makeClient() {
  const raw = readFileSync(CREDS, "utf8").replace(/^﻿/, "").trim();
  const c = JSON.parse(raw);
  const { client_id, client_secret, redirect_uris } = c.installed || c.web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

function extractCode(input: string): string {
  let code = input.trim();
  if (code.includes("code=")) {
    const m = code.match(/[?&]code=([^&]+)/);
    if (m) code = m[1];
  }
  try {
    code = decodeURIComponent(code);
  } catch {
    // ignore
  }
  return code;
}

async function main(): Promise<void> {
  if (!existsSync(CREDS)) {
    console.error("❌ scripts/credentials.json yok — Google Cloud Console'dan indir.");
    process.exit(1);
  }
  const oAuth = makeClient();
  const codeArg = process.argv[2];

  // ── 1. AŞAMA: yetki URL'i ──
  if (!codeArg) {
    const url = oAuth.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // refresh_token'ı KESİN ver
      scope: SCOPES,
    });
    console.log("\n" + "═".repeat(66));
    console.log("1) Şu URL'yi aç → @pythiamystic Google hesabıyla giriş → İzin ver:");
    console.log("   (Doğrulanmamış uyarısı çıkarsa: 'Gelişmiş → uygulamaya git (güvensiz)')");
    console.log("─".repeat(66));
    console.log(url);
    console.log("═".repeat(66));
    console.log("\n2) İzin verince tarayıcı 'http://localhost/?code=...' e gider");
    console.log("   (sayfa AÇILMAZ, bu normal). Adres çubuğundaki TÜM URL'yi kopyala.");
    console.log("\n3) Sonra çalıştır: npx tsx scripts/youtube-reauth.ts 'YAPISTIR'\n");
    return;
  }

  // ── 2. AŞAMA: code → token → secret ──
  const code = extractCode(codeArg);
  console.log("Kod alındı, token alınıyor...");
  const { tokens } = await oAuth.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      "❌ refresh_token gelmedi. Eski izni iptal et (myaccount.google.com/permissions) + 1. aşamayı tekrarla.",
    );
    process.exit(1);
  }
  writeFileSync(TOKEN, JSON.stringify(tokens, null, 2));
  console.log("   ✓ token.json yazıldı (refresh_token VAR)");

  const b64 = Buffer.from(JSON.stringify(tokens)).toString("base64");
  const r = spawnSync(
    "gh",
    ["secret", "set", "GOOGLE_TOKEN_B64", "--body", b64, "--repo", REPO],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  if (r.status !== 0) {
    console.error("❌ gh secret set başarısız (gh login + repo erişimi var mı?)");
    process.exit(1);
  }
  console.log("   ✓ GOOGLE_TOKEN_B64 secret güncellendi");
  console.log("\n🎉 BİTTİ! YouTube sonraki schedule run'da tekrar yükleyecek.");
}

main().catch((e) => {
  console.error("\n💥 Hata:", e);
  process.exit(1);
});
