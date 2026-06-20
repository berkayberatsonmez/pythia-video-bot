// ═══════════════════════════════════════════════════════════════════════════
// narration.ts — Seslendirme metni üreteci (kategori-bilinçli)
//
// buildNarration(category, id) → { intro, m1, m2, m3, close } (konuşma metni)
// metadata.ts'in caption'a yaptığını, KONUŞMA için yapar:
//   • emoji + satır sonu temizlenir (TTS düzgün okusun)
//   • intro = kanca, m1-3 = 3 anlam, close = soru + CTA
// ═══════════════════════════════════════════════════════════════════════════

import { getSymbolById } from "../src/data/dream-symbols";
import { getTarotById } from "../src/data/tarot-cards";
import { getNumberById } from "../src/data/numbers";
import { getZodiacById } from "../src/data/zodiac-signs";
import { getManifestById } from "../src/data/manifestation";

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
const CLOSE_CTA = "Daha fazlası Paytia'da, profilde ücretsiz dene.";

// Konuşmayı kısa tut → ilk cümle (ekranda tam metin zaten görünüyor)
function firstSentence(s: string): string {
  const c = clean(s);
  const m = c.match(/^[^.!?]*[.!?]/);
  return (m ? m[0] : c).trim();
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
      return fromMeanings(
        `Rüyanda ${s.symbolName} gördüysen, bilinçaltın sana bir şey söylüyor.`,
        s.meanings,
        `Seninki nasıldı? ${CLOSE_CTA}`,
      );
    }
    case "tarot": {
      const c = getTarotById(id);
      if (!c) return null;
      return fromMeanings(
        `Bugün senin kartın: ${c.cardName}. ${c.energy}.`,
        c.meanings,
        `Sen bugün hangi kartı çekiyorsun? ${CLOSE_CTA}`,
      );
    }
    case "zodiac": {
      const z = getZodiacById(id);
      if (!z) return null;
      return fromMeanings(
        `${z.signName} burcuysan, kimsenin bilmediği üç gizli yönün var.`,
        z.meanings,
        `${z.questionBody}? ${CLOSE_CTA}`,
      );
    }
    case "number": {
      const n = getNumberById(id);
      if (!n) return null;
      const intro =
        n.kind === "lifepath"
          ? `Yaşam yolu sayın ${n.number} ise, gerçek karakterin bu.`
          : `Sürekli ${n.number} görüyorsan, bu bir tesadüf değil.`;
      return fromMeanings(intro, n.meanings, CLOSE_CTA);
    }
    case "manifest": {
      const m = getManifestById(id);
      if (!m) return null;
      const lines = m.lines;
      return {
        intro: clean(`${m.theme} için günlük manifesto. Yüksek sesle tekrar et.`),
        m1: clean(lines[0] ?? ""),
        m2: clean(lines[1] ?? lines[0] ?? ""),
        m3: clean(lines[2] ?? lines[lines.length - 1] ?? ""),
        close: clean(`Niyetini gerçeğe çağır. ${CLOSE_CTA}`),
      };
    }
  }
  return null;
}
