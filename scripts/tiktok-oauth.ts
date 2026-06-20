// ═══════════════════════════════════════════════════════════════════════════
// tiktok-oauth.ts — BİR KERELİK: TikTok refresh_token al + 3 GitHub secret'ını kur
//
// TikTok video.upload için OAuth. Localhost callback ile yetki kodunu OTOMATİK
// yakalar, token'a çevirir ve secret'ları `gh` ile repo'ya yazar.
// Değerler (secret/secret_token) EKRANA BASILMAZ, sohbete düşmez.
//
// ÖN KOŞUL: TikTok Developer Portal → app "Pythia" → Login Kit → "Redirect URI"
//   ye TAM olarak şunu ekle (kaydet):
//       http://localhost:8721/callback
//
// Çalıştırma (PowerShell, remotion-hello-world klasöründe):
//   $env:TIKTOK_CLIENT_KEY="awxxxx"; $env:TIKTOK_CLIENT_SECRET="xxxx"; npx tsx scripts/tiktok-oauth.ts
//   (env vermezsen script soracak)
// ═══════════════════════════════════════════════════════════════════════════

import { createServer } from "node:http";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const REPO = "berkayberatsonmez/pythia-video-bot";
const PORT = 8721;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = "user.info.basic,video.upload,video.list";
const AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";

async function ask(q: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  const a = await rl.question(q);
  rl.close();
  return a.trim();
}

// ─── Localhost callback'i dinle, yetki kodunu yakala ───────────────────────
function waitForCode(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "", REDIRECT_URI);
      if (!url.pathname.startsWith("/callback")) {
        res.writeHead(404);
        res.end();
        return;
      }
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const err = url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      const html = (msg: string) =>
        `<body style="font-family:sans-serif;background:#1a1330;color:#D4A843;text-align:center;padding-top:80px"><h2>${msg}</h2></body>`;
      if (err) {
        res.end(html("❌ Hata: " + err + " — bu pencereyi kapat."));
        server.close();
        reject(new Error("OAuth error: " + err));
        return;
      }
      if (state !== expectedState) {
        res.end(html("❌ state uyuşmadı (güvenlik) — bu pencereyi kapat."));
        server.close();
        reject(new Error("state mismatch"));
        return;
      }
      if (!code) {
        res.end(html("❌ code yok — bu pencereyi kapat."));
        server.close();
        reject(new Error("no code in callback"));
        return;
      }
      res.end(html("✅ Pythia TikTok'a bağlandı! Bu pencereyi kapatabilirsin."));
      server.close();
      resolve(code);
    });
    server.on("error", reject);
    server.listen(PORT, () =>
      console.log(`   (localhost:${PORT} dinleniyor — tarayıcının dönmesini bekliyorum...)`),
    );
  });
}

// ─── Secret'ı gh ile yaz (değer ekrana basılmaz) ───────────────────────────
function setSecret(name: string, value: string): void {
  const r = spawnSync(
    "gh",
    ["secret", "set", name, "--body", value, "--repo", REPO],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  if (r.status !== 0) throw new Error(`gh secret set ${name} başarısız (gh login + repo erişimi var mı?)`);
  console.log(`   ✓ ${name} kuruldu`);
}

async function main(): Promise<void> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY || (await ask("TikTok CLIENT_KEY: "));
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET || (await ask("TikTok CLIENT_SECRET: "));
  if (!clientKey || !clientSecret) {
    console.error("❌ CLIENT_KEY ve CLIENT_SECRET zorunlu.");
    process.exit(1);
  }

  const state = "pythia_" + Math.random().toString(36).slice(2, 12);
  const authUrl =
    `${AUTH_BASE}?client_key=${encodeURIComponent(clientKey)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${state}`;

  console.log("\n" + "═".repeat(64));
  console.log("1) Şu URL'yi tarayıcıda AÇ ve uygulamaya İZİN VER:");
  console.log("─".repeat(64));
  console.log(authUrl);
  console.log("═".repeat(64) + "\n");
  console.log("2) İzin verince tarayıcı otomatik geri döner, kod burada yakalanır.\n");

  const code = await waitForCode(state);
  console.log("   ✓ Yetki kodu alındı, token'a çevriliyor...");

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
    process.exit(1);
  }
  console.log(`   ✓ refresh_token alındı (scope: ${j.scope ?? "?"})\n`);

  console.log("3) GitHub secret'ları yazılıyor...");
  setSecret("TIKTOK_CLIENT_KEY", clientKey);
  setSecret("TIKTOK_CLIENT_SECRET", clientSecret);
  setSecret("TIKTOK_REFRESH_TOKEN", j.refresh_token);

  console.log("\n🎉 BİTTİ! 3 secret kuruldu. Artık her IG slotunda video TikTok drafts'a düşecek.");
  console.log("   Test: GitHub → Actions → 'Pythia Günlük Video' → Run workflow → instagram");
  process.exit(0);
}

main().catch((e) => {
  console.error("\n💥 Hata:", e);
  process.exit(1);
});
