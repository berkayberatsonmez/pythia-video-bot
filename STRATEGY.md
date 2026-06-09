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
