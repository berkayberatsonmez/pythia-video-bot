// ═══════════════════════════════════════════════════════════════════════════
// metadata.ts — Kategori-bilinçli YouTube metadata üretici
//
// buildMetadata(category, id) → { title, description, tags }
// 6 kategori: dream, tarot, number(lifepath/angel), zodiac, manifest
//
// Tasarım ilkeleri (Shorts için optimize):
//   • Başlık = merak boşluğu ("X yaşadıysan → bilinçaltın BUNU söylüyor")
//   • Etiketler = TR long-tail + EN (8 dil / 175 ülke kitlesi için) ~12 adet
//   • Açıklama = 3 anlam + soru (yorum yemi) + CTA + hashtag satırı + disclaimer
// ═══════════════════════════════════════════════════════════════════════════

import { getSymbolById } from "../src/data/dream-symbols";
import { getTarotById } from "../src/data/tarot-cards";
import { getNumberById } from "../src/data/numbers";
import { getZodiacById } from "../src/data/zodiac-signs";
import { getManifestById } from "../src/data/manifestation";
import { getRankingById } from "../src/data/zodiac-rankings";
import { getBehaviorById } from "../src/data/zodiac-behaviors";

export type VideoMeta = {
  title: string;
  description: string;
  tags: string[];
};

const PYTHIA_CTA = [
  "",
  "📱 Pythia — AI ile rüya tabiri, tarot, burç, numeroloji",
  "🌍 8 dilde, 175 ülkede",
  "🎁 3 gün ücretsiz dene",
  "👇 Profil bio'da link",
  "",
];

const DISCLAIMER = "* Yalnızca eğlence amaçlıdır.";

function clampTitle(t: string): string {
  return t.length > 100 ? t.substring(0, 97) + "..." : t;
}

// YouTube tag toplamı 500 karakteri geçemez — güvenli kırpma
function clampTags(tags: string[]): string[] {
  const out: string[] = [];
  let total = 0;
  for (const raw of tags) {
    const t = raw.trim();
    if (!t || t.length > 30) continue;
    if (total + t.length + 1 > 480) break;
    if (out.some((x) => x.toLowerCase() === t.toLowerCase())) continue;
    out.push(t);
    total += t.length + 1;
  }
  return out;
}

