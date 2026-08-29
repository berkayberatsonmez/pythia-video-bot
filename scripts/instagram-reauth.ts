// ═══════════════════════════════════════════════════════════════════════════
// instagram-reauth.ts — IG token'ı YORUM OKUMA izniyle yeniden al
//
// NEDEN: mevcut token yorum YAZABİLİYOR ama OKUYAMIYOR. Teşhis çıktısı:
//   GET /{media}?fields=comments_count,comments{id,text}
//     → {"comments_count":1,"id":"..."}        ← comments alanı SESSİZCE DÜŞTÜ
//   GET /{media}/comments                       → {"data":[], "paging":{cursors DOLU}}
// Meta, izin verilmeyen alanı hata vermeden cevaptan çıkarır. Yani token
// instagram_business_manage_comments kapsamı olmadan yetkilendirilmiş.
//
// 2 AŞAMA (CLI-arg — Windows readline takılmasın, youtube-reauth ile aynı kalıp):
//   1) npx tsx scripts/instagram-reauth.ts             → yetki URL'ini yazar
//   2) (tarayıcıda izin ver → redirect ?code=... → adres çubuğunu kopyala)
//   3) npx tsx scripts/instagram-reauth.ts 'KOD_VEYA_URL'  → uzun ömürlü token + secret
//
// ÖN KOŞUL (Meta App Dashboard → Instagram → API setup with Instagram login):
//   • IG_APP_ID ve IG_APP_SECRET env olarak verilmeli
//   • Redirect URI panelde KAYITLI olmalı (aşağıdaki REDIRECT ile birebir aynı)
//   • İzinlerde instagram_business_manage_comments işaretli olmalı
// ═══════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";

const REPO = "berkayberatsonmez/pythia-video-bot";

// Yorum okumak için manage_comments ŞART. Diğer ikisi mevcut işleyişi korur.
const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_comments",
].join(",");

const REDIRECT =
  process.env.IG_REDIRECT_URI ||
  "https://berkayberatsonmez.github.io/oauth-callback.html";

function need(name: string): string {
  const v = (process.env[name] || "").trim();
  if (!v) {
    console.error(`❌ ${name} env değişkeni yok.`);
    console.error("   Meta App Dashboard → Instagram → API setup with Instagram login");
    console.error("   içindeki Instagram app ID / secret değerlerini ver:");
    console.error('   $env:IG_APP_ID="..."; $env:IG_APP_SECRET="..."');
    process.exit(1);
  }
  return v;
}

