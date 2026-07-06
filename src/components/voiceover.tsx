// ═══════════════════════════════════════════════════════════════════════════
// voiceover.tsx — Ses-güdümlü zamanlama + seslendirme ses parçaları
//
// Her video 5 bölüm: intro, m1, m2, m3, close. Her bölümün SÜRESİ
// (saniye) prop'ta gelir → görsel segmentler buna göre boyutlanır
// (sabit 15sn değil). buildSchedule() frame offset'lerini hesaplar.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type VoiceSection = { src: string; dur: number; text?: string }; // dur: saniye · text: altyazı
export type Voiceover = {
  intro: VoiceSection;
  m1: VoiceSection;
  m2: VoiceSection;
  m3: VoiceSection;
  close: VoiceSection;
};

const GAP = 0.12; // segment arası nefes — kısa tut (retention: ölü zaman = kaçış)
const TAIL = 0.5; // sonda kapanış payı — kısalt (watch% için)

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

// ─── Altyazı — voiceover metnini alta göm (segment senkronlu) ──────────────
// intro/m1/m2/m3 gösterilir. close = CTA (LogoCta görseli) + "Paytia" fonetiği
// içerdiği için altyazıda YOK. Ekranda "Pythia" doğru yazılsın diye düzeltiyoruz.
const captionText = (s: string | undefined): string =>
  (s ?? "").replace(/Paytia/gi, "Pythia").trim();

export const Captions: React.FC<{ vo: Voiceover }> = ({ vo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = buildSchedule(vo, fps);
  const spans = [
    { from: s.introFrom, to: s.m1From, text: captionText(vo.intro.text) },
    { from: s.m1From, to: s.m2From, text: captionText(vo.m1.text) },
    { from: s.m2From, to: s.m3From, text: captionText(vo.m2.text) },
    { from: s.m3From, to: s.closeFrom, text: captionText(vo.m3.text) },
  ];
  const cur = spans.find((sp) => frame >= sp.from && frame < sp.to);
  if (!cur || !cur.text) return null;
  const opacity = interpolate(frame - cur.from, [0, 0.22 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "0 70px 340px",
      }}
    >
      <div
        style={{
          opacity,
          maxWidth: 940,
          textAlign: "center",
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          fontSize: 40,
          lineHeight: 1.32,
          color: "#ffffff",
          background: "rgba(10,6,26,0.74)",
          borderRadius: 22,
          padding: "16px 30px",
          textShadow: "0 2px 14px rgba(0,0,0,0.85)",
        }}
      >
        {cur.text}
      </div>
    </AbsoluteFill>
  );
};

// 5 seslendirme klibi + senkron altyazı (VoiceTrack tüm kompozisyonlarda var)
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
      <Captions vo={vo} />
    </>
  );
};
