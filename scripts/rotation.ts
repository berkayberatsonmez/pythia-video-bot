// ═══════════════════════════════════════════════════════════════════════════
// rotation.ts — Stateless çok-kategorili rotasyon (CI uyumlu)
//
// Tarih-tabanlı deterministik: state dosyası YOK → GitHub Actions'ta
// her çalışma aynı/doğru sonucu verir. Round-robin ile kategoriler
// karışık dizilir (peş peşe aynı kategori gelmez → sabah ve akşam slotu
// her zaman FARKLI kategoriden; bkz. verify-rotation.ts).
// ═══════════════════════════════════════════════════════════════════════════

import { DREAM_SYMBOLS } from "../src/data/dream-symbols";
import { TAROT_CARDS } from "../src/data/tarot-cards";
import { NUMBERS } from "../src/data/numbers";
import { ZODIAC_SIGNS } from "../src/data/zodiac-signs";
import { MANIFESTATIONS } from "../src/data/manifestation";
import { ZODIAC_RANKINGS } from "../src/data/zodiac-rankings";
import { ZODIAC_BEHAVIORS } from "../src/data/zodiac-behaviors";
import { ZODIAC_COMPATIBILITY } from "../src/data/zodiac-compatibility";

export type PoolKey =
  | "dream"
  | "tarot"
  | "numerology"
  | "angel"
  | "zodiac"
  | "manifest"
  | "ranking"
  | "behavior"
  | "compat";

type Pool = {
  comp: string;
  key: string; // props key
  category: string; // render-one kategori adı
  ids: string[];
  label: string;
};

// Rüya sembollerini arama hacmine göre sırala (yüksek önce) → en çok aranan
// içerik ("rüyada yılan/diş görmek" gibi) önce ve daha sık paylaşılsın.
const SEARCH_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
const DREAM_IDS_BY_SEARCH = [...DREAM_SYMBOLS]
  .sort((a, b) => SEARCH_RANK[a.searchVolume] - SEARCH_RANK[b.searchVolume])
  .map((s) => s.id);

export const POOLS: Record<PoolKey, Pool> = {
  dream: {
    comp: "DreamSymbolVideo",
    key: "symbolId",
    category: "dream",
    ids: DREAM_IDS_BY_SEARCH,
    label: "🌙 Rüya",
  },
  tarot: {
    comp: "TarotVideo",
    key: "cardId",
    category: "tarot",
    ids: TAROT_CARDS.map((c) => c.id),
    label: "🃏 Tarot",
  },
  numerology: {
    comp: "NumberVideo",
    key: "numberId",
    category: "number",
    ids: NUMBERS.filter((n) => n.kind === "lifepath").map((n) => n.id),
    label: "🔢 Numeroloji",
  },
  angel: {
    comp: "NumberVideo",
    key: "numberId",
    category: "number",
    ids: NUMBERS.filter((n) => n.kind === "angel").map((n) => n.id),
    label: "✨ Melek Sayısı",
  },
  zodiac: {
    comp: "ZodiacVideo",
    key: "signId",
    category: "zodiac",
    ids: ZODIAC_SIGNS.map((z) => z.id),
    label: "⭐ Burç",
  },
  manifest: {
    comp: "ManifestVideo",
    key: "manifestId",
    category: "manifest",
    ids: MANIFESTATIONS.map((m) => m.id),
    label: "🌕 Manifesto",
  },
  ranking: {
    comp: "RankingVideo",
    key: "rankingId",
    category: "ranking",
    ids: ZODIAC_RANKINGS.map((r) => r.id),
    label: "🏆 Sıralama",
  },
  behavior: {
    comp: "BehaviorVideo",
    key: "behaviorId",
    category: "behavior",
    ids: ZODIAC_BEHAVIORS.map((b) => b.id),
    label: "💔 Davranış",
  },
  compat: {
    comp: "CompatibilityVideo",
    key: "compatId",
    category: "compat",
    ids: ZODIAC_COMPATIBILITY.map((c) => c.id),
    label: "💞 Uyum",
  },
};

