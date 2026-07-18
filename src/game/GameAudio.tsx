// ═══════════════════════════════════════════════════════════════════════════
// GameAudio.tsx — SimResult ses olaylarını timeline'a koyar (senkron SFX)
//
// Oyunun kendi SFX dosyaları (public/sfx, conveyor_sort_app/assets/audio'dan):
// drop/seal/dock/lost/win. thock'lar zaman çizelgesindeki olaylara senkron çalar.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import type { SimResult } from "./botSim";

const VOL: Record<string, number> = {
  drop: 0.6,
  seal: 0.95,
  dock: 0.5,
  lost: 0.7,
  win: 0.9,
  fail: 0.8,
  wrong: 0.5,
};

export const GameAudio: React.FC<{
  sim: SimResult;
  fps: number;
  speed: number;
  windowStart?: number; // sn — kesit başlangıcı (SealCompilation için)
  windowDur?: number; // sn — kesit süresi (varsayılan: sonuna kadar)
}> = ({ sim, fps, speed, windowStart = 0, windowDur = Infinity }) => {
  const end = windowStart + windowDur;
  return (
    <>
      {sim.audio
        .filter((ev) => ev.t >= windowStart && ev.t < end)
        .map((ev, i) => {
          const from = Math.max(0, Math.round(((ev.t - windowStart) / speed) * fps));
          return (
            <Sequence key={i} from={from} durationInFrames={Math.round(2 * fps)} layout="none">
              <Audio src={staticFile(`sfx/${ev.sfx}.mp3`)} volume={() => VOL[ev.sfx] ?? 0.6} />
            </Sequence>
          );
        })}
    </>
  );
};
