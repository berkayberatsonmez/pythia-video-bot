// ═══════════════════════════════════════════════════════════════════════════
// tts.ts — Ücretsiz Edge neural TTS (Türkçe "kahin" sesi) + süre ölçümü
//
// synth(text, outPath) → mp3 yazar, saniye cinsinden süreyi döndürür.
// Süre, kompozisyon segmentlerini sese göre boyutlamak için gerekli.
// Ses: tr-TR-EmelNeural, hafif yavaş + kalın (mistik ton). API key YOK, bedava.
// ═══════════════════════════════════════════════════════════════════════════

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { parseFile } from "music-metadata";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { pipeline } from "node:stream/promises";

export const TTS_VOICE = "tr-TR-EmelNeural";
const RATE = "+22%"; // snappier — retention (izleyici 4.6sn'de kaçıyordu, tempo artır)
const PITCH = "+0Hz"; // doğal ton (kalın değil)

/** Metni seslendirip outPath'e mp3 yazar; süreyi (saniye) döndürür. */
export async function synth(text: string, outPath: string): Promise<number> {
  mkdirSync(dirname(outPath), { recursive: true });
  const tts = new MsEdgeTTS();
  await tts.setMetadata(TTS_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, { rate: RATE, pitch: PITCH });
  await pipeline(audioStream, createWriteStream(outPath));
  const meta = await parseFile(outPath);
  return meta.format.duration ?? 0;
}
