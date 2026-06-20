// ═══════════════════════════════════════════════════════════════════════════
// voiceover.tsx — Ses-güdümlü zamanlama + seslendirme ses parçaları
//
// Her video 5 bölüm: intro, m1, m2, m3, close. Her bölümün SÜRESİ
// (saniye) prop'ta gelir → görsel segmentler buna göre boyutlanır
// (sabit 15sn değil). buildSchedule() frame offset'lerini hesaplar.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";

export type VoiceSection = { src: string; dur: number }; // dur: saniye
export type Voiceover = {
  intro: VoiceSection;
  m1: VoiceSection;
  m2: VoiceSection;
  m3: VoiceSection;
  close: VoiceSection;
};

const GAP = 0.18; // segment arası küçük nefes (saniye)
const TAIL = 0.9; // sonda kapanış payı (saniye)

export type Schedule = {
  introFrom: number;
  m1From: number;
  m2From: number;
  m3From: number;
  closeFrom: number;
  total: number; // toplam durationInFrames
};

// Bölüm sürelerinden frame offset'leri üret (segmentler ardışık, aralarda küçük gap)
export function buildSchedule(vo: Voiceover, fps: number): Schedule {
  const f = (s: number) => Math.round(s * fps);
  const gap = f(GAP);
  const introFrom = 0;
  const m1From = introFrom + f(vo.intro.dur) + gap;
  const m2From = m1From + f(vo.m1.dur) + gap;
  const m3From = m2From + f(vo.m2.dur) + gap;
  const closeFrom = m3From + f(vo.m3.dur) + gap;
  const total = closeFrom + f(vo.close.dur) + f(TAIL);
  return { introFrom, m1From, m2From, m3From, closeFrom, total };
}

// Toplam süre (Root calculateMetadata için)
export function voiceoverTotalFrames(vo: Voiceover, fps: number): number {
  return buildSchedule(vo, fps).total;
}

// ─── Görsel segment planı (TÜM kategoriler ortak) ─────────────────────────
// 7 segment: hook, reveal, m1, m2, m3, q(soru), cta. Sesli modda ses
// süresine göre; sessizde sabit 15sn (Studio önizleme).
export type Seg = { from: number; dur: number };
export type Segs = {
  hook: Seg;
  reveal: Seg;
  m1: Seg;
  m2: Seg;
  m3: Seg;
  q: Seg;
  cta: Seg;
};

export function getSegs(vo: Voiceover | undefined, fps: number): Segs {
  if (!vo) {
    const r = (s: number) => Math.round(s * fps);
    return {
      hook: { from: 0, dur: r(2.5) },
      reveal: { from: r(2.5), dur: r(2.5) },
      m1: { from: r(5), dur: r(2.3) },
      m2: { from: r(7.3), dur: r(2.3) },
      m3: { from: r(9.6), dur: r(2.3) },
      q: { from: r(11.9), dur: r(1.5) },
      cta: { from: r(13.4), dur: r(1.6) },
    };
  }
  const s = buildSchedule(vo, fps);
  const introDur = s.m1From;
  const hookDur = Math.round(introDur * 0.42);
  const closeDur = s.total - s.closeFrom;
  const qDur = Math.round(closeDur * 0.45);
  return {
    hook: { from: 0, dur: hookDur },
    reveal: { from: hookDur, dur: introDur - hookDur },
    m1: { from: s.m1From, dur: s.m2From - s.m1From },
    m2: { from: s.m2From, dur: s.m3From - s.m2From },
    m3: { from: s.m3From, dur: s.closeFrom - s.m3From },
    q: { from: s.closeFrom, dur: qDur },
    cta: { from: s.closeFrom + qDur, dur: s.total - (s.closeFrom + qDur) },
  };
}

// 5 seslendirme klibini kendi başlangıçlarına yerleştir
export const VoiceTrack: React.FC<{ vo: Voiceover }> = ({ vo }) => {
  const { fps } = useVideoConfig();
  const schedule = buildSchedule(vo, fps);
  const items: { from: number; sec: VoiceSection }[] = [
    { from: schedule.introFrom, sec: vo.intro },
    { from: schedule.m1From, sec: vo.m1 },
    { from: schedule.m2From, sec: vo.m2 },
    { from: schedule.m3From, sec: vo.m3 },
    { from: schedule.closeFrom, sec: vo.close },
  ];
  return (
    <>
      {items.map((it, i) => (
        <Sequence
          key={i}
          from={it.from}
          durationInFrames={Math.round(it.sec.dur * 30) + 30}
          layout="none"
        >
          <Audio src={staticFile(it.sec.src)} />
        </Sequence>
      ))}
    </>
  );
};
