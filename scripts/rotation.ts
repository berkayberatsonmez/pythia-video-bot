// ═══════════════════════════════════════════════════════════════════════════
// rotation.ts — Stateless çok-kategorili rotasyon (CI uyumlu)
//
// Tarih-tabanlı deterministik: state dosyası YOK → GitHub Actions'ta
// her çalışma aynı/doğru sonucu verir. Round-robin ile kategoriler
// karışık dizilir (peş peşe aynı kategori gelmez).
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

// Ağırlıklı round-robin: her turda her pooldan WEIGHT kadar eleman al →
// popülerler daha sık çıkar ama hepsi sırayla, tekrarsız. Deterministik.
function buildSequence(): SelectedVideo[] {
  const seq: SelectedVideo[] = [];
  const cursor: Record<string, number> = {};
  for (const k of POOL_ORDER) cursor[k] = 0;
  const total = POOL_ORDER.reduce((s, k) => s + POOLS[k].ids.length, 0);
  while (seq.length < total) {
    for (const k of POOL_ORDER) {
      const pool = POOLS[k];
      for (let w = 0; w < POOL_WEIGHTS[k]; w++) {
        if (cursor[k] < pool.ids.length) {
          seq.push({
            slot: "morning", // slot sonradan atanır
            poolKey: k,
            label: pool.label,
            comp: pool.comp,
            category: pool.category,
            propKey: pool.key,
            id: pool.ids[cursor[k]],
          });
          cursor[k]++;
        }
      }
    }
  }
  return seq;
}

const SEQUENCE = buildSequence();

// Gün numarası — epoch'tan bu yana gün sayısı (UTC)
function dayNumber(): number {
  return Math.floor(Date.now() / 86400000);
}

/**
 * Bugünün 2 videosunu döndürür (sabah + akşam).
 * Tamamen stateless & deterministik — aynı gün her çağrıda aynı sonuç.
 */
export function getTodaysVideos(): SelectedVideo[] {
  const day = dayNumber();
  const len = SEQUENCE.length;
  const morning = { ...SEQUENCE[(day * 2) % len], slot: "morning" as const };
  const evening = {
    ...SEQUENCE[(day * 2 + 1) % len],
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
