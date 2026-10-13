// verify-topical.ts — Güncel başlık/hashtag doğrulaması (ağ yok).
//   1) Türkçe küçük harf (İ/ı) ve etiket biçimi
//   2) Trend ayrıştırıcı: yalnız sözlük + video + gök uyumlu terim; RSS ayrıştırma
//   3) Gökle/takvimle uyum: Cadılar Bayramı, 11.11, Dolunay, retro, sezon; dini gün YOK
//   4) Önümüzdeki 21 gün × 2 slot + tüm Gök Gündemi günleri (90 gün) × IG/TikTok/YouTube:
//      sınırlar, tekrar yok, biçim, kaynak (izin verilen kaynaklar dışında etiket yok)
//   5) #pythia payı (IG ~1/3; TikTok/YouTube hiç)
// Çalıştır: npm run verify:topical   (--quiet: matris çıktısı yok)
import { buildInstagramCaption, buildMetadata, buildTikTokMetadata, topicalFor, type MetaOpts } from "./metadata";
import { EVERGREEN_POOL, TAG_CAP, TAG_RE, low, parseTrend, parseTrendsRss, tagify, topicalContext, topicalHashtags, calendarMoments, weekdayMoment } from "./topical";
import { dateToDay, dayToDate, istanbulDate, skyEventForDay } from "./sky-events";
import { getVideosForDay } from "./rotation";

const QUIET = process.argv.includes("--quiet");
let fail = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok || !QUIET) console.log(`${ok ? "✅" : "❌"} ${msg}`);
  if (!ok) fail++;
};

// ─── 1) Türkçe küçük harf + biçim ────────────────────────────────────────
check(tagify("İKİZLER Burcu") === "#ikizlerburcu", `tagify İ→i: ${tagify("İKİZLER Burcu")}`);
check(tagify("ISIK") === "#ısık", `tagify I→ı: ${tagify("ISIK")}`);
check(tagify("Rüyada diş düşmesi") === "#rüyadadişdüşmesi", "tagify boşluk/diakritik korunur");
check(!tagify("İstanbul İİ").includes("̇"), "birleşik nokta (U+0307) üretilmez");
check(tagify("11.11 !!") === "#1111" && TAG_RE.test("#1111portalı"), "rakamlı etiket geçerli");
check(low("İ") === "i" && low("I") === "ı", "toLocaleLowerCase('tr') ortamda çalışıyor (full-ICU)");

// ─── 2) Trend ayrıştırma ─────────────────────────────────────────────────
const ACCEPT = ["Merkür retrosu", "merkür retrosu 2026", "Dolunay", "Ay tutulması", "Akrep burcu", "haftalık burç yorumları", "Akrep sezonu", "11.11 portal", "tarot falı", "rüya tabiri", "Venüs retrosu ne zaman bitiyor"];
const REJECT = ["Dolunay Soysert", "Burcu Biricik", "Burcu Esmersoy", "Mars çikolata", "Galatasaray Aslan", "Fenerbahçe maçı", "Kova fiyatları", "retro oyun", "Yay burcu ama transfer", "Kış lastiği", "Akrep burcu Ahmet Kaya", "dolunay dizisi"];
for (const t of ACCEPT) check(parseTrend(t) !== null, `trend kabul: "${t}"`);
for (const t of REJECT) check(parseTrend(t) === null, `trend ret: "${t}"`);

const RSS = `<?xml version="1.0"?><rss xmlns:ht="x"><channel><title>Daily Search Trends</title>
<item><title>Fenerbahçe maçı</title><ht:approx_traffic>500+</ht:approx_traffic></item>
<item><title><![CDATA[Dolunay Soysert]]></title></item>
<item><title>merkür retrosu</title></item>
<item><title>haftalık burç yorumları</title></item>
<item><title>Mars retrosu</title></item></channel></rss>`;
const trends = parseTrendsRss(RSS);
check(trends.length === 5 && trends[1] === "Dolunay Soysert", `RSS ayrıştırma: ${trends.length} başlık, CDATA çözüldü`);
check(parseTrendsRss("").length === 0 && parseTrendsRss("<html>403</html>").length === 0, "boş/bozuk RSS → []");

