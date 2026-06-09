# ☁️ GitHub Actions — PC'siz Tam Otomasyon Kurulumu

Bu kurulumdan sonra **bilgisayarın kapalı olsa bile** her gün 2 video
otomatik üretilip YouTube'a (13:00 + 20:00 TR zamanlı) yüklenir.

---

## 📋 ADIM 1 — GitHub Repo Oluştur

1. https://github.com/new aç
2. **Repository name:** `pythia-video-bot`
3. **Private** seç (önemli — proje senin)
4. README/gitignore EKLEME (boş repo)
5. **Create repository**

---

## 📋 ADIM 2 — Repo'yu Bağla + Push

Açılan sayfadaki URL'yi kullan (örn. `https://github.com/KULLANICI/pythia-video-bot.git`):

```bash
cd C:\Users\berka\remotion-hello-world
git remote add origin https://github.com/KULLANICI/pythia-video-bot.git
git push -u origin main
```

> İlk push'ta GitHub kullanıcı adı + token (şifre değil) ister.
> Token yoksa: https://github.com/settings/tokens → "Generate new token (classic)" → repo izni.

---

## 📋 ADIM 3 — 2 Secret Ekle (KRİTİK)

Repo sayfasında: **Settings → Secrets and variables → Actions → New repository secret**

### Secret 1: `GOOGLE_CREDENTIALS`
- **Name:** `GOOGLE_CREDENTIALS`
- **Value:** `scripts/credentials.json` dosyasının **TÜM içeriği**
  (Not Defteri'yle aç, hepsini kopyala-yapıştır)

### Secret 2: `GOOGLE_TOKEN`
- **Name:** `GOOGLE_TOKEN`
- **Value:** `scripts/token.json` dosyasının **TÜM içeriği**

> Bu iki dosya `.gitignore`'da — repo'ya yüklenmez, sadece secret olarak durur.
> `token.json` içindeki `refresh_token` sayesinde bulutta otomatik yenilenir.

---

## 📋 ADIM 4 — Test Et (Manuel Tetikle)

1. Repo → **Actions** sekmesi
2. Sol menü → **Pythia Günlük Video**
3. **Run workflow** → **Run workflow** (yeşil buton)
4. ~5-8 dakika bekle → yeşil ✓ olunca 2 video YouTube'da

İlk çalışma başarılıysa → **artık her gün 05:00 UTC'de otomatik çalışır.**

---

## ⚙️ Çalışma Mantığı

```
Her gün 05:00 UTC (08:00 TR):
  GitHub sunucusu (PC değil!) →
    1. Bugünün 2 videosunu seçer (rotasyon)
    2. Render eder
    3. YouTube'a yükler:
       • Sabah video → 13:00 TR'ye zamanlı
       • Akşam video → 20:00 TR'ye zamanlı
  YouTube doğru saatte otomatik public yapar.
```

**PC tamamen kapalı olabilir.** ✅

---

## 💰 Maliyet

- GitHub Actions free tier: **2000 dk/ay**
- Günlük kullanım: ~6-8 dk (render + upload)
- Aylık: ~210 dk → **free tier'ın içinde, $0**

---

## 🔧 Saatleri Değiştirmek

`scripts/render-rotation.ts` içinde:
```ts
const SLOT_HOUR_TR = { morning: 13, evening: 20 };
```
İstediğin saate çek, commit + push et.

Cron saatini değiştirmek için `.github/workflows/daily-video.yml`:
```yaml
- cron: "0 5 * * *"   # 05:00 UTC
```

---

## 🆘 Sorun Giderme

| Sorun | Çözüm |
|---|---|
| Actions kırmızı (render hatası) | Logları aç, genelde Chrome deps — workflow zaten kuruyor |
| "invalid_grant" | token.json secret'ı eksik/yanlış, yeniden ekle |
| Video yüklenmiyor | GOOGLE_CREDENTIALS secret'ı kontrol et |
| Quota exceeded | Günde 6 videodan fazla → normalde olmaz |

---

## 🎯 Özet

```
✅ Repo oluştur (private)
✅ git push
✅ 2 secret ekle (credentials + token)
✅ Actions → Run workflow (test)
✅ Yeşil ✓ → her gün otomatik, PC kapalı
```
