// verify-rotation.ts — rotasyon dizisi değişmezleri (ağ yok, saat yok).
//   1) Bir tam döngüde her (category:id) TAM BİR kez geçer.
//   2) Her gün için sabah ve akşam FARKLI poolKey (tüm döngü boyunca).
//   3) Dizi dairesel olarak komşu-farklı (son→ilk dahil).
//   4) Deterministik: iki kez kurulan dizi aynı.
// Çalıştır: npm run verify:rotation
import { buildSequence, getVideosForDay, POOLS } from "./rotation";

let fail = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✅" : "❌"} ${msg}`);
  if (!ok) fail++;
};

const seq = buildSequence();
const expected = Object.values(POOLS).reduce((s, p) => s + p.ids.length, 0);
check(seq.length === expected, `dizi uzunluğu ${seq.length} = toplam id ${expected}`);

const keys = seq.map((s) => `${s.poolKey}:${s.id}`);
check(new Set(keys).size === seq.length, "her id döngüde tam bir kez");
for (const [k, p] of Object.entries(POOLS)) {
  const n = seq.filter((s) => s.poolKey === k).length;
  check(n === p.ids.length, `pool ${k}: ${n}/${p.ids.length} id`);
}

let adj = 0;
for (let i = 0; i < seq.length; i++) {
  if (seq[i].poolKey === seq[(i + 1) % seq.length].poolKey) adj++;
}
check(adj === 0, `komşu (dairesel) aynı pool sayısı = ${adj}`);

// Tam döngü: len gün her (2d, 2d+1) çiftini (len tekse tüm komşuluklar) gezer.
let same = 0;
for (let d = 0; d < seq.length * 2; d++) {
  const [m, e] = getVideosForDay(d, seq);
  if (m.poolKey === e.poolKey) same++;
}
check(same === 0, `sabah/akşam aynı kategori olan gün = ${same} (${seq.length * 2} gün)`);

const again = buildSequence().map((s) => `${s.poolKey}:${s.id}`);
check(again.join("|") === keys.join("|"), "deterministik");

console.log(
  `İlk 8: ${seq.slice(0, 8).map((s) => s.poolKey).join(" → ")}`,
);
if (fail) {
  console.error(`\n${fail} kontrol başarısız`);
  process.exit(1);
}