// Trend yalnız alakalıysa kullanılır
const tAstro = topicalContext("2026-10-26", { category: "zodiac", id: "scorpio", slot: "morning" }, { trends });
check(tAstro.trend?.tag === "#merkürretrosu" && tAstro.trend.mode === "boost", `retro trendi gök doğrulamalı → ${tAstro.trend?.tag}/${tAstro.trend?.mode}`);
const tGen = topicalContext("2026-10-26", { category: "zodiac", id: "scorpio", slot: "morning" }, { trends: ["haftalık burç yorumları"] });
check(tGen.trend?.tag === "#haftalıkburçyorumları" && tGen.topical.includes("#haftalıkburçyorumları"), "genel burç trendi zodyak videosunda yeni etiket");
const tDream = topicalContext("2026-10-26", { category: "dream", id: "snake", slot: "morning" }, { trends: ["haftalık burç yorumları", "Fenerbahçe maçı"] });
check(!tDream.trend, "burç trendi rüya videosuna GİRMEZ");
check(!topicalContext("2026-10-26", { category: "zodiac", id: "scorpio" }, { trends: ["mars retrosu"] }).trend, "Mars retrosu yokken 'mars retrosu' trendi yok sayılır");
check(!topicalContext("2026-11-02", { category: "zodiac", id: "scorpio" }, { trends: ["dolunay"] }).trend, "Dolunay günü değilken 'dolunay' trendi yok sayılır");
check(!topicalContext("2026-10-26", { category: "zodiac", id: "aries" }, { trends: ["akrep burcu"] }).trend, "başka burcun trendi bu burç videosuna girmez");
check(topicalContext("2026-10-26", { category: "zodiac", id: "scorpio" }, { trends: ["akrep burcu"] }).trend?.tag === "#akrepburcu", "kendi burcunun trendi kullanılır");
check(!topicalContext("2026-10-26", { category: "tarot", id: "the-tower" }, { trends: ["rüya tabiri"] }).trend, "rüya trendi tarot videosuna girmez");
check(topicalContext("2026-11-11", { category: "number", id: "11" }, { trends: ["11.11 portal"] }).trend?.tag === "#1111portalı", "11.11 trendi yalnız 11 Kasım'da");
check(!topicalContext("2026-11-10", { category: "number", id: "11" }, { trends: ["11.11 portal"] }).trend, "11.11 trendi 10 Kasım'da yok");
check(topicalContext("2026-10-26", { category: "zodiac", id: "scorpio" }, { trends: [] }).trend === undefined, "trend listesi boşken trend yok (dosya yok/hata yolu)");
const t1 = JSON.stringify(topicalContext("2026-10-26", { category: "zodiac", id: "scorpio", slot: "evening" }, { trends }));
check(t1 === JSON.stringify(topicalContext("2026-10-26", { category: "zodiac", id: "scorpio", slot: "evening" }, { trends })), "deterministik: aynı girdi aynı çıktı");

// ─── 3) Gök / takvim ─────────────────────────────────────────────────────
const lineOf = (d: string, cat = "zodiac", id = "scorpio", slot: "morning" | "evening" = "morning") =>
  topicalContext(d, { category: cat, id, slot }, { trends: [] });
