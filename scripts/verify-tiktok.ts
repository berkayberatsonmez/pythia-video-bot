// TikTok = IG sabah slotu: 400 gün boyunca seçim rotation.ts'in sabah videosuyla aynı,
// caption'da IG'ye özgü satır yok, eğlence uyarısı var.
import assert from "node:assert/strict";
import { getVideosForDay } from "./rotation";
import { dateToDay, dayToDate } from "./sky-events";
import { buildPick } from "./tiktok-rotation";

const start = dateToDay("2026-10-13");
for (let d = start; d < start + 400; d++) {
  const date = dayToDate(d);
  const ig = getVideosForDay(d)[0];
  const p = buildPick(date);
  assert.equal(`${p.v.comp}|${p.v.category}|${p.v.id}`, `${ig.comp}|${ig.category}|${ig.id}`, date);
  assert.equal(p.v.slot, "morning", date);
  assert.ok(!/bio'da|Pythia —|🎁/.test(p.caption), `IG satırı kaldı: ${date}`);
  assert.ok(p.caption.includes("* Yalnızca eğlence amaçlıdır."), `uyarı yok: ${date}`);
  assert.ok(p.caption.length > 0 && p.caption.length <= 2150, date);
}
console.log("✓ verify:tiktok — 400 gün: TikTok = IG sabah, caption temiz");