export type SelectedVideo = {
  slot: "morning" | "evening";
  poolKey: PoolKey;
  label: string;
  comp: string;
  category: string;
  propKey: string;
  id: string;
};

// ─── Round-robin master sequence ─────────────────────────────────────────
// Her pooldan sırayla birer eleman al → kategoriler karışır.
// Pool bitince atla. Sonuç: 75 videoluk karışık, deterministik dizi.
const POOL_ORDER: PoolKey[] = [
  "dream",
  "tarot",
  "zodiac",
  "ranking",
  "behavior",
  "compat",
  "numerology",
  "angel",
  "manifest",
];

// İzlenme için ağırlık: popüler/yüksek-aramalı kategoriler daha sık paylaşılır.
// (Rüya/tarot/burç = en çok aranan mistik konular >> numeroloji/melek/manifest)
const POOL_WEIGHTS: Record<PoolKey, number> = {
  dream: 2,
  tarot: 2,
  zodiac: 2,
  ranking: 2,
  behavior: 2,
  compat: 2,
  numerology: 1,
  angel: 1,
  manifest: 1,
};

// Ağırlıklı, KOMŞUSU FARKLI dizi. Günlük iki slot dizide yan yana iki eleman
// (day*2, day*2+1) olduğundan, sabah ve akşamın FARKLI kategoriden çıkması için
// dizide hiçbir iki komşu (dairesel, son→ilk dahil) aynı pooldan olmamalı.
//
// Her adımda, bir önceki elemanın poolu HARİÇ, "ağırlık × kalan oran"ı en
// yüksek pool seçilir (eşitlikte POOL_ORDER). Ağırlığı 2 olan popüler poollar
// ağırlığı 1 olanlardan önce/sık tüketilir; büyük pool (ör. compat) sona
// yığılmaz çünkü oran poolun kendi boyuna göre ölçülür. Deterministik: Random
// ve tarih yok. Tüm id'ler döngüde tam bir kez geçer.
export function buildSequence(): SelectedVideo[] {
  const seq: SelectedVideo[] = [];
  const cursor: Record<string, number> = {};
  for (const k of POOL_ORDER) cursor[k] = 0;
  const total = POOL_ORDER.reduce((s, k) => s + POOLS[k].ids.length, 0);
  const remainingScore = (k: PoolKey): number => {
    const n = POOLS[k].ids.length;
    return n === 0 ? 0 : (POOL_WEIGHTS[k] * (n - cursor[k])) / n;
  };
  // Kuyruğun sonu ilk elemanla da komşu (dairesel) → ilk poolu sona kadar
  // yasaklama: son eleman ilk elemanın poolundan olamaz.
  let first: PoolKey | null = null;
  while (seq.length < total) {
    const prev = seq.length ? seq[seq.length - 1].poolKey : null;
    const left = total - seq.length;
    let best: PoolKey | null = null;
    let bestScore = 0;
    // Zorunlu seçim: bir poolun kalanı, kalan yuvaların yarısından fazlaysa
    // (kalan*2 > left) komşu çakışması önlenemez hâle gelir → onu şimdi seç.
    // Büyük poolun (compat) dizinin sonuna yığılmasını bu kural engeller.
    const forced = POOL_ORDER.find(
      (k) =>
        k !== prev &&
        (POOLS[k].ids.length - cursor[k]) * 2 > left &&
        cursor[k] < POOLS[k].ids.length,
    );
    for (const k of forced ? [forced] : POOL_ORDER) {
      const pool = POOLS[k];
      if (cursor[k] >= pool.ids.length || k === prev) continue;
      // Son eleman: ilk elemanın poolunu seçme (dairesel komşuluk).
      if (left === 1 && k === first) continue;
      const sc = remainingScore(k);
      if (sc > bestScore) {
        best = k;
        bestScore = sc;
      }
    }
    // Uygulanabilir pool kalmadıysa (kalan hepsi aynı pool) komşu çakışmasını
    // kabul et — verify-rotation bunu yakalar; mevcut veri boyutlarında olmaz.
    if (best === null) {
      best = POOL_ORDER.find((k) => cursor[k] < POOLS[k].ids.length)!;
    }
    const pool = POOLS[best];
    seq.push({
      slot: "morning", // slot sonradan atanır
      poolKey: best,
      label: pool.label,
      comp: pool.comp,
      category: pool.category,
      propKey: pool.key,
      id: pool.ids[cursor[best]],
    });
    cursor[best]++;
    if (first === null) first = best;
  }
  return seq;
}

