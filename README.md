# 📦 Conveyor Sort — Sentetik Oyun Videosu Botu

[Conveyor Sort](https://play.google.com/store/apps/details?id=com.bbs.parcelperfect)
(Google Play) için **tam otomatik** video üretim + yükleme sistemi. Bir bot oyunu
oynar, **Remotion** oyunu kare kare yeniden çizer (oyunun görsel dili + SFX'i birebir),
ve YouTube Shorts / Instagram Reels / TikTok'a yükler. **Sıfır insan dokunuşu** —
secrets doldur, cron tetiğini kur, bitti.

> **Faz 2: sentetik replay.** İçerik artık el ile kaydedilen klip değil; oyunun
> GERÇEK dizilim üreticisi (Dart determinizmiyle birebir) + botun oynadığı
> zaman çizelgesi. Faz 1'in manuel klip/manifest/scrcpy akışı kaldırıldı.

---

## 🎬 Nasıl çalışır

```
rotation.ts (bugünün formatı)
        │
        ▼
botSim.ts  ──►  oyunun GERÇEK dizilimi (levelConfig ⇔ Dart parite)
   (bot oynar)     + tek-el insansı zaman çizelgesi (drag/dock/seal olayları)
        │
        ▼
GameReplay / SealCompilation (Remotion)  ──►  out/daily/*.mp4
   (sky/belt/bins/dock/items/HUD birebir + senkron SFX + hook + CTA)
        │
        ▼
upload-youtube / upload-instagram / upload-tiktok  (dedup + zamanlı yayın)
```

### Formatlar (rotation.ts — 7 format)
- **DailyChallenge** — oyunun GERÇEK günlük bulmacası (seed = `yyyyMMdd`, `dailyConfig`).
  Bot temiz el oynar; hook: *"Bugünün bulmacası — ben 0:XX'te bitirdim, sen?"*.
  Videodaki bulmaca uygulamadaki günlükle **birebir aynı** (determinizm garantisi).
- **LevelShowcase** — seed'den seviye (L12-30), **nearMiss** (gerilim).
- **SealCompilation** — 3 kısa **mühür-yoğun** kesit ("oddly satisfying").
- **SpeedClimb** — L1→L5 hızlı montaj, aralarda "Seviye N →" kartı. Hook: *"1. seviye kolay dedin... 5.'ye gel"*.
- **FailBait** — bot bir paketi tehlikeye sokar, video düşmeye ~0.4sn kala **DONAR** (zoom + "?!"),
  sonra *"Sen kurtarabilir miydin?"* engagement kartı. Gerçek kayıp OLMAZ (validator bütçesi bozulmaz).
- **BoosterSave** — kaos anında **Yavaşlat** booster'ı (bant 0.5×), HUD'da buton basış + coin düşüşü. Hook: *"Son saniye kurtarışı ⏳"*.
- **PerfectRunASMR** — L20+, müzik yok/yalnız SFX, hook yerine "🎧 sesli izle" rozeti, maksimum akıcı (Shorts sınırı için ≤88sn).

**Rotasyon:** sabah = DailyChallenge (her gün, oyunla senkron). Akşam = kalan 6 format
gün-endeksli döngü (art arda aynı format gelmez). `npx tsx scripts/rotation.ts --schedule 14`
ile N günlük tabloyu gör.

---

## 🎯 Determinizm — Dart paritesi

Oyunun spawn dizilimi Dart'ın `Random(seed)` + `List.shuffle` ile üretilir. Video
botu "bugünün GERÇEK bulmacasını" gösterebilmek için TS port'u Dart VM'iyle **bit-bit
aynı** olmalı. `src/game/dartRandom.ts` + `levelConfig.ts` bunu sağlar; `flutter test`
ile üretilen ground-truth (`test/fixtures/parity-groundtruth.json`) ile doğrulanır:

```bash
npm run verify:determinism    # TS ⇔ Dart: daily seed + L1..L42 dizilimleri birebir
```

Ground-truth'u yenilemek için (oyun kodu değişirse):
`test/fixtures/dart-parity-harness.dart.txt` → conveyor_sort_app `test/`'ine kopyala →
`flutter test` → çıktıdaki `PARITY_JSON` bloğunu fixture'a yaz.

---

## ⚙️ Kurulum

```bash
npm install
```

**Asset'ler `public/`'te hazır:** `icon.png` (oyun ikonu, CTA), `sfx/*.mp3` (oyunun
gerçek SFX'i — drop/seal/dock/lost/win, `conveyor_sort_app/assets/audio`'dan kopyalandı).
Opsiyonel: `public/qr.png` (store QR, `showQr:true`), `public/music.mp3` (arka müzik).

**Store linki:** `src/appConfig.ts` → `PACKAGE_ID = "com.bbs.parcelperfect"` (ayarlı).

---

## 🚀 Komutlar

```bash
npm run dev                  # Remotion Studio — GameReplay / SealCompilation önizleme
npm run daily:preview        # Bugün hangi formatlar gidecek (render yok)
npm run daily:render         # Bugünün videolarını render et (upload yok)
npm run daily:test           # Render + YouTube'a hemen unlisted (test)
npm run daily                # Render + YouTube (zamanlı) + Instagram + TikTok
npm run verify:determinism   # Dart parite testi
npm run lint                 # eslint + tsc
```

Bayraklar (`generate-daily.ts`): `--upload` (YT), `--instagram`, `--tiktok`, `--now`,
`--privacy <public|unlisted|private>`, `--slot <morning|evening>`, `--preview`.

---

## 🔐 Secrets (GitHub Actions) — Pythia sürümüyle birebir aynı

| Secret | Ne için | Nasıl üretilir |
|--------|---------|----------------|
| `GOOGLE_CREDENTIALS_B64` | YouTube OAuth istemcisi | Google Cloud → YouTube Data API v3 → OAuth Desktop client → `credentials.json` → `base64 -w0` |
| `GOOGLE_TOKEN_B64` | YouTube refresh token | `npm run upload:youtube` ile `token.json` üret → `base64 -w0` (veya `scripts/youtube-reauth.ts`) |
| `IG_ACCESS_TOKEN` | Instagram Reels yayını | Instagram Login API (uzun ömürlü token) |
| `IG_USER_ID` | IG hesap kimliği | Graph API `/me` |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | TikTok Content Posting | TikTok Developer app |
| `TIKTOK_REFRESH_TOKEN` | TikTok drafts upload | `scripts/tiktok-oauth.ts` (yılda bir rotasyon) |

> `GITHUB_TOKEN` Actions'ta otomatik (IG video hosting için `gh release`). IG hosting
> repo'su `GITHUB_REPOSITORY`'den okunur — yerelde `GH_REPO` ile override edilir.

**Kur-ve-unut:** secrets'ı gir → dakik IG zamanlaması için
[cron-job.org](https://cron-job.org) → `repository_dispatch` (`ig-morning` / `ig-evening`)
tetiğini kur → bitti. GitHub cron'ları yedek olarak zaten tanımlı.

---

## ⏰ Otomasyon (`.github/workflows/daily-video.yml`)

Cron + `repository_dispatch` + `workflow_dispatch` iskeleti Pythia'dan korundu. Render
adımı artık `generate-daily.ts` → `remotion render` zinciri. Varsayılan: YouTube günde 1
(sabah, 13:00 TR zamanlı), Instagram + TikTok sabah/akşam. Actions sekmesinden manuel
tetik de var (`both`/`instagram`/`youtube`/`tiktok`).

---

## 🗂️ Yapı

```
src/
  appConfig.ts             # Oyun sabitleri (store linki) — tek kaynak
  Root.tsx                 # GameReplay + SealCompilation kaydı
  GameReplay.tsx           # DailyChallenge / LevelShowcase kompozisyonu
  SealCompilation.tsx      # Mühür-yoğun kesit derlemesi
  components/gameStyle.tsx # CTA kartı + palet yardımcıları
  game/
    dartRandom.ts          # dart:math Random + shuffle BİREBİR portu
    levelConfig.ts         # level_config.dart portu (dizilim üreteci — Dart parite)
    sequenceValidator.ts   # sequence_validator.dart portu (adalet/bot temeli)
    dailyConfig.ts         # günlük bulmaca config + seed (yyyyMMdd)
    botSim.ts              # bot oyuncu → izlenebilir eylem zaman çizelgesi
    layout.ts              # sahne geometrisi + palet (theme.dart + components)
    GameScene.tsx          # timeline'ı kare kare çizer (oyunun görsel dili)
    GameAudio.tsx          # SFX olaylarını timeline'a koyar
    hookProgress.tsx       # hook bandı + progress bar
scripts/
  rotation.ts              # bugünün formatı (deterministik)
  generate-daily.ts        # render kuyruğu + upload orkestrasyonu
  metadata.ts              # YT/IG/TikTok başlık·açıklama·hashtag·ilk yorum
  verify-determinism.ts    # Dart parite testi
  upload-youtube/instagram/tiktok.ts   # Pythia'dan korunan upload + dedup
  tiktok-oauth.ts / youtube-reauth.ts  # token yardımcıları
test/fixtures/             # Dart ground-truth + parite harness'ı
public/icon.png · public/sfx/*.mp3     # oyun ikonu + SFX
```
