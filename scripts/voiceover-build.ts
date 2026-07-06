// ═══════════════════════════════════════════════════════════════════════════
// voiceover-build.ts — Bir video için 5 seslendirme klibi üret → Voiceover prop'u
//
// buildVoiceover(category, id):
//   narration üret → her bölümü public/voiceover/<slug>/<key>.mp3'e seslendir →
//   { intro:{src,dur}, m1, m2, m3, close } döndür (Remotion staticFile yolları).
// render-rotation bunu çağırıp prop olarak geçer.
// ═══════════════════════════════════════════════════════════════════════════

import { join } from "node:path";
import { buildNarration } from "./narration";
import { synth } from "./tts";
import type { Voiceover } from "../src/components/voiceover";

const KEYS = ["intro", "m1", "m2", "m3", "close"] as const;

export async function buildVoiceover(
  category: string,
  id: string,
): Promise<Voiceover | null> {
  const n = buildNarration(category, id);
  if (!n) return null;
  const slug = `${category}-${id}`;
  const out = {} as Voiceover;
  for (const key of KEYS) {
    const rel = `voiceover/${slug}/${key}.mp3`;
    const dur = await synth(n[key], join("public", rel));
    out[key] = { src: rel, dur, text: n[key] };
  }
  return out;
}
