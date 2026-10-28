// verify-reply.ts — yorum botu yardımcılarının değişmezleri (ağ yok).
import { detectSigns, parseBirthDate, lifePath, sanitizeReply, onlyMentions } from "./reply-helpers";

let fail = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✅" : "❌"} ${msg}`);
  if (!ok) fail++;
};
const eq = (a: unknown, b: unknown, msg: string) =>
  check(JSON.stringify(a) === JSON.stringify(b), `${msg}${JSON.stringify(a) === JSON.stringify(b) ? "" : `  (beklenen ${JSON.stringify(b)}, gelen ${JSON.stringify(a)})`}`);

// ── burç ──
eq(detectSigns("Koç").signs, ["Koç"], "Koç");
eq(detectSigns("balık").signs, ["Balık"], "küçük harf balık");
eq(detectSigns("Yengeç 🤍").signs, ["Yengeç"], "emojili Yengeç");
eq(detectSigns("YENGEÇ").signs, ["Yengeç"], "büyük harf YENGEÇ");
eq(detectSigns("bogA").signs, ["Boğa"], "aksansız boga");
eq(detectSigns("ikizler ve oglak").signs, ["İkizler", "Oğlak"], "iki burç, aksansız");
eq(detectSigns("İKİZLER").signs, ["İkizler"], "İKİZLER (noktalı İ)");
eq(detectSigns("basak burcuyum").signs, ["Başak"], "başak aksansız");
eq(detectSigns("Aslanım").signs, ["Aslan"], "ekli Aslanım");
eq(detectSigns("Akrep burcu").signs, ["Akrep"], "Akrep burcu");
eq(detectSigns("ben Terazi, o Kova").signs, ["Terazi", "Kova"], "Terazi + Kova");
eq(detectSigns("Yay").signs, ["Yay"], "Yay");
eq(detectSigns("yayın harika, kovan boş").signs, [], "yayın/kovan burç değil");
eq(detectSigns("Evet").signs, [], "Evet burç değil");
eq(detectSigns("balıkçı").signs, [], "balıkçı burç değil");
eq(detectSigns("Güneş Koç yükselen Aslan"), { signs: ["Koç"], rising: "Aslan" }, "yükselen Aslan ayrı");
eq(detectSigns("Terazi yükselen"), { signs: [], rising: "Terazi" }, "X yükselen");
eq(detectSigns("yukselen oglak").rising, "Oğlak", "yukselen oglak aksansız");

// ── doğum tarihi ──
const bd = (s: string) => parseBirthDate(s, 2026);
eq(bd("12.05.1998"), { day: 12, month: 5, year: 1998 }, "12.05.1998");
eq(bd("12/5/98"), { day: 12, month: 5, year: 1998 }, "12/5/98");
eq(bd("12 Mayıs 1998"), { day: 12, month: 5, year: 1998 }, "12 Mayıs 1998");
eq(bd("12 mayis 1998"), { day: 12, month: 5, year: 1998 }, "12 mayis 1998");
eq(bd("1998-05-12"), { day: 12, month: 5, year: 1998 }, "1998-05-12");
eq(bd("doğum tarihim 3-11-2001 :)"), { day: 3, month: 11, year: 2001 }, "cümle içinde 3-11-2001");
eq(bd("1 Eylül 05"), { day: 1, month: 9, year: 2005 }, "iki haneli yıl 05 → 2005");
eq(bd("31.02.1990"), null, "31 Şubat geçersiz");
eq(bd("12.13.1990"), null, "13. ay geçersiz");
eq(bd("12.05.2099"), null, "gelecek yıl reddedilir");
eq(bd("Koç"), null, "tarih yok");
eq(bd("saat 10.30 gibi"), null, "saat tarih sayılmaz");

