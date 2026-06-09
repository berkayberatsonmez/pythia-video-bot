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

export type PoolKey =
  | "dream"
  | "tarot"
  | "numerology"
  | "angel"
  | "zodiac"
  | "manifest";

type Pool = {
  comp: string;
  key: string; // props key
  category: string; // render-one kategori adı
  ids: string[];
  label: string;
};

export const POOLS: Record<PoolKey, Pool> = {
  dream: {
    comp: "DreamSymbolVideo",
    key: "symbolId",
    category: "dream",
    ids: DREAM_SYMBOLS.map((s) => s.id),
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
  "numerology",
  "angel",
  "zodiac",
  "manifest",
];

function buildSequence(): SelectedVideo[] {
  const seq: SelectedVideo[] = [];
  const maxLen = Math.max(...POOL_ORDER.map((k) => POOLS[k].ids.length));
  for (let i = 0; i < maxLen; i++) {
    for (const k of POOL_ORDER) {
      const pool = POOLS[k];
      if (i < pool.ids.length) {
        seq.push({
          slot: "morning", // slot sonradan atanır
          poolKey: k,
          label: pool.label,
          comp: pool.comp,
          category: pool.category,
          propKey: pool.key,
          id: pool.ids[i],
        });
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
  console.log(`Toplam havuz: ${SEQUENCE.length} video\n`);
}
