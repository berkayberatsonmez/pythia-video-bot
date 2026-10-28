// reply-helpers.ts — yorum yanıt botunun SAF yardımcıları (ağ yok, saat yok).
// Modelin hesaplamasına bırakılmayan her şey burada koddan gelir:
//   • burç tespiti (Türkçe adlar, aksan/büyük-küçük harf varyantları, "yükselen X")
//   • doğum tarihi ayrıştırma + yaşam yolu sayısı (usta sayılar 11/22/33 korunur)
//   • üretilen yanıtın son kontrolü (URL/mention temizliği, uzunluk)
// Test: npm run verify:reply

export const SIGNS = [
  "Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak",
  "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık",
] as const;

/** Türkçe'ye uygun küçültme (İ→i, I→ı). */
export function lower(s: string): string {
  return s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();
}

/** Küçült + Türkçe aksanları düşür (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u). */
export function fold(s: string): string {
  return lower(s)
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/̇/g, "");
}

// Burç adı + izinli ek ("Koçum", "Aslanlar", "Balıklar"). "yay" ve "kova" gibi
// kısa/çok anlamlı adlar yalnız tam eşleşir ("yayın", "kovan" burç sayılmaz).
const SUFFIXES = ["", "m", "im", "um", "yim", "yum", "lar", "ler", "dir", "siniz", "sin", "sun", "iz", "uz"];
const EXACT_ONLY = new Set(["yay", "kova", "koc"]);

function signOfToken(tok: string): string | null {
  for (const s of SIGNS) {
    const f = fold(s);
    if (tok === f) return s;
    if (EXACT_ONLY.has(f)) continue;
    for (const suf of SUFFIXES) {
      if (suf && tok === f + suf) return s;
    }
  }
  return null;
}

export interface SignInfo {
  signs: string[]; // metinde geçiş sırasıyla, tekrarsız
  rising?: string; // "yükselen X" / "X yükselen"
}

/** Yorumdaki burçları bulur. "Yükselen" ile geçen burç `rising`e gider, `signs`a girmez. */
export function detectSigns(text: string): SignInfo {
  const toks = fold(text).split(/[^a-z0-9]+/).filter(Boolean);
  const signs: string[] = [];
  let rising: string | undefined;
  for (let i = 0; i < toks.length; i++) {
    const s = signOfToken(toks[i]);
    if (!s) continue;
    const prevRising = i > 0 && toks[i - 1] === "yukselen";
    // "X yükselen" — ama "Koç yükselen Aslan"da Koç güneştir, yükselen Aslan'dır.
    const nextRising =
      i + 1 < toks.length && toks[i + 1] === "yukselen" && !(i + 2 < toks.length && signOfToken(toks[i + 2]));
    if (prevRising || nextRising) {
      if (!rising) rising = s;
    } else if (signs.indexOf(s) < 0) {
      signs.push(s);
    }
  }
  return rising ? { signs, rising } : { signs };
}

// ─── Doğum tarihi + yaşam yolu ─────────────────────────────────────────────
const MONTHS: Record<string, number> = {
  ocak: 1, subat: 2, mart: 3, nisan: 4, mayis: 5, haziran: 6,
  temmuz: 7, agustos: 8, eylul: 9, ekim: 10, kasim: 11, aralik: 12,
};

export interface BirthDate { day: number; month: number; year: number }

function validDate(d: number, m: number, y: number, maxYear: number): BirthDate | null {
  if (y < 1900 || y > maxYear || m < 1 || m > 12 || d < 1) return null;
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= dim ? { day: d, month: m, year: y } : null;
}

/** 2 haneli yıl: ≤ 26 → 2000'ler, değilse 1900'ler (yorumcu kitlesi için makul). */
function fullYear(y: string): number {
  const n = parseInt(y, 10);
  return y.length === 2 ? (n <= 26 ? 2000 + n : 1900 + n) : n;
}