check(lineOf("2026-10-23").captionLine?.includes("Merkür retrosu yarın") === true, `23 Eki: ${lineOf("2026-10-23").captionLine}`);
check(lineOf("2026-10-23").topical.includes("#akrepsezonu"), "23 Eki: #akrepsezonu (Güneş Akrep'e giriyor)");
check(lineOf("2026-10-22").topical.includes("#terazisezonu"), "22 Eki: #terazisezonu");
check(lineOf("2026-10-26").captionLine === "Boğa burcunda Dolunay 🌕" && lineOf("2026-10-26").topical.includes("#boğadadolunay"), `26 Eki: ${lineOf("2026-10-26").captionLine}`);
check(lineOf("2026-10-31").captionLine?.includes("Cadılar Bayramı") === true && lineOf("2026-10-31").topical.includes("#cadılarbayramı"), "31 Eki: Cadılar Bayramı");
check(lineOf("2026-11-11").captionLine?.includes("11.11") === true && lineOf("2026-11-11").topical.includes("#1111"), "11 Kas: 11.11 portal");
check(lineOf("2026-12-12").topical.includes("#1212"), "12 Ara: 12.12 portal");
check(lineOf("2026-12-21").captionLine?.includes("Kış gündönümü") === true, `21 Ara: ${lineOf("2026-12-21").captionLine}`);
check(lineOf("2026-12-29").captionLine?.includes("Yeni yıl") === true, "29 Ara: yeni yıl enerjisi");
check(lineOf("2027-01-01").captionLine?.includes("Yeni yıl") === true, "1 Oca: yeni yıl enerjisi");
check(topicalContext("2027-02-14", { category: "compat", id: calCompat() }, { trends: [] }).topical.includes("#sevgililergünü"), "14 Şub: Sevgililer Günü (uyum videosu)");
check(!topicalContext("2027-02-14", { category: "dream", id: "snake" }, { trends: [] }).topical.includes("#sevgililergünü"), "14 Şub: rüya videosuna Sevgililer Günü girmez");
check(calendarMoments("2027-03-20").some((m) => /lkbahar/.test(m.line)) || calendarMoments("2027-03-21").some((m) => /lkbahar/.test(m.line)), "ilkbahar ekinoksu (hesaplanan tarih)");
check(calendarMoments("2026-11-13").some((m) => m.line.startsWith("Cuma 13")), "Cuma 13 (13 Kas 2026)");
check(weekdayMoment("2026-10-12")?.tags[0] === "#haftanınenerjisi" && weekdayMoment("2026-10-16")?.line.startsWith("Hafta sonuna") === true && weekdayMoment("2026-10-14") === null, "hafta içi: Pazartesi enerji, Cuma hafta sonu, Çarşamba yok");
const skyVid = topicalContext("2026-10-26", { category: "sky", id: "full-moon-moon-2026-10-26" }, { trends: [] });
check(skyVid.captionLine === undefined && skyVid.titleLead === undefined, "Gök Gündemi videosunda satır/önek yok (kanca zaten olay)");
function calCompat(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("../src/data/zodiac-compatibility").ZODIAC_COMPATIBILITY[0].id;
}

