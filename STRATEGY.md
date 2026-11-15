# 🌙 Pythia İçerik & Paylaşım Stratejisi

> Otomatik video üretim + YouTube Shorts paylaşım sistemi için referans.

---

## 📊 PAYLAŞIM SIKLIĞI

YouTube Shorts **uzun kuyrukludur** — videolar günlerce/haftalarca önerilmeye
devam eder. Bu yüzden **tutarlılık > hacim**.

| Sıklık | Etki | Faz |
|---|---|---|
| 1/gün | Güvenli, trust inşa eder | Hafta 1-2 |
| **2/gün** | **Optimal büyüme** ⭐ | Hafta 3-4 |
| 3/gün | Metrikler iyiyse | Ay 2+ |
| 4+/gün | Trust budget dağılır ❌ | — |

### Kademeli Ramp
```
Hafta 1-2:  1/gün   → algoritma güveni
Hafta 3-4:  2/gün   → sabah + akşam
Ay 2+:      3/gün   → metrikler destekliyorsa
```

---

## ⏰ SAAT SLOTLARI (TR birincil)

| Slot | Saat (TR) | Yakaladığı |
|---|---|---|
| 🌅 Öğle | **13:00** | TR öğle molası + Avrupa öğle öncesi |
| 🌙 Akşam | **20:30** | TR peak + ABD öğleden sonra ⭐ |
| ☀️ Sabah (3/gün) | **08:30** | TR sabah + Asya akşamı |

**Kural:** Aynı izleyici peş peşe aynı kategoriyi görmesin → **kategori rotasyonu**.

---

## 🔄 KATEGORİ ROTASYONU (2/gün)

Çeşitlilik = daha geniş kitle. Haftalık döngü:

| Gün | 13:00 Slot | 20:30 Slot |
|---|---|---|
| Pazartesi | 🌙 Rüya | 🔢 Numeroloji |
| Salı | 🃏 Tarot | ✨ Melek Sayısı |
| Çarşamba | 🌙 Rüya | ⭐ Burç |
| Perşembe | 🃏 Tarot | 🌕 Manifest |
| Cuma | 🌙 Rüya | ✨ Melek Sayısı |
| Cumartesi | ⭐ Burç | 🔢 Numeroloji |
| Pazar | 🃏 Tarot | 🌕 Manifest |

---

## 📦 İÇERİK HAVUZU

| Kategori | Adet | Durum | Render |
|---|---|---|---|
| 🌙 Rüya | 10 (→40 hedef) | ✅ Çalışıyor | `DreamSymbolVideo` |
| 🃏 Tarot | 22 | ✅ Çalışıyor | `TarotVideo` |
| 🔢 Numeroloji | 12 | ✅ Çalışıyor | `NumberVideo` |
| ✨ Melek Sayısı | 9 | ✅ Çalışıyor | `NumberVideo` |
| ⭐ Burç | 12 | ⏳ Yapılacak | `ZodiacVideo` |
| 🌕 Manifest | 15 | ⏳ Yapılacak | `ManifestVideo` |
| **TOPLAM** | **~80-110** | | **~1.5-2 ay** tekrarsız 2/gün |

---

## 🎬 RENDER KOMUTLARI

```bash
# Rüya
npx remotion render src/index.ts DreamSymbolVideo out/v.mp4 --props='{"symbolId":"snake"}'

# Tarot
npx remotion render src/index.ts TarotVideo out/v.mp4 --props='{"cardId":"star"}'

# Numeroloji / Melek Sayısı
npx remotion render src/index.ts NumberVideo out/v.mp4 --props='{"numberId":"a1111"}'
```

---

## 📈 BAŞARIM METRİKLERİ

İlk 48 saatte izle (her video):
- **>100 izlenme** → algoritma test ediyor, normal
- **>500** → iyi sinyaller, boost geliyor
- **>2.000** → viral potansiyeli, aynı kategoride seri yap

Haftalık:
- Hangi **kategori** en çok çekiyor? → o kategoriye ağırlık ver
- Hangi **saat** daha iyi? → slot ayarla

---

## 🎯 ÖZET KARAR

```
✅ Sıklık:  2/gün (hafta 3'ten sonra)
✅ Saatler: 13:00 + 20:30 TR
✅ Rotasyon: kategori bazlı (yukarıdaki tablo)
✅ Platform: YouTube Shorts birincil (en iyi organik)
✅ Havuz: ~80-110 video = 1.5-2 ay tekrarsız
```

---

## 🧠 PERFORMANS AĞIRLIĞI + GÜNDEM (2026-11-11'den itibaren)

Rotasyon artık sabit bir dizi değil, günleri sırayla kuran **deterministik bir
planlayıcı** (`scripts/rotation.ts`). Eski dizi 2026-11-10'a kadar aynen geçerli.

**Ağırlık (haftalık, veriden):** `.github/workflows/pool-weights.yml` her
pazartesi son 28 günün Instagram metriklerinden kategori ağırlığını hesaplar
(`scripts/pool-weights.ts`) ve `src/data/pool-weights.json`'a yeni bir kayıt
önerir (`raporlar` dalı / PR). **Birleştirmeden hiçbir şey değişmez.**

| ağırlık | anlamı |
|---|---|
| 2 | eski rotasyondaki sıklık (nötr) |
| 4 | iki katı (en fazla) |
| 1 | yarısı (en az — hiçbir kategori kapanmaz) |

Pay = ağırlık × kategori boyu, tek kategori en çok %40. Skor: izlenme +
10×(paylaşım+kaydetme), logaritmik ortalama, az videolu kategori genel
ortalamaya çekilir. Öneri `from` gününden ÖNCE birleştirilmeli.

**Tekrar yok:** aynı video 21 gün içinde iki kez çıkmaz; sabah ≠ akşam ve
akşam ≠ ertesi sabah kategorisi; ağırlık değişince geçmiş günler değişmez.

**Gündem (`scripts/gundem.ts`, günde en çok 1 slot, önce sabah = TikTok):**
11.11 / 12.12 portal → melek sayısı · Sevgililer Günü → uyum / aşk ·
yılbaşı haftası → yeni başlangıç manifestoları · Dolunay → bırakma, Yeniay →
niyet manifestoları · Güneş burç değiştirince ilk 10 gün → "X sezonunda
parlayan 3 burç" (`src/data/zodiac-season-rankings.ts`) + o burcun videoları ·
Merkür/Venüs/Mars retrosu → iletişim / eski sevgili içerikleri. Dini gün yok.
Google Trends seçimi değiştirmez (yalnız etiket): IG ve TikTok farklı saatte
indiriyor, seçim ikisinde aynı kalmalı.

```bash
npm run plan:preview -- --days 30      # eski vs yeni, kategori dağılımı
npm run gundem:preview -- --days 60    # hangi gün hangi gündem
npm run weights:report                 # (analytics:pull sonrası) ağırlık tablosu
npm run verify:planner && npm run verify:weights
```