function extractCode(input: string): string {
  let code = input.trim();
  if (code.includes("code=")) {
    const m = code.match(/[?&]code=([^&#]+)/);
    if (m) code = m[1];
  }
  return code.replace(/#_$/, ""); // Instagram redirect'e "#_" ekliyor
}

/** Aşama 1 — yetki URL'ini yaz. */
function printAuthUrl(): void {
  const appId = need("IG_APP_ID");
  const url =
    "https://www.instagram.com/oauth/authorize" +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT)}` +
    "&response_type=code" +
    `&scope=${encodeURIComponent(SCOPES)}`;

  console.log("\n1) Bu adresi tarayıcıda aç ve izin ver:\n");
  console.log(url);
  console.log("\n2) Yönlendirilince adres çubuğundaki TAM URL'i kopyala.");
  console.log("3) Sonra şunu çalıştır:\n");
  console.log("   npx tsx scripts/instagram-reauth.ts 'YAPISTIRDIGIN_URL'\n");
  console.log(`   (redirect_uri: ${REDIRECT} — Meta panelinde KAYITLI olmalı)\n`);
}

/** Aşama 2 — kodu uzun ömürlü token'a çevir. */
async function exchange(rawCode: string): Promise<void> {
  const appId = need("IG_APP_ID");
  const secret = need("IG_APP_SECRET");
  const code = extractCode(rawCode);

  console.log("🔄 Kod kısa ömürlü token'a çevriliyor...");
  const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: appId,
      client_secret: secret,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT,
      code,
    }),
  });
  const shortJson: any = await shortRes.json().catch(() => ({}));
  if (!shortRes.ok || shortJson?.error_type || shortJson?.error) {
    throw new Error(`Kısa token alınamadı: ${JSON.stringify(shortJson)}`);
  }
  const shortToken = String(shortJson.access_token || "");
  console.log(`   ✓ kısa token alındı (user_id: ${shortJson.user_id ?? "?"})`);
  console.log(`   ✓ verilen izinler: ${shortJson.permissions ?? "(bildirilmedi)"}`);

  console.log("🔄 Uzun ömürlüye (60 gün) çevriliyor...");
  const longRes = await fetch(
    "https://graph.instagram.com/access_token?" +
      new URLSearchParams({
        grant_type: "ig_exchange_token",
        client_secret: secret,
        access_token: shortToken,
      }),
  );
  const longJson: any = await longRes.json().catch(() => ({}));
  if (!longRes.ok || longJson?.error) {
    throw new Error(`Uzun token alınamadı: ${JSON.stringify(longJson)}`);
  }
  const longToken = String(longJson.access_token || "");
  const days = Math.round(Number(longJson.expires_in || 0) / 86400);
  console.log(`   ✓ uzun token alındı (~${days} gün geçerli)`);

  // Yeni token gerçekten yorum OKUYABİLİYOR mu? Secret'ı kurmadan önce doğrula.
  console.log("🔎 Yorum okuma izni doğrulanıyor...");
  const mediaRes = await fetch(
    "https://graph.instagram.com/me/media?" +
      new URLSearchParams({ fields: "id,comments_count", limit: "5", access_token: longToken }),
  );
  const media: any = await mediaRes.json().catch(() => ({}));
  const target = (media.data ?? []).find((m: any) => Number(m.comments_count || 0) > 0);

  if (!target) {
    console.log("   ⚠️  Son 5 gönderide yorum yok, okuma testi yapılamadı.");
  } else {
    const cRes = await fetch(
      `https://graph.instagram.com/${target.id}/comments?` +
        new URLSearchParams({ fields: "id,text,username", access_token: longToken }),
    );
    const c: any = await cRes.json().catch(() => ({}));
    const got = (c.data ?? []).length;
    if (got > 0) {
      console.log(`   ✅ OKUMA ÇALIŞIYOR — ${target.comments_count} yorumdan ${got} tanesi geldi`);
    } else {
      console.log(`   ❌ HÂLÂ BOŞ — ${target.comments_count} yorum var ama uç boş döndü.`);
      console.log("      Meta panelinde instagram_business_manage_comments izni");
      console.log("      onaylı mı, App Review gerekiyor mu kontrol et.");
      console.log(`      Ham cevap: ${JSON.stringify(c).slice(0, 200)}`);
    }
  }

  console.log("\n🔐 GitHub secret güncelleniyor (IG_ACCESS_TOKEN)...");
  const r = spawnSync("gh", ["secret", "set", "IG_ACCESS_TOKEN", "--repo", REPO, "--body", longToken], {
    stdio: "inherit",
    shell: true,
  });
  if (r.status !== 0) {
    console.error("❌ gh secret set başarısız (gh login + repo erişimi var mı?)");
    console.log("\nToken'ı elle koymak istersen aşağıda:\n");
    console.log(longToken);
    process.exit(1);
  }
  console.log("   ✓ IG_ACCESS_TOKEN güncellendi");
  console.log("\n🎉 BİTTİ! Şimdi 'Pythia IG Yorum Yanıtla' workflow'unu debug modda çalıştır.");
}

const arg = process.argv[2];
(arg ? exchange(arg) : Promise.resolve(printAuthUrl())).catch((e) => {
  console.error("\n💥 Hata:", e);
  process.exit(1);
});