// ── yaşam yolu (elle doğrulanmış) ──
// 12.05.1998: 1+2+0+5+1+9+9+8 = 35 → 8
eq(lifePath({ day: 12, month: 5, year: 1998 }), 8, "12.05.1998 → 8");
// 29.11.1990: 2+9+1+1+1+9+9+0 = 32 → 5
eq(lifePath({ day: 29, month: 11, year: 1990 }), 5, "29.11.1990 → 5");
// 11.03.1980? 1+1+0+3+1+9+8+0=23 → 5 ; usta: 2.9.1999 → 2+9+1+9+9+9=39 → 12 → 3
eq(lifePath({ day: 2, month: 9, year: 1999 }), 3, "2.9.1999 → 3");
// 29.12.1983: 2+9+1+2+1+9+8+3 = 35 → 8 ; 19.04.1988: 1+9+0+4+1+9+8+8 = 40 → 4
eq(lifePath({ day: 19, month: 4, year: 1988 }), 4, "19.04.1988 → 4");
// usta 11: 2.9.1989 → 2+9+1+9+8+9 = 38 → 11 (usta korunur, 2'ye inmez)
eq(lifePath({ day: 2, month: 9, year: 1989 }), 11, "2.9.1989 → 11 (usta)");
// 22: tarihi tarayarak bul, sonra tek tek doğrula
let found22 = false;
for (let d = 1; d <= 28 && !found22; d++) for (let m = 1; m <= 12 && !found22; m++) {
  if (lifePath({ day: d, month: m, year: 1990 }) === 22) { found22 = true; eq(lifePath({ day: d, month: m, year: 1990 }), 22, `${d}.${m}.1990 → 22 (usta)`); }
}
check(found22, "1990'da 22 üreten bir tarih var");
// 1-9 dışına (11/22/33 hariç) çıkmaz
let bad = 0;
for (let y = 1950; y <= 2012; y++) for (let m = 1; m <= 12; m++) for (let d = 1; d <= 28; d++) {
  const n = lifePath({ day: d, month: m, year: y });
  if (!((n >= 1 && n <= 9) || n === 11 || n === 22 || n === 33)) bad++;
}
eq(bad, 0, "tüm tarihler 1-9 ya da 11/22/33");

// ── yanıt son kontrolü ──
eq(sanitizeReply("  Merhaba 🌙 Pythia'ya bak  "), "Merhaba 🌙 Pythia'ya bak", "boşluk kırpma");
eq(sanitizeReply("\"Güzel burç 🌙\""), "Güzel burç 🌙", "tırnak soyma");
eq(sanitizeReply(""), null, "boş reddedilir");
eq(sanitizeReply("   "), null, "boşluk reddedilir");
eq(sanitizeReply("bak https://pythia.app"), null, "http reddedilir");
eq(sanitizeReply("bak www.pythia.app"), null, "www reddedilir");
eq(sanitizeReply("bak pythia.app"), null, "alan adı reddedilir");
eq(sanitizeReply("selam @pythiamystic"), null, "@ reddedilir");
const long = "Bu çok uzun bir cümle. ".repeat(30);
const cut = sanitizeReply(long)!;
check(!!cut && cut.length <= 220 && /[.!?…]$/.test(cut), `uzun yanıt ${cut ? cut.length : "?"} karakterde temiz kesilir`);
const noSpace = sanitizeReply("a".repeat(500))!;
check(!!noSpace && noSpace.length <= 221, "boşluksuz uzun metin de kesilir");

// ── yalnız @etiket ──
check(onlyMentions("@@"), "@@ yalnız etiket");
check(onlyMentions("@someone"), "@someone yalnız etiket");
check(onlyMentions("@a @b.c 🤍"), "@a @b.c emoji yalnız etiket");
check(!onlyMentions("@a bak buna"), "metinli yorum etiket değil");
check(!onlyMentions("Koç"), "Koç etiket değil");
check(!onlyMentions("🤍"), "tek emoji yanıtlanır (etiket değil)");

if (fail) {
  console.log(`\n${fail} kontrol BAŞARISIZ`);
  process.exit(1);
}
console.log("\nHepsi geçti");
