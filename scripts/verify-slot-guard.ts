// Slot koruması bekçisi (slot-guard.ts) — 13 Eki 2026 olayının kendisi.
import assert from "node:assert/strict";
import { slotSkipReason } from "./slot-guard";

const t = (s: string) => Date.parse(s);
const sabahPost = "2026-10-13T10:08:00+0000"; // dispatch, 13:08 TR

// 1) Olay: sabah dispatch attı, sabah yedeği 17:33 UTC'de geldi → ATLAMALI
assert.ok(slotSkipReason({ slot: "morning", nowMs: t("2026-10-13T17:33:00Z"), postTimestamps: [sabahPost], backup: true }));
// 2) Aynı gün akşam dispatch 18:07 → YAYINLAMALI
assert.equal(slotSkipReason({ slot: "evening", nowMs: t("2026-10-13T18:07:00Z"), postTimestamps: [sabahPost], backup: false }), null);
// 3) Akşam yedeği 19:46 UTC, iki gönderi varken → ATLAMALI
assert.ok(slotSkipReason({ slot: "evening", nowMs: t("2026-10-13T19:46:00Z"), postTimestamps: [sabahPost, "2026-10-13T18:08:00+0000"], backup: true }));
// 4) Akşam yedeği gece yarısını geçti (00:32 UTC = 03:32 TR, ertesi gün, 0 gönderi) → ATLAMALI
assert.ok(slotSkipReason({ slot: "evening", nowMs: t("2026-10-14T00:32:00Z"), postTimestamps: [], backup: true }));
// 5) Dispatch başarısız olmuş, yedek aynı gün geldi → YAYINLAMALI (yedeğin işi)
assert.equal(slotSkipReason({ slot: "morning", nowMs: t("2026-10-13T15:00:00Z"), postTimestamps: ["2026-10-12T18:08:00+0000"], backup: true }), null);
// 6) Dünün gönderileri bugünü doldurmaz (TR gün sınırı: 20:59 UTC dün, 21:01 UTC bugün)
assert.equal(slotSkipReason({ slot: "morning", nowMs: t("2026-10-13T10:07:00Z"), postTimestamps: ["2026-10-12T20:59:00Z"], backup: false }), null);
assert.ok(slotSkipReason({ slot: "morning", nowMs: t("2026-10-13T10:07:00Z"), postTimestamps: ["2026-10-12T21:01:00Z"], backup: false }));
// 7) IG okunamadı: asıl yol yayınlar, yedek atlar
assert.equal(slotSkipReason({ slot: "morning", nowMs: t("2026-10-13T10:07:00Z"), postTimestamps: null, backup: false }), null);
assert.ok(slotSkipReason({ slot: "morning", nowMs: t("2026-10-13T16:00:00Z"), postTimestamps: null, backup: true }));
// 8) Sabah slotu olmadan akşam (sabah düştü) → akşam yine yayınlar
assert.equal(slotSkipReason({ slot: "evening", nowMs: t("2026-10-13T18:07:00Z"), postTimestamps: [], backup: false }), null);
console.log("✓ verify:slot-guard — 11 durum");