// ─── DREAM ───────────────────────────────────────────────────────────────
function dreamMeta(id: string): VideoMeta | null {
  const s = getSymbolById(id);
  if (!s) return null;
  const upper = s.symbolNameUpper.replace(/\n/g, " ");
  const title = clampTitle(
    `Rüyanda ${upper} Gördüysen 🌙 Bilinçaltın Bu 3 Şeyi Söylüyor #shorts`,
  );
  const desc = [
    `Rüyanda ${s.symbolName} gördüysen bilinçaltın bunu söylüyor 🌙`,
    "",
    ...s.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${s.questionBody.replace(/\n/g, " ")} ${s.questionFooter}`,
    "",
    "Seninki nasıldı? 👇 Yorumlara yaz, beraber yorumlayalım 🌙",
    ...PYTHIA_CTA,
    `#rüyatabiri #rüya ${s.hashtag} #rüyayorumu #bilinçaltı #mistik #dream #shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      "rüya tabiri",
      "rüya yorumu",
      `rüyada ${s.symbolName} görmek`,
      s.symbolName,
      "rüya anlamı",
      "bilinçaltı",
      "mistik",
      "psikoloji",
      "dream meaning",
      "dream interpretation",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── TAROT ───────────────────────────────────────────────────────────────
function tarotMeta(id: string): VideoMeta | null {
  const c = getTarotById(id);
  if (!c) return null;
  const title = clampTitle(
    `Bugün Senin Kartın: ${c.cardName} 🔮 Evren Sana Bunu Söylüyor #shorts`,
  );
  const desc = [
    `Bugün senin tarot kartın: ${c.cardName} (${c.cardNameSub}) 🔮`,
    `Enerji: ${c.energy}`,
    "",
    ...c.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${c.questionBody.replace(/\n/g, " ")} ${c.questionFooter}`,
    "",
    "Sen bugün hangi kartı çekiyorsun? 👇 Yorumlara yaz 🔮",
    ...PYTHIA_CTA,
    `#tarot #tarotfalı #günlüktarot #fal #mistik #tarotreading #shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      "tarot",
      "tarot falı",
      "günlük tarot",
      c.cardName,
      "tarot kartları",
      "fal",
      "mistik",
      "tarot reading",
      "tarot cards",
      "daily tarot",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── NUMBER (lifepath + angel) ───────────────────────────────────────────
function numberMeta(id: string): VideoMeta | null {
  const n = getNumberById(id);
  if (!n) return null;

  if (n.kind === "lifepath") {
    const title = clampTitle(
      `Yaşam Yolu ${n.number} İsen 🔢 ${n.title} Olduğunu Biliyor muydun? #shorts`,
    );
    const desc = [
      `Yaşam yolu sayın ${n.number} ise, sen bir ${n.title.toLowerCase()}sın 🔢`,
      "",
      ...n.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
      "",
      `${n.questionBody.replace(/\n/g, " ")} ${n.questionFooter}`,
      "",
      "Senin yaşam yolu sayın kaç? 👇 Yorumlara yaz 🔢",
      ...PYTHIA_CTA,
      `#numeroloji #yaşamyolu #numeroloji${n.number} #mistik #numerology #shorts`,
      "",
      DISCLAIMER,
    ].join("\n");
    return {
      title,
      description: desc,
      tags: clampTags([
        "numeroloji",
        "yaşam yolu sayısı",
        `yaşam yolu ${n.number}`,
        "numeroloji hesaplama",
        "mistik",
        "astroloji",
        "numerology",
        "life path number",
        `life path ${n.number}`,
        "Pythia",
        "shorts",
      ]),
    };
  }

  // angel
  const title = clampTitle(
    `Sürekli ${n.number} Görüyorsan 👁️ Melekler Sana Bunu Söylüyor #shorts`,
  );
  const desc = [
    `Sürekli ${n.number} görüyorsan bu tesadüf değil — ${n.title} ✨`,
    "",
    ...n.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${n.questionBody.replace(/\n/g, " ")} ${n.questionFooter}`,
    "",
    "Sen hangi sayıyı sürekli görüyorsun? 👇 Yorumlara yaz ✨",
    ...PYTHIA_CTA,
    `#melekSayıları #melekSayısı${n.number} #manifest #mistik #angelnumbers #shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      "melek sayıları",
      `${n.number} melek sayısı`,
      `melek sayısı ${n.number}`,
      "manifest",
      "mistik",
      "spiritüel",
      "angel numbers",
      `${n.number} angel number`,
      "manifestation",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── ZODIAC ──────────────────────────────────────────────────────────────
function zodiacMeta(id: string): VideoMeta | null {
  const z = getZodiacById(id);
  if (!z) return null;
  const subLower = z.signNameSub.toLowerCase();
  const title = clampTitle(
    `${z.signName} Burcuysan 🔮 Kimsenin Bilmediği 3 Gizli Özelliğin #shorts`,
  );
  const desc = [
    `${z.signName} (${z.signNameSub}) burcunun kimsenin bilmediği gizli yüzü 🔮`,
    `Element: ${z.element} · ${z.dateRange}`,
    "",
    ...z.meanings.map((m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`),
    "",
    `${z.questionBody.replace(/\n/g, " ")} ${z.questionFooter}`,
    "",
    `${z.signName} olan var mı? 👇 Yorumlara yaz, etiketle 🔮`,
    ...PYTHIA_CTA,
    `#burç ${z.hashtag} #astroloji #burçyorumu #${subLower} #zodiac #astrology #shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      "burç",
      "burç yorumu",
      `${z.signName} burcu`,
      z.signNameSub,
      "astroloji",
      "günlük burç",
      "mistik",
      "zodiac",
      "astrology",
      "horoscope",
      `${subLower} zodiac`,
      "Pythia",
    ]),
  };
}

// ─── MANIFESTO ───────────────────────────────────────────────────────────
function manifestMeta(id: string): VideoMeta | null {
  const m = getManifestById(id);
  if (!m) return null;
  const title = clampTitle(
    `${m.theme} İçin Günlük Manifesto 🌙 Yüksek Sesle Oku #shorts`,
  );
  const desc = [
    `${m.prompt.toLowerCase()} — ${m.theme} manifestosu 🌙`,
    "",
    ...m.lines.map((l) => `✨ ${l}`),
    "",
    "Yüksek sesle söyle, niyetini gerçeğe çağır.",
    "Pythia sana niyetine özel manifesto yazar.",
    "",
    "Sen neyi manifest ediyorsun? 👇 Yorumlara yaz 🌙",
    ...PYTHIA_CTA,
    `#manifesto #olumlama #manifest #çekimyasası #affirmations #shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      "manifesto",
      "olumlama",
      "manifest",
      "afirmasyon",
      "çekim yasası",
      "mistik",
      "spiritüel",
      "law of attraction",
      "affirmations",
      "manifestation",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── RANKING (viral top-3 burç sıralaması) ───────────────────────────────
function rankingMeta(id: string): VideoMeta | null {
  const r = getRankingById(id);
  if (!r) return null;
  const nm = (sid: string) => getZodiacById(sid)?.signName ?? sid;
  const title = clampTitle(`${r.trait} 3 Burç 🔮 Seninki Var mı? #shorts`);
  const desc = [
    `${r.trait} 3 burç 🔮`,
    "",
    `🥉 3. ${nm(r.ranks[0].signId)} — ${r.ranks[0].blurb}`,
    `🥈 2. ${nm(r.ranks[1].signId)} — ${r.ranks[1].blurb}`,
    `🥇 1. ${nm(r.ranks[2].signId)} — ${r.ranks[2].blurb}`,
    "",
    `${r.question} 👇 Yorumlara yaz`,
    ...PYTHIA_CTA,
    `#burç #astroloji #burçlar #burçyorumu #zodiac #shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      "burç",
      "astroloji",
      "burç sıralaması",
      "burçlar",
      "günlük burç",
      "zodiac",
      "astrology",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── BEHAVIOR (viral burç davranış senaryosu) ────────────────────────────
function behaviorMeta(id: string): VideoMeta | null {
  const b = getBehaviorById(id);
  if (!b) return null;
  const nm = getZodiacById(b.signId)?.signName ?? "";
  const title = clampTitle(`Bir ${nm} ${b.scenario}… 😱 #shorts`);
  const desc = [
    `Bir ${nm} ${b.scenario} ne yapar? 👀`,
    "",
    `1️⃣ ${b.beats[0]}`,
    `2️⃣ ${b.beats[1]}`,
    `3️⃣ ${b.beats[2]}`,
    "",
    `${b.question} 👇 Yorumlara yaz`,
    ...PYTHIA_CTA,
    `#burç #astroloji #burçlar #ilişki #zodiac #shorts`,
    "",
    DISCLAIMER,
  ].join("\n");
  return {
    title,
    description: desc,
    tags: clampTags([
      "burç",
      "astroloji",
      "burç davranışları",
      "burçlar",
      "ilişki",
      "zodiac",
      "astrology",
      "Pythia",
      "shorts",
    ]),
  };
}

// ─── Dispatcher ──────────────────────────────────────────────────────────
export function buildMetadata(category: string, id: string): VideoMeta {
  let meta: VideoMeta | null = null;
  switch (category) {
    case "dream":
      meta = dreamMeta(id);
      break;
    case "tarot":
      meta = tarotMeta(id);
      break;
    case "number":
      meta = numberMeta(id);
      break;
    case "zodiac":
      meta = zodiacMeta(id);
      break;
    case "manifest":
      meta = manifestMeta(id);
      break;
    case "ranking":
      meta = rankingMeta(id);
      break;
    case "behavior":
      meta = behaviorMeta(id);
      break;
  }
  if (!meta) {
    throw new Error(`Metadata üretilemedi: ${category}/${id}`);
  }
  return meta;
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTAGRAM caption — IG'ye ÖZEL (YouTube'dan farklı, 2026 best practice)
//   • İlk satır = güçlü kanca (IG 125 karakterde "...more" ile keser)
//   • 3 anlam → sessiz izlenebilir (completion rate ↑)
//   • CTA: 🔖 Kaydet + 📤 Gönder (2026 #1 sinyal: DM share) + 💬 Yorum
//   • 5 hashtag (2026: 5'ten fazlası reach DÜŞÜRÜR) → 4 niche + #keşfet
// ═══════════════════════════════════════════════════════════════════════════

const IG_BRAND = [
  "🔮 Pythia — AI ile rüya tabiri, tarot, burç, numeroloji",
  "🎁 Profilde 3 gün ücretsiz · 👇 Link bio'da",
];

function meaningsBlock(meanings: { title: string; desc: string }[]): string[] {
  return meanings.map(
    (m, i) => `${i + 1}️⃣ ${m.title}\n${m.desc.replace(/\n/g, " ")}`,
  );
}

function igAssemble(p: {
  hook: string;
  body: string[];
  reflection?: string;
  save: string;
  share: string;
  comment: string;
  hashtags: string[];
}): string {
  const lines = [
    p.hook,
    "",
    ...p.body,
    "",
    ...(p.reflection ? [p.reflection, ""] : []),
    `🔖 ${p.save}`,
    `📤 ${p.share}`,
    `💬 ${p.comment}`,
    "",
    ...IG_BRAND,
    "",
    p.hashtags.slice(0, 5).join(" "),
    "",
    "* Yalnızca eğlence amaçlıdır.",
  ];
  const caption = lines.join("\n");
  return caption.length > 2150 ? caption.slice(0, 2150) : caption;
}

export function buildInstagramCaption(category: string, id: string): string {
  switch (category) {
    case "dream": {
      const s = getSymbolById(id);
      if (!s) break;
      return igAssemble({
        hook: `Rüyada ${s.symbolName} görmek ne demek? 🌙 Bilinçaltın söylüyor:`,
        body: meaningsBlock(s.meanings),
        reflection: `${s.questionBody.replace(/\n/g, " ")} — ${s.questionFooter}`,
        save: "Kaydet — sabah hatırla",
        share: "Aynı rüyayı gören birine gönder",
        comment: "Seninki nasıldı? Yorumlara yaz",
        hashtags: ["#rüyatabiri", "#rüyayorumu", s.hashtag, "#bilinçaltı", "#pythia"],
      });
    }
    case "tarot": {
      const c = getTarotById(id);
      if (!c) break;
      return igAssemble({
        hook: `${c.cardName} kartı ne anlama gelir? 🔮 Bugün sana diyor ki:`,
        body: meaningsBlock(c.meanings),
        reflection: `${c.questionBody.replace(/\n/g, " ")} — ${c.questionFooter}`,
        save: "Kaydet — günün kartı",
        share: "Bugün kart çekmesi gereken birine gönder",
        comment: "Sen hangi kartı çekiyorsun?",
        hashtags: ["#tarot", "#tarotfalı", "#günlükkart", "#kehanet", "#pythia"],
      });
    }
    case "zodiac": {
      const z = getZodiacById(id);
      if (!z) break;
      return igAssemble({
        hook: `${z.signName} burcu özellikleri 🔮 Kimsenin bilmediği 3 gizli yön:`,
        body: meaningsBlock(z.meanings),
        reflection: `${z.questionBody.replace(/\n/g, " ")} — ${z.questionFooter}`,
        save: "Kaydet — sonra oku",
        share: `Bir ${z.signName} burcuna gönder`,
        comment: `${z.signName} olan var mı? Yorumlara yaz`,
        hashtags: ["#burç", "#astroloji", "#günlükburç", z.hashtag, "#pythia"],
      });
    }
    case "number": {
      const n = getNumberById(id);
      if (!n) break;
      if (n.kind === "lifepath") {
        return igAssemble({
          hook: `Yaşam yolu ${n.number} kimdir? 🔢 Gerçek karakterin:`,
          body: meaningsBlock(n.meanings),
          reflection: `${n.questionBody.replace(/\n/g, " ")} — ${n.questionFooter}`,
          save: "Kaydet — kendini tanı",
          share: `Yaşam yolu ${n.number} olan birine gönder`,
          comment: "Senin yaşam yolu sayın kaç?",
          hashtags: ["#numeroloji", "#yaşamyolu", "#ruhsalfarkındalık", "#mistik", "#pythia"],
        });
      }
      return igAssemble({
        hook: `Sürekli ${n.number} görmek ne demek? 👁️ Melek sayısı ${n.number}:`,
        body: meaningsBlock(n.meanings),
        reflection: `${n.questionBody.replace(/\n/g, " ")} — ${n.questionFooter}`,
        save: "Kaydet — işaret bu",
        share: `Sürekli ${n.number} gören birine gönder`,
        comment: "Sen hangi sayıyı görüyorsun?",
        hashtags: ["#meleksayıları", "#numeroloji", `#${n.number}`, "#ruhsalfarkındalık", "#pythia"],
      });
    }
    case "manifest": {
      const m = getManifestById(id);
      if (!m) break;
      return igAssemble({
        hook: `${m.theme} manifestosu 🌙 Yüksek sesle oku:`,
        body: m.lines.map((l) => `✨ ${l}`),
        reflection: "Yüksek sesle söyle — niyetini gerçeğe çağır.",
        save: "Kaydet — her gün oku",
        share: "Bunu duyması gereken birine gönder",
        comment: "Sen neyi manifest ediyorsun?",
        hashtags: ["#manifest", "#olumlama", "#çekimyasası", "#spiritüel", "#pythia"],
      });
    }
    case "ranking": {
      const r = getRankingById(id);
      if (!r) break;
      const nm = (sid: string) => getZodiacById(sid)?.signName ?? sid;
      return igAssemble({
        hook: `${r.trait} 3 burç 🔮 Seninki var mı?`,
        body: [
          `🥉 3. ${nm(r.ranks[0].signId)} — ${r.ranks[0].blurb}`,
          `🥈 2. ${nm(r.ranks[1].signId)} — ${r.ranks[1].blurb}`,
          `🥇 1. ${nm(r.ranks[2].signId)} — ${r.ranks[2].blurb}`,
        ],
        reflection: r.question,
        save: "Kaydet — arkadaşına göster",
        share: "Bu listede olan birine gönder",
        comment: `${r.question} Yorumlara yaz`,
        hashtags: ["#burç", "#astroloji", "#burçlar", "#burçyorumu", "#pythia"],
      });
    }
    case "behavior": {
      const b = getBehaviorById(id);
      if (!b) break;
      const nm = getZodiacById(b.signId)?.signName ?? "";
      return igAssemble({
        hook: `Bir ${nm} ${b.scenario} ne yapar? 👀`,
        body: [
          `1️⃣ ${b.beats[0]}`,
          `2️⃣ ${b.beats[1]}`,
          `3️⃣ ${b.beats[2]}`,
        ],
        reflection: b.question,
        save: "Kaydet — aklına biri geldi 👀",
        share: `Bir ${nm}'a gönder 😏`,
        comment: `${b.question} Yorumlara yaz`,
        hashtags: ["#burç", "#astroloji", "#burçlar", "#ilişki", "#pythia"],
      });
    }
  }
  throw new Error(`IG caption üretilemedi: ${category}/${id}`);
}

// ─── İlk yorum — paylaşımdan hemen sonra otomatik bırakılır (etkileşim) ────
// Cevabı kolay soru → çok yorum gelir. Sabitlemeyi (pin) kullanıcı elle yapar.
export function buildFirstComment(category: string, id: string): string {
  switch (category) {
    case "dream":
      return "Sen bu rüyayı gördün mü? 👀 Detayını yaz — beraber çözelim 🌙";
    case "tarot":
      return 'İçinden bir niyet tut, "çektim" yaz ✨ Kartın bugün sana ne diyor? 👇';
    case "zodiac": {
      const z = getZodiacById(id);
      return `${z ? z.signName + " olan var mı?" : "Sen hangi burçsun?"} 👇 Ne kadar uydu: 🔥 tam ben / 😅 hiç`;
    }
    case "number": {
      const n = getNumberById(id);
      if (n?.kind === "angel") return "Sen sürekli hangi sayıyı görüyorsun? 👀👇";
      return "Senin yaşam yolu sayın kaç? 🔢 Doğum tarihini yaz, hesaplayayım 👇";
    }
    case "manifest":
      return "Şu an neyi manifest ediyorsun? Yorumlara yaz — evren duysun 🌙✨";
    case "ranking": {
      const r = getRankingById(id);
      return `${r ? r.question : "Seninki var mı?"} 👇 Bence sıralama doğru — sence? 🔥`;
    }
    case "behavior": {
      const b = getBehaviorById(id);
      const nm = b ? getZodiacById(b.signId)?.signName ?? "" : "";
      return `${nm ? "Bir " + nm + "'la yaşadın mı?" : "Yaşadın mı?"} 👇 Anlat — herkes okusun 😅`;
    }
  }
  return "Yorumun ne? 👇 Her yoruma bakıyorum 🤍";
}