const SEQUENCE = buildSequence();

// Tek seferlik geçiş kaydırması (2026-10-13). Dizi yeniden kurulunca hangi
// id'nin hangi güne düştüğü değişti; hiçbir şey yapılmasaydı eski dizinin son
// 30 günde yayınladığı id'lerin ~%33'ü (ilk haftada ~%50'si) tekrar çıkardı
// (yayın tarafında 30 günlük bir mükerrer koruması yok; worker/dedup yalnız
// 20 saatlik aynı-başlık penceresi). 0..188 arasında tüm kaydırmalar denendi:
// 49, önümüzdeki 30 günde eski yayınlarla çakışmayı 20'den 5'e (60 slotta)
// indiriyor. Komşuluk dairesel olduğundan kaydırma "farklı kategori"
// değişmezini bozmaz. Değiştirme: yeni kaydırma yayın geçmişini yeniden
// tekrar ettirir.
const SEQUENCE_OFFSET = 49;

// Gün numarası — epoch'tan bu yana gün sayısı (UTC)
function dayNumber(): number {
  return Math.floor(Date.now() / 86400000);
}

/**
 * Bugünün 2 videosunu döndürür (sabah + akşam).
 * Tamamen stateless & deterministik — aynı gün her çağrıda aynı sonuç.
 */
export function getTodaysVideos(): SelectedVideo[] {
  return getVideosForDay(dayNumber());
}

/** Verilen gün numarası (epoch'tan bu yana UTC gün) için sabah+akşam. */
export function getVideosForDay(
  day: number,
  sequence: SelectedVideo[] = SEQUENCE,
): SelectedVideo[] {
  const len = sequence.length;
  const morning = { ...sequence[(day * 2 + SEQUENCE_OFFSET) % len], slot: "morning" as const };
  const evening = {
    ...sequence[(day * 2 + 1 + SEQUENCE_OFFSET) % len],
    slot: "evening" as const,
  };
  return [morning, evening];
}

// ─── CLI önizleme ────────────────────────────────────────────────────────
if (process.argv.includes("--preview")) {
  const picks = getTodaysVideos();
  const stamp = new Date().toLocaleDateString("tr-TR");
  console.log(`\n📅 ${stamp} — Bugünün videoları:\n`);
  for (const p of picks) {
    const slotTime = p.slot === "morning" ? "13:00" : "20:30";
    console.log(`  ${slotTime}  ${p.label}  →  ${p.id}`);
    console.log(`         npm run video -- ${p.category} ${p.id}\n`);
  }
  // Diagnostik: ağırlık dağılımı + tekrarsızlık kontrolü
  const dist: Record<string, number> = {};
  for (const s of SEQUENCE) dist[s.poolKey] = (dist[s.poolKey] || 0) + 1;
  const keys = SEQUENCE.map((s) => `${s.category}:${s.id}`);
  const unique = new Set(keys).size;
  console.log(`📊 Dağılım:`, dist);
  console.log(
    `   Toplam: ${SEQUENCE.length} · Tekil: ${unique} ${unique === SEQUENCE.length ? "(tekrar YOK ✅)" : "(⚠️ TEKRAR VAR!)"}`,
  );
  console.log(
    `   İlk 12 sıra: ${SEQUENCE.slice(0, 12).map((s) => s.poolKey).join(" → ")}\n`,
  );
}
