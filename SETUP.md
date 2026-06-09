# 🌙 Pythia Daily YouTube Automation — Setup Guide

Otomatik günlük "Rüyanda X gördüysen" videosu üretip YouTube Shorts'a yükler.

---

## 📁 Proje Yapısı

```
remotion-hello-world/
├── src/
│   ├── data/dream-symbols.ts        ← 10 sembol veritabanı
│   ├── components/SymbolIcon.tsx    ← SVG ikonlar
│   ├── DreamSymbolVideo.tsx         ← Parametrik template
│   └── Root.tsx
├── scripts/
│   ├── render-daily.ts              ← Otomatik render
│   ├── upload-youtube.ts            ← YouTube API upload
│   ├── daily-pipeline.ts            ← Render + upload combo
│   ├── credentials.json             ← OAuth (SETUP gerekli)
│   └── token.json                   ← Auto-generated (1. çalıştırmada)
└── out/daily/
    └── 2026-06-08_snake.mp4         ← Tarihli outputlar
```

---

## ⚙️ İlk Kurulum (Sadece 1 Kere)

### 1. YouTube Data API Aktif Et

1. https://console.cloud.google.com/ aç
2. **New Project** → "Pythia Video Automation"
3. **APIs & Services** → **Library**
4. **YouTube Data API v3** ara → **Enable**

### 2. OAuth Consent Screen

1. **APIs & Services** → **OAuth consent screen**
2. **External** seç (testte gmail yeterli)
3. App name: `Pythia Auto Upload`
4. User support email: kendi email'in
5. Developer contact: kendi email'in
6. **Test users**: kendi YouTube hesap email'ini ekle
7. Save & Continue

### 3. OAuth Client ID

1. **Credentials** → **Create credentials** → **OAuth client ID**
2. Application type: **Desktop app**
3. Name: `Pythia Upload Client`
4. **Create** → JSON dosyasını indir
5. **scripts/credentials.json** olarak kaydet

### 4. İlk Çalıştırma — Token Üretme

```bash
npm run upload:youtube -- --video out/daily/test.mp4 --symbol snake
```

İlk seferinde tarayıcı açılır:
1. YouTube hesabınla giriş yap
2. İzin ver
3. Code çıkar → terminalde ver
4. `scripts/token.json` otomatik oluşur

**Tek sefer.** Sonra her seferinde otomatik.

---

## 🎬 Kullanım

### Bugünün videosunu üret (sembol otomatik seçilir)

```bash
npm run render:today
```

→ `out/daily/2026-06-08_snake.mp4` oluşur (tarihe göre rotation)

### Belirli sembol üret

```bash
npm run render:symbol -- water
```

Mevcut semboller: `snake, tooth, water, fire, spider, falling, flying, dead, key, eye`

### Tüm 10 sembolü birden üret

```bash
npm run render:all
```

(~5 dakika sürer)

### YouTube'a yükle (manuel)

```bash
npm run upload:youtube -- \
  --video out/daily/2026-06-08_snake.mp4 \
  --symbol snake \
  --privacy public
```

### Render + Upload otomatik (tek komut)

```bash
npm run daily
```

---

## ⏰ Cron Job Setup (Otomatik Günlük)

### Windows Task Scheduler

```
1. Task Scheduler aç
2. Create Basic Task
3. Trigger: Daily at 06:00
4. Action: Start a program
5. Program: cmd.exe
6. Arguments: /c cd /d C:\Users\berka\remotion-hello-world && npm run daily
```

### Linux/Mac Cron

```bash
crontab -e

# Her gün 06:00
0 6 * * * cd /path/to/remotion-hello-world && npm run daily >> /tmp/pythia-daily.log 2>&1
```

---

## 🎯 Maliyet

- **OpenAI:** Pythia uygulamasının kendi Cloud Function'ı, ekstra maliyet yok
- **YouTube API:** Bedava (6 video/gün limit)
- **Server (cron):** Bedava (kendi bilgisayarın) veya Railway/Render free tier

**Toplam aylık maliyet: $0** 🎉

---

## 🔍 Sorun Giderme

### `❌ Missing: credentials.json`
→ Adım 3 yapılmadı

### `Quota exceeded`
→ Günde 6 videodan fazla yüklüyorsun, API quota artırma talep et

### `Authorization required`
→ `token.json` sil, yeniden auth yap

### Video yüklendi ama "Content under review"
→ Normal, YouTube AI check yapıyor (1-12 saat)

---

## 📊 İçerik Stratejisi

10 sembol = **10 günlük döngü**. Her gün otomatik farklı sembol gider.

**Sonraki:** Yeni semboller ekle `src/data/dream-symbols.ts`'e.
Önerilen ekstra semboller:
- eski sevgili (high search)
- hamile (high search)
- köpek
- kedi
- ev
- araba
- doğmuş bebek

Her yeni sembol için:
1. Veriyi ekle `dream-symbols.ts`
2. Icon ekle `SymbolIcon.tsx` (yeni SVG)
3. Test render
4. Done!

---

## 🎬 Hazır!

Sistemin tamamı 7 dosyada. Setup tamam olunca **0 manuel iş** ile günlük YouTube içerik üretir.

İyi şanslar! 🌙🐍