/** Metindeki ilk geçerli doğum tarihini bulur. `maxYear` dışarıdan verilir (saat okunmaz). */
export function parseBirthDate(text: string, maxYear = 2026): BirthDate | null {
  const t = fold(text);
  let m: RegExpExecArray | null;

  // 1998-05-12
  const iso = /(?:^|[^0-9])((?:19|20)\d{2})-(\d{1,2})-(\d{1,2})(?![0-9])/g;
  while ((m = iso.exec(t))) {
    const r = validDate(+m[3], +m[2], +m[1], maxYear);
    if (r) return r;
  }
  // 12.05.1998 · 12/5/98 · 12-05-1998
  const num = /(?:^|[^0-9])(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})(?![0-9])/g;
  while ((m = num.exec(t))) {
    const r = validDate(+m[1], +m[2], fullYear(m[3]), maxYear);
    if (r) return r;
  }
  // 12 Mayıs 1998 (aksansız/küçük harf de olur)
  const word = /(?:^|[^0-9])(\d{1,2})\s+([a-z]+)\s+(\d{4}|\d{2})(?![0-9])/g;
  while ((m = word.exec(t))) {
    const mo = MONTHS[m[2]];
    if (!mo) continue;
    const r = validDate(+m[1], mo, fullYear(m[3]), maxYear);
    if (r) return r;
  }
  return null;
}

function reduceKeepMaster(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    let s = 0;
    for (const ch of String(n)) s += +ch;
    n = s;
  }
  return n;
}

/**
 * Yaşam yolu: tarihin TÜM rakamları toplanır, tek haneye (ya da 11/22/33'e) inilir.
 * Not: gün/ay/yıl ayrı ayrı indirip toplayan yöntem nadir tarihlerde farklı çıkabilir;
 * burada tek yöntem sabit — model kendi hesaplamaz.
 */
export function lifePath(b: BirthDate): number {
  let sum = 0;
  for (const ch of `${b.day}${b.month}${b.year}`) sum += +ch;
  return reduceKeepMaster(sum);
}

// ─── Yanıt son kontrolü ────────────────────────────────────────────────────
export const MAX_REPLY_CHARS = 220;

/**
 * Model çıktısını temizler. Reddedilirse null.
 *  - "http", "www", alan adı benzeri ya da "@" içeriyorsa REDDEDİLİR (temizlenip
 *    gönderilmez: model kural dışına çıktıysa yanıtına güvenmiyoruz).
 *  - Uzunluk: MAX_REPLY_CHARS'ı aşarsa son cümle/kelime sınırında kesilir.
 */
export function sanitizeReply(raw: string, max = MAX_REPLY_CHARS): string | null {
  let s = String(raw ?? "").replace(/\s+/g, " ").trim();
  s = s.replace(/^["“”'`]+|["“”'`]+$/g, "").trim();
  if (!s) return null;
  const l = s.toLowerCase();
  if (l.includes("http") || l.includes("www") || s.includes("@")) return null;
  if (/\b[a-z0-9-]+\.(com|net|org|io|app|me|co|tr|ly|link)\b/i.test(s)) return null;
  if (s.length > max) {
    let cut = s.slice(0, max);
    const sentEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("✨"), cut.lastIndexOf("🌙"));
    if (sentEnd >= max * 0.5) {
      cut = cut.slice(0, sentEnd + 1);
    } else {
      const sp = cut.lastIndexOf(" ");
      cut = (sp > 0 ? cut.slice(0, sp) : cut).replace(/[,;:\-–—]+$/, "");
      if (!/[.!?…✨🌙🔮💫🤍]$/u.test(cut)) cut += "…";
    }
    s = cut.trim();
  }
  return s || null;
}

/** Yalnız @etiketlerden (ve noktalama/boşluktan) oluşan yorum mu? */
export function onlyMentions(text: string): boolean {
  if (text.indexOf("@") < 0) return false;
  const rest = text.replace(/@[A-Za-z0-9_.]*/g, "").replace(/[^\p{L}\p{N}]/gu, "");
  return rest.length === 0;
}
