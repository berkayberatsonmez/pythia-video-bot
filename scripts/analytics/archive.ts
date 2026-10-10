// ═══════════════════════════════════════════════════════════════════════════
// analytics/archive.ts — Günlüğü GitHub Release'e (tag: video-observability) arşivler
//
// Her koşunun events.jsonl'i içerik-adresli bir asset olarak yüklenir
// (journal-<sha256>.jsonl) → eşzamanlı koşular birbirini ezmez, tekrar push idempotent.
//
// ⚠️ PUBLIC REPO KARARI (Conveyor'dan BİLİNÇLİ FARK):
//    Conveyor bot'u arşivi yalnız ÖZEL depoya yazar (isPrivate değilse reddeder).
//    Pythia deposu PUBLIC kalmak ZORUNDA: PostPeer release mp4'lerini token'sız
//    çekiyor. Bu yüzden özel-depo kontrolü burada KALDIRILDI. Kabul edilebilir
//    çünkü günlük yalnız zaten herkese açık bilgi içerir: public post ID/URL'leri,
//    başlık/hook, görüntüleme-beğeni-yorum sayaçları. Token / ham API hatası /
//    kimlik bilgisi yazılmaz (bkz. ledger.assertNoSecrets + providers: yalnız
//    normalize hata kodları). Gizli bir şey günlüğe girecekse bu karar YENİDEN
//    değerlendirilmeli.
// ═══════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { ledgerDir, localJournal } from "./ledger";

const TAG = "video-observability";
type GhRunner = (args: string[]) => string;

function gh(args: string[]): string {
  const result = spawnSync("gh", args, {
    encoding: "utf8",
    timeout: 120_000,
    windowsHide: true,
  });
  if (result.status !== 0)
    throw new Error(
      `GitHub archive operation failed (${args[0]} ${args[1]}); check gh authentication and repository permissions.`,
    );
  return result.stdout;
}

/**
 * Arşiv deposunu çözer. Depo görünürlüğü (public/private) KONTROL EDİLMEZ —
 * yukarıdaki nota bak. Yalnız adın biçimini ve deponun erişilebilirliğini doğrular.
 */
export function archiveRepo(run: GhRunner = gh): string {
  const repo =
    process.env.GITHUB_REPOSITORY ||
    process.env.ANALYTICS_REPO ||
    "berkayberatsonmez/pythia-video-bot";
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo))
    throw new Error("Invalid analytics archive repository name.");
  JSON.parse(run(["repo", "view", repo, "--json", "name"]));
  return repo;
}

export function pushJournal(): void {
  if (
    !existsSync(localJournal()) ||
    !readFileSync(localJournal(), "utf8").trim()
  )
    return;
  const repo = archiveRepo();
  // Eşzamanlı oluşturma zararsız: create başarısız olursa release'in var olduğunu doğrula.
  try {
    gh(["release", "view", TAG, "--repo", repo]);
  } catch {
    try {
      gh([
        "release",
        "create",
        TAG,
        "--repo",
        repo,
        "--title",
        "Video observability",
        "--notes",
        "Append-only publication and metric journals (public post IDs and counters only).",
        "--latest=false",
      ]);
    } catch {
      gh(["release", "view", TAG, "--repo", repo]);
    }
  }
  const bytes = readFileSync(localJournal());
  const hash = createHash("sha256").update(bytes).digest("hex");
  const name = `journal-${hash}.jsonl`;
  const file = join(ledgerDir(), name);
  copyFileSync(localJournal(), file);
  // İçerik-adresli paketler başka koşunun olaylarını asla ezmez; tekrar push idempotent.
  gh(["release", "upload", TAG, file, "--repo", repo, "--clobber"]);
  console.log(`Analytics archived: ${TAG}/${name}`);
}

export function pullJournals(): void {
  const repo = archiveRepo();
  // Tam 404 = ilk koşu, boş arşiv. Kimlik/ağ hataları boş görünmemeli.
  const lookup = spawnSync(
    "gh",
    ["api", `repos/${repo}/releases/tags/${TAG}`],
    { encoding: "utf8", timeout: 30_000, windowsHide: true },
  );
  if (lookup.status !== 0) {
    if (lookup.stderr.includes("HTTP 404")) {
      console.log("No analytics archive yet.");
      return;
    }
    throw new Error(
      "Cannot read analytics archive; refusing an incomplete report.",
    );
  }
  const release = JSON.parse(lookup.stdout);
  if (
    !(release.assets || []).some((a: { name: string }) =>
      /^journal-.*\.jsonl$/.test(a.name),
    )
  )
    return;
  const dir = join(ledgerDir(), "archive");
  mkdirSync(dir, { recursive: true });
  gh([
    "release",
    "download",
    TAG,
    "--repo",
    repo,
    "--pattern",
    "journal-*.jsonl",
    "--dir",
    dir,
    "--skip-existing",
  ]);
}