// ─── 4) Matris: 21 gün × 2 slot + Gök Gündemi günleri ─────────────────────
const FORBID = /(kandil|ramazan|kurban|mevlid|regaip|miraç|berat |kadir gecesi|şeker bayramı|hac )/i;
const start = dateToDay(istanbulDate(new Date()));
const days = new Set<number>();
for (let i = 0; i < 21; i++) days.add(start + i);
for (let i = 0; i < 90; i++) if (skyEventForDay(start + i)) days.add(start + i);
const igSets = new Set<string>();
let rows = 0;
let withLine = 0;
const hashLines = (text: string) => text.split("\n").filter((l) => /^#\S/.test(l));

for (const day of [...days].sort((a, b) => a - b)) {
  const date = dayToDate(day);
  for (const v of getVideosForDay(day)) {
    const opts: MetaOpts = { date, slot: v.slot, trends: [] };
    const T = topicalFor(v.category, v.id, opts);
    const ig = buildInstagramCaption(v.category, v.id, opts);
    const tt = buildTikTokMetadata(v.category, v.id, opts);
    const yt = buildMetadata(v.category, v.id, opts);
    const igTags = (hashLines(ig).pop() ?? "").split(" ").filter(Boolean);
    const ttTags = (hashLines(tt.caption).pop() ?? "").split(" ").filter(Boolean);
    const ytTags = (hashLines(yt.description).pop() ?? "").split(" ").filter(Boolean);
    const where = `${date} ${v.slot} ${v.category}/${v.id}`;
    const probs: string[] = [];
    const chk = (name: string, tags: string[], min: number, max: number) => {
      if (tags.length < min || tags.length > max) probs.push(`${name} adet ${tags.length} (beklenen ${min}-${max})`);
      const seen = new Set<string>();
      for (const t of tags) {
        if (!TAG_RE.test(t)) probs.push(`${name} biçim: ${t}`);
        if (t !== low(t)) probs.push(`${name} küçük harf değil: ${t}`);
        if (t.includes("̇")) probs.push(`${name} U+0307: ${t}`);
        if (seen.has(low(t))) probs.push(`${name} tekrar: ${t}`);
        seen.add(low(t));
        if (!(low(t) in T.sources)) probs.push(`${name} kaynaksız etiket: ${t}`);
      }
    };
    chk("IG", igTags, 3, 6);
    chk("TT", ttTags, 3, 6);
    chk("YT", ytTags, 1, 3);
    if (igTags.length > TAG_CAP.instagram || ttTags.length > TAG_CAP.tiktok) probs.push("platform sınırı aşıldı");
    if (ttTags.includes("#pythia") || ytTags.includes("#pythia")) probs.push("#pythia yalnız IG'de olmalı");
    if (T.captionLine) {
      withLine++;
      const lines = ig.split("\n");
      if (lines[1] !== T.captionLine) probs.push("IG: güncel satır kancanın hemen altında değil");
      if (lines[0].includes(T.captionLine)) probs.push("IG: kanca satırı değişmiş");
      if (!yt.description.includes(T.captionLine)) probs.push("YT açıklamada güncel satır yok");
      if (!tt.caption.includes(T.captionLine)) probs.push("TikTok'ta güncel satır yok");
    }
    if (tt.line1 !== buildTikTokMetadata(v.category, v.id, { ...opts, date: dayToDate(day + 40) }).line1) probs.push("TikTok line1 tarihe bağlı (dedup anahtarı kararsız)");
    if (!yt.title.endsWith("#shorts") || yt.title.length > 100 || /undefined|NaN/.test(yt.title + yt.description + ig + tt.caption)) probs.push(`YT başlık/metin bozuk: ${yt.title}`);
    if (FORBID.test(`${ig}\n${tt.caption}\n${yt.title}`)) probs.push("dini gün ifadesi");
    for (const p of probs) check(false, `${where}: ${p}`);
    igSets.add(igTags.join(" "));
    rows++;
    if (!QUIET) {
      console.log(`${where.padEnd(44)} ${T.captionLine ?? "-"}`);
      console.log(`    IG ${igTags.join(" ")}\n    TT ${ttTags.join(" ")}\n    YT ${ytTags.join(" ")} | ${yt.title}`);
    }
  }
}
check(rows >= 42, `${rows} gönderi (21 gün × 2 slot + gök olayı günleri) tarandı`);
check(igSets.size >= rows * 0.6, `IG etiket setleri çeşitli: ${igSets.size}/${rows} farklı`);
check(withLine >= rows * 0.5, `güncel satır ${withLine}/${rows} gönderide`);

// ─── 5) Yıllık tarama: #pythia payı, dini ifade yok, evergreen kaynağı ─────
let brandOn = 0;
let total = 0;
for (let i = 0; i < 365; i++) {
  const date = dayToDate(start + i);
  for (const slot of ["morning", "evening"] as const) {
    const T = topicalContext(date, { category: "zodiac", id: "scorpio", slot }, { trends: [] });
    total++;
    if (T.brand) brandOn++;
    const all = [...T.hashtags, T.captionLine ?? ""].join(" ");
    if (FORBID.test(all)) check(false, `${date}: dini ifade: ${all}`);
    for (const t of topicalHashtags(T, 5, true))
      if (!(low(t) in T.sources)) check(false, `${date}: kaynaksız ${t}`);
    for (const t of T.evergreen) if (!EVERGREEN_POOL.includes(t)) check(false, `${date}: havuz dışı evergreen ${t}`);
  }
}
const share = brandOn / total;
check(share > 0.2 && share < 0.5, `#pythia payı ${(share * 100).toFixed(0)}% (${brandOn}/${total}) — her gönderide değil`);

if (!QUIET) {
  console.log("\n── Örnekler (sabah/akşam, zodyak Akrep videosu) ──");
  for (const d of ["2026-10-23", "2026-10-26", "2026-10-31", "2026-11-11"])
    for (const slot of ["morning", "evening"] as const) {
      const T = topicalFor("zodiac", "scorpio", { date: d, slot, trends: [] });
      console.log(`${d} ${slot}: ${T.captionLine ?? "-"} | IG ${topicalHashtags(T, 5, true).join(" ")}`);
    }
}
console.log(fail ? `\n💥 ${fail} başarısız` : "\n🎉 verify:topical TAMAM");
process.exit(fail ? 1 : 0);
