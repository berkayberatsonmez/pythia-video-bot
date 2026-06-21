// ═══════════════════════════════════════════════════════════════════════════
// narration.ts — Seslendirme metni üreteci (kategori-bilinçli)
//
// buildNarration(category, id) → { intro, m1, m2, m3, close } (konuşma metni)
//   • intro = KANCA (havuzdan id-hash ile seçilir → varyasyon, "şablon" hissi kırılır)
//   • m1-3 = 3 anlam (ilk cümle), close = soru + CTA
//   • emoji + satır sonu temizlenir (TTS düzgün okusun)
// Strateji: ilk 3 sn = #1 kaldıraç → kanca keskin yargı/merak, kurulum yok.
// ═══════════════════════════════════════════════════════════════════════════

import { getSymbolById } from "../src/data/dream-symbols";
import { getTarotById } from "../src/data/tarot-cards";
import { getNumberById } from "../src/data/numbers";
import { getZodiacById } from "../src/data/zodiac-signs";
import { getManifestById } from "../src/data/manifestation";
import { getRankingById } from "../src/data/zodiac-rankings";

export type Narration = {
  intro: string;
  m1: string;
  m2: string;
  m3: string;
  close: string;
};

// Emoji + satır sonlarını temizle → TTS düzgün okusun
function clean(s: string): string {
  return s
    .replace(
      /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{2190}-\u{21FF}\u{1F1E6}-\u{1F1FF}]/gu,
      "",
    )
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const ORD = ["Birincisi", "İkincisi", "Üçüncüsü"];
// NOT: "Paytia" = TTS'in "Pythia"yı doğru okuması için fonetik yazım (ekranda "Pythia").
const CLOSE_CTA = "Daha fazlası Paytia'da, profildeki linke dokun, ücretsiz indir.";

// Konuşmayı kısa tut → ilk cümle (ekranda tam metin zaten görünüyor)
function firstSentence(s: string): string {
  const c = clean(s);
  const m = c.match(/^[^.!?]*[.!?]/);
  return (m ? m[0] : c).trim();
}

// id'den deterministik indeks (kanca havuzu rotasyonu — state'siz, tekrarlanabilir)
function pickIdx(seed: string, len: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % len;
}
function pick(pool: string[], seed: string): string {
  return pool[pickIdx(seed, pool.length)];
}

function fromMeanings(
  intro: string,
  meanings: { title: string; desc: string }[],
  close: string,
): Narration {
  return {
    intro: clean(intro),
    m1: clean(`${ORD[0]}. ${meanings[0].title}. ${firstSentence(meanings[0].desc)}`),
    m2: clean(`${ORD[1]}. ${meanings[1].title}. ${firstSentence(meanings[1].desc)}`),
    m3: clean(`${ORD[2]}. ${meanings[2].title}. ${firstSentence(meanings[2].desc)}`),
    close: clean(close),
  };
}

export function buildNarration(category: string, id: string): Narration | null {
  switch (category) {
    case "dream": {
      const s = getSymbolById(id);
      if (!s) return null;
      const intro = pick(
        [
          `Rüyanda ${s.symbolName} gördüysen, bu bir tesadüf değil.`,
          `Rüyanda ${s.symbolName} görmek aslında ne anlatıyor? Çoğu kişi yanlış biliyor.`,
          `Dün gece rüyanda ${s.symbolName} gördüysen, bilinçaltın sana üç şey söylüyor.`,
        ],
        id,
      );
      return fromMeanings(intro, s.meanings, `Seninki nasıldı? ${CLOSE_CTA}`);
    }
    case "tarot": {
      const c = getTarotById(id);
      if (!c) return null;
      const intro = pick(
        [
          `Bugün kartın ${c.cardName} çıktı. Söyleyeceği şey hoşuna gitmeyebilir.`,
          `${c.cardName} kartını çektiysen, evren bugün seninle konuşuyor.`,
          `Bu kart bugün yalan söylemiyor: ${c.cardName}.`,
        ],
        id,
      );
      return fromMeanings(intro, c.meanings, `Sen bugün hangi kartı çekiyorsun? ${CLOSE_CTA}`);
    }
    case "zodiac": {
      const z = getZodiacById(id);
      if (!z) return null;
      const intro = pick(
        [
          `${z.signName} burcuysan, kimsenin bilmediği üç gizli yönün var.`,
          `${z.signName} burcu hakkında herkesin yanıldığı üç şey.`,
          `Bu video karşına çıktıysa tesadüf değil. ${z.signName} burcusun ve bunu bilmen gerek.`,
        ],
        id,
      );
      return fromMeanings(intro, z.meanings, `${z.questionBody}? ${CLOSE_CTA}`);
    }
    case "ranking": {
      const r = getRankingById(id);
      if (!r) return null;
      const nm = (sid: string) => getZodiacById(sid)?.signName ?? sid;
      return {
        intro: clean(`${r.trait} üç burç. Seninki var mı?`),
        m1: clean(`Üçüncü sırada: ${nm(r.ranks[0].signId)}. ${r.ranks[0].blurb}`),
        m2: clean(`İkinci: ${nm(r.ranks[1].signId)}. ${r.ranks[1].blurb}`),
        m3: clean(`Ve birinci: ${nm(r.ranks[2].signId)}. ${r.ranks[2].blurb}`),
        close: clean(`${r.question} ${CLOSE_CTA}`),
      };
    }
    case "number": {
      const n = getNumberById(id);
      if (!n) return null;
      const intro =
        n.kind === "lifepath"
          ? pick(
              [
                `Yaşam yolu sayın ${n.number} ise, gerçek karakterin bu.`,
                `Doğum tarihindeki bu sayı kimseye söylemediğin şeyi biliyor: ${n.number}.`,
              ],
              id,
            )
          : pick(
              [
                `Sürekli ${n.number} görüyorsan, bu bir tesadüf değil.`,
                `${n.number} sayısı karşına çıkıyorsa, evren sana bir mesaj gönderiyor.`,
                `Her yerde ${n.number} görüyorsan, videoyu kapatma.`,
              ],
              id,
            );
      return fromMeanings(intro, n.meanings, CLOSE_CTA);
    }
    case "manifest": {
      const m = getManifestById(id);
      if (!m) return null;
      const lines = m.lines;
      const intro = pick(
        [
          `${m.theme} için günlük manifesto. Yüksek sesle tekrar et.`,
          `Bunu yüksek sesle söyle: ${m.theme} senin olacak.`,
        ],
        id,
      );
      return {
        intro: clean(intro),
        m1: clean(lines[0] ?? ""),
        m2: clean(lines[1] ?? lines[0] ?? ""),
        m3: clean(lines[2] ?? lines[lines.length - 1] ?? ""),
        close: clean(`Niyetini gerçeğe çağır. ${CLOSE_CTA}`),
      };
    }
  }
  return null;
}
