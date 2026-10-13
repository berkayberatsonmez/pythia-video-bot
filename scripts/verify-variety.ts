// verify-variety.ts — tema/ses çeşitliliği değişmezleri (ağ yok).
//   1) Ardışık yayınlarda (sabah→akşam→ertesi sabah…) tema ve ses HEP farklı.
//   2) 4 tema da ve iki ses de eşit kullanılır; ses–tema eşleşmesi sabit değil.
//   3) THEME_COUNT shared.tsx ile aynı; müzik ofseti + en uzun video parça içinde kalır.
import { readFileSync } from "node:fs";
import { THEME_COUNT, VOICES, seqNumber, themeFor, voiceFor } from "./variety";

let fail = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✅" : "❌"} ${msg}`);
  if (!ok) fail++;
};

const slots = ["morning", "evening"] as const;
const seq: { n: number; theme: number; voice: string }[] = [];
for (let d = 20000; d < 20000 + 400; d++)
  for (const s of slots) seq.push({ n: seqNumber(d, s), theme: themeFor(d, s), voice: voiceFor(d, s) });

let sameTheme = 0;
let sameVoice = 0;
for (let i = 1; i < seq.length; i++) {
  if (seq[i].theme === seq[i - 1].theme) sameTheme++;
  if (seq[i].voice === seq[i - 1].voice) sameVoice++;
}
check(sameTheme === 0, `ardışık iki video aynı tema: ${sameTheme}`);
check(sameVoice === 0, `ardışık iki video aynı ses: ${sameVoice}`);

const themeCount = new Array(THEME_COUNT).fill(0);
for (const e of seq) themeCount[e.theme]++;
check(themeCount.every((c) => c === seq.length / THEME_COUNT), `temalar eşit dağılır: ${themeCount.join("/")}`);
const combos = new Set(seq.map((e) => `${e.theme}:${e.voice}`));
check(combos.size === THEME_COUNT * VOICES.length, `tema×ses ${combos.size}/${THEME_COUNT * VOICES.length} kombinasyon görülür`);

const shared = readFileSync("src/components/shared.tsx", "utf8");
check(new RegExp(`THEME_COUNT = ${THEME_COUNT};`).test(shared), "THEME_COUNT shared.tsx ile aynı");
const starts = JSON.parse(/MUSIC_START_SEC = (\[[^\]]*\])/.exec(shared)![1]) as number[];
check(starts.length === THEME_COUNT && Math.max(...starts) + 50 < 174, `müzik ofsetleri parça içinde (${starts.join(",")}; parça 174 sn, video ≤ 50 sn)`);
check(VOICES.includes("tr-TR-AhmetNeural" as never) && VOICES.includes("tr-TR-EmelNeural" as never), "sesler: Emel + Ahmet");

if (fail) {
  console.error(`\n${fail} kontrol başarısız`);
  process.exit(1);
}
