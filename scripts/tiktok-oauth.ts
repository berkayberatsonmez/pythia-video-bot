// ═══════════════════════════════════════════════════════════════════════════
// tiktok-oauth.ts — BİR KERELİK: TikTok refresh_token al + 3 GitHub secret'ını kur
//
// 2 AŞAMA (interaktif giriş yok — Windows'ta sağlam):
//   1) npx tsx scripts/tiktok-oauth.ts           → yetki URL'ini yazar
//   2) (tarayıcıda izin ver → mor sayfadaki kodu kopyala)
//   3) npx tsx scripts/tiktok-oauth.ts 'KOD'     → token al + 3 secret'ı kur
//
// Redirect URI: https://berkayberatsonmez.github.io/oauth-callback.html (app'te KAYITLI).
// Env GEREKLİ (PowerShell):  $env:TIKTOK_CLIENT_KEY="aw..."; $env:TIKTOK_CLIENT_SECRET="..."
// Değerler ekrana BASILMAZ, sohbete düşmez (gh ile yazılır).
// ═══════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";

const REPO = "berkayberatsonmez/pythia-video-bot";
const REDIRECT_URI = "https://berkayberatsonmez.github.io/oauth-callback.html";
const SCOPES = "user.info.basic,video.upload,video.list";
const AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";

function setSecret(name: string, value: string): void {
  const r = spawnSync(
    "gh",
    ["secret", "set", name, "--body", value, "--repo", REPO],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  if (r.status !== 0) {
    throw new Error(`gh secret set ${name} başarısız (gh login + repo erişimi var mı?)`);
  }
  console.log(`   ✓ ${name} kuruldu`);
}

// Argüman tam URL ise içinden code'u çıkar; değilse olduğu gibi kullan
function extractCode(input: string): string {
  const s = input.trim();
  if (s.includes("code=")) {
    try {
      const c = new URL(s).searchParams.get("code");
      if (c) return c;
    } catch {
      const m = s.match(/code=([^&\s]+)/);
      if (m) return decodeURIComponent(m[1]);
    }
  }
  return s;
}

async function main(): Promise<void> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    console.error("❌ Env eksik. PowerShell'de önce şunları çalıştır:");
    console.error('   $env:TIKTOK_CLIENT_KEY="aw..."');
    console.error('   $env:TIKTOK_CLIENT_SECRET="..."');
    process.exit(1);
  }

  const codeArg = process.argv[2];

  // ── 1. AŞAMA: argüman yoksa yetki URL'ini yaz ──
  if (!codeArg) {
    const state = "pythia_" + Math.random().toString(36).slice(2, 12);
    const authUrl =
      `${AUTH_BASE}?client_key=${encodeURIComponent(clientKey)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&state=${state}`;
    console.log("\n" + "═".repeat(66));
    console.log("1) Şu URL'yi tarayıcıda AÇ → @pythiamystic ile giriş → Authorize:");
    console.log("─".repeat(66));
    console.log(authUrl);
    console.log("═".repeat(66));
    console.log("\n2) Açılan MOR sayfadaki kodu 'Kopyala' butonuyla al.");
    console.log("\n3) Sonra ŞU komutu çalıştır (kodu TEK TIRNAK içine koy):");
    console.log("   npx tsx scripts/tiktok-oauth.ts 'BURAYA_KODU_YAPISTIR'\n");
    process.exit(0);
  }

  // ── 2. AŞAMA: code → token → secret'lar ──
  const code = extractCode(codeArg);
  console.log("Kod alındı, token'a çevriliyor...");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });
  const j = (await res.json()) as {
    refresh_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !j.refresh_token) {
    console.error("❌ Token alınamadı:", JSON.stringify(j));
    console.error("   (Kod TEK KULLANIMLIK + ~10 dk geçerli. Süre dolduysa 1. aşamayı tekrar çalıştır, YENİ kod al.)");
    process.exit(1);
  }
  console.log(`   ✓ refresh_token alındı (scope: ${j.scope ?? "?"})\n`);

  console.log("GitHub secret'ları yazılıyor...");
  setSecret("TIKTOK_CLIENT_KEY", clientKey);
  setSecret("TIKTOK_CLIENT_SECRET", clientSecret);
  setSecret("TIKTOK_REFRESH_TOKEN", j.refresh_token);

  console.log("\n🎉 BİTTİ! 3 secret kuruldu. Artık her IG slotunda video TikTok drafts'a düşecek.");
  process.exit(0);
}

main().catch((e) => {
  console.error("\n💥 Hata:", e);
  process.exit(1);
});
