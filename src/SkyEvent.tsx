import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackgroundMusic } from "./components/shared";
import { type Voiceover, getSegs, VoiceTrack } from "./components/voiceover";
import type { SkyAccent, SkyCard } from "./data/sky-types";

// ═══════════════════════════════════════════════════════════════════════════
// SkyEvent — "Gök Gündemi" (retro / Dolunay / Yeniay / tutulma)
//
// KENDİ görsel kimliği: diğer kategorilerin altın + mor yıldız alanı yerine
// derin mavi-turkuaz "yörünge haritası" (gece mavisi zemin, ince yörünge
// halkaları, gezegen diski). Aksan rengi olaya göre değişir; altın YOK.
// Kanca (gezegen + iki satır başlık + tarih) 0. karede TAM görünür.
// Ses-güdümlü: 5 klip (intro, m1=tema, m2=3 burç, m3=ipucu, close=CTA).
// ═══════════════════════════════════════════════════════════════════════════

export type SkyEventProps = { sky: SkyCard; voiceover?: Voiceover; tiktokClean?: boolean };

const FONT = '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif';
const INK = "#eaf6ff";
const BG = "linear-gradient(180deg, #020a17 0%, #04202f 48%, #073748 100%)";

const ACCENT: Record<SkyAccent, { main: string; soft: string; date: string }> = {
  retro: { main: "#5eead4", soft: "rgba(94,234,212,0.16)", date: "#ff9770" },
  direct: { main: "#9af7c0", soft: "rgba(154,247,192,0.16)", date: "#5eead4" },
  full: { main: "#cfe3ff", soft: "rgba(207,227,255,0.16)", date: "#7dd3fc" },
  new: { main: "#b7a6ff", soft: "rgba(183,166,255,0.18)", date: "#7dd3fc" },
  eclipse: { main: "#ffb36b", soft: "rgba(255,179,107,0.16)", date: "#7dd3fc" },
};

// ─── Arka plan: yörünge haritası ─────────────────────────────────────────
const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 211) % 1080,
  y: (i * 397) % 1920,
  r: 1 + (i % 3) * 0.7,
  p: (i * 13) % 60,
}));

const Backdrop: React.FC<{ accent: SkyAccent; retro: boolean }> = ({ accent, retro }) => {
  const frame = useCurrentFrame();
  const a = ACCENT[accent];
  const cx = 540;
  const cy = 565;
  const rings = [210, 360, 520, 700, 900];
  const dir = retro ? -1 : 1; // retro: yörünge noktaları geriye akar
  return (
    <AbsoluteFill style={{ background: BG }}>
      <AbsoluteFill
        style={{ background: `radial-gradient(circle at 50% 40%, ${a.soft} 0%, rgba(0,0,0,0) 55%)` }}
      />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#cfeaff"
            opacity={0.25 + 0.35 * Math.abs(Math.sin((frame + s.p) * 0.04))}
          />
        ))}
        {rings.map((r, i) => {
          const ang = (frame * (0.35 + i * 0.12) * dir + i * 70) * (Math.PI / 180);
          return (
            <g key={r}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={i === 1 ? a.main : "#7fb7d6"}
                strokeOpacity={i === 1 ? 0.28 : 0.13}
                strokeWidth={2}
                strokeDasharray={i % 2 ? "4 14" : "none"}
              />
              <circle cx={cx + r * Math.cos(ang)} cy={cy + r * Math.sin(ang)} r={7 - i} fill={a.main} opacity={0.8} />
            </g>
          );
        })}
      </svg>
      <AbsoluteFill
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,5,12,0.65) 100%)" }}
      />
    </AbsoluteFill>
  );
};

// ─── Gezegen / Ay diski (SVG, saf geometri) ──────────────────────────────
const Disc: React.FC<{ body: string; kind: string; size: number }> = ({ body, kind, size }) => {
  const R = 100;
  const id = `g-${body}-${kind}`;
  const common = (
    <defs>
      <radialGradient id={`${id}-mercury`} cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#e3ecef" />
        <stop offset="100%" stopColor="#566a75" />
      </radialGradient>
      <radialGradient id={`${id}-venus`} cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#ffe9c7" />
        <stop offset="100%" stopColor="#c47b3a" />
      </radialGradient>
      <radialGradient id={`${id}-mars`} cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#ff9c7a" />
        <stop offset="100%" stopColor="#7a2216" />
      </radialGradient>
      <radialGradient id={`${id}-jupiter`} cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#f4dcc0" />
        <stop offset="100%" stopColor="#9a6b45" />
      </radialGradient>
      <radialGradient id={`${id}-saturn`} cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#f7e7bd" />
        <stop offset="100%" stopColor="#a78a4d" />
      </radialGradient>
      <radialGradient id={`${id}-moon`} cx="35%" cy="30%" r="85%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#9fb3cc" />
      </radialGradient>
      <radialGradient id={`${id}-red`} cx="40%" cy="35%" r="80%">
        <stop offset="0%" stopColor="#d9694a" />
        <stop offset="100%" stopColor="#5a1a12" />
      </radialGradient>
      <clipPath id={`${id}-clip`}>
        <circle cx="0" cy="0" r={R} />
      </clipPath>
    </defs>
  );
  let inner: React.ReactNode;
  if (body === "moon" && kind === "new-moon") {
    inner = (
      <>
        <circle r={R} fill="#07101e" />
        <circle r={R} fill="none" stroke="#7aa3d6" strokeOpacity={0.55} strokeWidth={3} />
        <path d="M-40 -88 A96 96 0 0 1 88 -40" fill="none" stroke="#bcd4f5" strokeOpacity={0.7} strokeWidth={6} strokeLinecap="round" />
      </>
    );
  } else if (body === "moon" && kind === "lunar-eclipse") {
    inner = (
      <>
        <circle r={R} fill={`url(#${id}-red)`} />
        <circle cx={-34} cy={-26} r={14} fill="#000" opacity={0.18} />
        <circle cx={30} cy={22} r={20} fill="#000" opacity={0.15} />
        <circle r={R} fill="none" stroke="#ff9a76" strokeOpacity={0.6} strokeWidth={3} />
      </>
    );
  } else if (body === "moon") {
    inner = (
      <>
        <circle r={R} fill={`url(#${id}-moon)`} />
        <circle cx={-32} cy={-24} r={16} fill="#8fa3bd" opacity={0.35} />
        <circle cx={36} cy={14} r={22} fill="#8fa3bd" opacity={0.28} />
        <circle cx={-6} cy={50} r={12} fill="#8fa3bd" opacity={0.3} />
      </>
    );
  } else if (body === "sun") {
    inner = (
      <>
        <circle r={R + 26} fill="#ffb36b" opacity={0.18} />
        <circle r={R + 10} fill="none" stroke="#ffb36b" strokeOpacity={0.6} strokeWidth={4} />
        <circle r={R} fill="#02060d" />
      </>
    );
  } else {
    inner = (
      <>
        {body === "saturn" && (
          <ellipse rx={R * 1.75} ry={R * 0.38} fill="none" stroke="#e6cf93" strokeOpacity={0.75} strokeWidth={9} transform="rotate(-18)" />
        )}
        <circle r={R} fill={`url(#${id}-${body})`} />
        {body === "jupiter" && (
          <g clipPath={`url(#${id}-clip)`} opacity={0.5}>
            <rect x={-R} y={-52} width={2 * R} height={14} fill="#7b4f31" />
            <rect x={-R} y={-18} width={2 * R} height={20} fill="#c99a6e" />
            <rect x={-R} y={18} width={2 * R} height={12} fill="#7b4f31" />
            <rect x={-R} y={50} width={2 * R} height={10} fill="#b98558" />
          </g>
        )}
        {body === "saturn" && (
          <path d="M-175 0 A175 38 0 0 0 175 0" transform="rotate(-18)" fill="none" stroke="#e6cf93" strokeOpacity={0.9} strokeWidth={9} />
        )}
      </>
    );
  }
  return (
    <svg width={size} height={size} viewBox="-190 -190 380 380" style={{ overflow: "visible" }}>
      {common}
      <g>{inner}</g>
    </svg>
  );
};

// ─── Sembol çizgileri (viewBox 100) ──────────────────────────────────────
const GLYPH: Record<string, React.ReactNode> = {
  mercury: (
    <>
      <circle cx="50" cy="56" r="16" />
      <path d="M35 18 A15 15 0 0 0 65 18" />
      <path d="M50 72 V94 M40 84 H60" />
    </>
  ),
  venus: (
    <>
      <circle cx="50" cy="38" r="20" />
      <path d="M50 58 V92 M34 76 H66" />
    </>
  ),
  mars: (
    <>
      <circle cx="42" cy="60" r="22" />
      <path d="M58 44 L84 18 M62 18 H84 V40" />
    </>
  ),
  jupiter: <path d="M30 28 C30 12 54 12 54 30 C54 44 38 56 24 62 H80 M64 30 V92" />,
  saturn: <path d="M34 10 V70 M34 32 C36 16 62 16 62 38 C62 54 44 62 44 78 C44 90 56 92 62 82" />,
  moon: <path d="M62 14 A38 38 0 1 0 62 86 A30 30 0 1 1 62 14 Z" />,
  sun: (
    <>
      <circle cx="50" cy="50" r="30" />
      <circle cx="50" cy="50" r="4" />
    </>
  ),
};
const Glyph: React.FC<{ body: string; size: number; color: string }> = ({ body, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
    {GLYPH[body] ?? GLYPH.moon}
  </svg>
);

const SignGlyph: React.FC<{ signId: string; size: number; color: string }> = ({ signId, size, color }) => {
  const url = staticFile(`zodiac/${signId}.svg`);
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
};

const fadeOut = (frame: number, d: number, fps: number) =>
  interpolate(frame, [d - 0.35 * fps, d], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const label: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 700,
  letterSpacing: 8,
  textTransform: "uppercase",
};

// ─── 1) KANCA ────────────────────────────────────────────────────────────
const Hook: React.FC<{ sky: SkyCard; d: number }> = ({ sky, d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = ACCENT[sky.accent];
  // 0. karede TAM görünür: opaklık solması yok, yalnız 0.94 → 1 "pop".
  const pop = 0.94 + 0.06 * spring({ frame, fps, config: { damping: 12, stiffness: 110 }, durationInFrames: 0.5 * fps });
  const float = Math.sin(frame * 0.05) * 10;
  const out = fadeOut(frame, d, fps);
  const [l1, l2] = sky.headline;
  return (
    <AbsoluteFill style={{ alignItems: "center", opacity: out }}>
      <div style={{ position: "absolute", top: 330, transform: `translateY(${float}px) scale(${pop})` }}>
        <Disc body={sky.body} kind={sky.kind} size={470} />
      </div>
      <div style={{ position: "absolute", top: 1010, width: 1080, textAlign: "center", transform: `scale(${pop})` }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: l1.length > 14 ? 78 : 92, color: INK, letterSpacing: 3, lineHeight: 1.1 }}>
          {l1}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: l2.length > 14 ? 82 : 112,
            color: a.main,
            letterSpacing: 2,
            lineHeight: 1.12,
            marginTop: 8,
            textShadow: `0 0 40px ${a.main}66`,
          }}
        >
          {l2}
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 38,
            padding: "16px 54px",
            borderRadius: 999,
            border: `3px solid ${a.date}`,
            color: a.date,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 60,
            letterSpacing: 6,
          }}
        >
          {sky.dateLabel}
        </div>
        <div style={{ ...label, fontSize: 30, letterSpacing: 4, fontWeight: 600, color: "rgba(234,246,255,0.7)", marginTop: 28, textTransform: "none" }}>
          {sky.sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── 2) Burç + gezegen sembolü ───────────────────────────────────────────
const SignReveal: React.FC<{ sky: SkyCard; d: number }> = ({ sky, d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = ACCENT[sky.accent];
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 90 }, durationInFrames: 0.9 * fps });
  const out = fadeOut(frame, d, fps);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out * enter, transform: `scale(${0.85 + 0.15 * enter})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
        <div style={{ width: 210, height: 210, borderRadius: 105, border: `3px solid ${a.main}88`, display: "flex", alignItems: "center", justifyContent: "center", background: a.soft }}>
          <Glyph body={sky.body} size={130} color={a.main} />
        </div>
        <div style={{ ...label, fontSize: 56, color: a.date }}>›</div>
        <div style={{ width: 280, height: 280, borderRadius: 140, border: `3px solid ${a.main}`, display: "flex", alignItems: "center", justifyContent: "center", background: a.soft }}>
          <SignGlyph signId={sky.signId} size={180} color={INK} />
        </div>
      </div>
      <div style={{ ...label, fontSize: 84, color: INK, marginTop: 60, letterSpacing: 6 }}>{sky.signName}</div>
      <div style={{ fontFamily: FONT, fontSize: 40, color: "rgba(234,246,255,0.75)", marginTop: 12, letterSpacing: 2 }}>
        burcunda · {sky.planetName}
      </div>
    </AbsoluteFill>
  );
};

// ─── 3) Geleneksel tema ──────────────────────────────────────────────────
const Theme: React.FC<{ sky: SkyCard; d: number }> = ({ sky, d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = ACCENT[sky.accent];
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 100 }, durationInFrames: 0.6 * fps });
  const out = fadeOut(frame, d, fps);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px", opacity: out * enter, transform: `translateY(${(1 - enter) * 50}px)` }}>
      <div style={{ ...label, fontSize: 32, color: a.date, marginBottom: 26 }}>GELENEKSEL OLARAK</div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 76, lineHeight: 1.15, color: a.main, letterSpacing: 2, marginBottom: 44, whiteSpace: "pre-line" }}>
        {sky.theme.title.replace(/ · /g, "\n")}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 46, lineHeight: 1.4, color: INK, whiteSpace: "pre-line" }}>{sky.theme.desc}</div>
    </AbsoluteFill>
  );
};

// ─── 4) En çok etkilenebilecek 3 burç ────────────────────────────────────
const Signs: React.FC<{ sky: SkyCard; d: number }> = ({ sky, d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = ACCENT[sky.accent];
  const out = fadeOut(frame, d, fps);
  const stagger = Math.max(0.5 * fps, (d * 0.7) / 3); // satırlar ses boyunca sırayla açılır
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 70px", opacity: out }}>
      <div style={{ ...label, fontSize: 32, color: a.date, marginBottom: 34, textAlign: "center" }}>EN ÇOK HİSSEDEBİLECEK 3 BURÇ</div>
      {sky.affected.map((s, i) => {
        const e = spring({ frame: frame - i * stagger, fps, config: { damping: 15, stiffness: 100 }, durationInFrames: 0.5 * fps });
        return (
          <div
            key={s.signId}
            style={{
              opacity: e,
              transform: `translateX(${(1 - e) * 80}px)`,
              display: "flex",
              alignItems: "center",
              gap: 28,
              background: a.soft,
              border: `2px solid ${a.main}55`,
              borderRadius: 32,
              padding: "26px 32px",
              marginBottom: 26,
            }}
          >
            <SignGlyph signId={s.signId} size={112} color={a.main} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, color: INK, letterSpacing: 3 }}>{s.signName.toLocaleUpperCase("tr")}</div>
              <div style={{ fontFamily: FONT, fontSize: 34, lineHeight: 1.3, color: "rgba(234,246,255,0.88)", marginTop: 6 }}>{s.line}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── 5) Sakin ipucu ──────────────────────────────────────────────────────
const Tip: React.FC<{ sky: SkyCard; d: number }> = ({ sky, d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = ACCENT[sky.accent];
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 100 }, durationInFrames: 0.6 * fps });
  const out = fadeOut(frame, d, fps);
  const breathe = 1 + Math.sin(frame * 0.07) * 0.03;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 90px", opacity: out * enter }}>
      <div style={{ width: 150, height: 150, borderRadius: 75, border: `3px solid ${a.main}`, background: a.soft, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${breathe})`, marginBottom: 46 }}>
        <Glyph body="moon" size={84} color={a.main} />
      </div>
      <div style={{ ...label, fontSize: 34, color: a.date, marginBottom: 30 }}>SAKİN BİR İPUCU</div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 56, lineHeight: 1.35, color: INK, textAlign: "center" }}>{sky.tip}</div>
    </AbsoluteFill>
  );
};

// ─── 6) Soru ─────────────────────────────────────────────────────────────
const Ask: React.FC<{ sky: SkyCard; d: number }> = ({ sky, d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = ACCENT[sky.accent];
  const op = interpolate(frame, [0, 0.35 * fps, d - 0.3 * fps, d], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 90px", opacity: op }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 88, lineHeight: 1.2, color: INK, textAlign: "center" }}>{sky.question}</div>
      <div style={{ ...label, fontSize: 34, color: a.main, marginTop: 40, letterSpacing: 4, textTransform: "none" }}>Yorumlara burcunu yaz</div>
    </AbsoluteFill>
  );
};

// ─── 7) CTA (kendi stili: turkuaz, altın değil) ──────────────────────────
const Cta: React.FC<{ sky: SkyCard }> = ({ sky }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = ACCENT[sky.accent];
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 90 }, durationInFrames: 0.8 * fps });
  const glow = (Math.sin(frame * 0.1) + 1) * 0.5;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: enter, transform: `scale(${0.7 + 0.3 * enter})` }}>
      <Img src={staticFile("logo.png")} style={{ width: 230, height: 230, borderRadius: 58, boxShadow: `0 0 ${40 + glow * 30}px ${a.main}88` }} />
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 84, color: INK, letterSpacing: 14, marginTop: 34 }}>PYTHIA</div>
      <div style={{ fontFamily: FONT, fontSize: 40, color: "rgba(234,246,255,0.85)", marginTop: 14, textAlign: "center", padding: "0 80px" }}>
        Günlük burç yorumunu oku
      </div>
      <div
        style={{
          marginTop: 34,
          padding: "16px 44px",
          borderRadius: 999,
          background: a.main,
          color: "#031420",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 32,
          letterSpacing: 2,
          boxShadow: `0 0 ${24 + glow * 24}px ${a.main}`,
        }}
      >
        ÜCRETSİZ DENE
      </div>
      <div style={{ fontFamily: FONT, fontSize: 32, color: INK, marginTop: 24, transform: `translateY(${Math.sin(frame * 0.2) * 8}px)` }}>
        Profildeki linke dokun
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
export const SkyEvent: React.FC<SkyEventProps> = ({ sky, voiceover, tiktokClean }) => {
  const { fps } = useVideoConfig();
  const g = getSegs(voiceover, fps);
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Backdrop accent={sky.accent} retro={sky.kind.startsWith("retro") && sky.kind !== "retro-end"} />
      {!tiktokClean && <BackgroundMusic maxVolume={voiceover ? 0.12 : 0.45} />}
      {voiceover && <VoiceTrack vo={voiceover} />}

      <Sequence durationInFrames={g.hook.dur} layout="none">
        <Hook sky={sky} d={g.hook.dur} />
      </Sequence>
      <Sequence from={g.reveal.from} durationInFrames={g.reveal.dur} layout="none">
        <SignReveal sky={sky} d={g.reveal.dur} />
      </Sequence>
      <Sequence from={g.m1.from} durationInFrames={g.m1.dur} layout="none">
        <Theme sky={sky} d={g.m1.dur} />
      </Sequence>
      <Sequence from={g.m2.from} durationInFrames={g.m2.dur} layout="none">
        <Signs sky={sky} d={g.m2.dur} />
      </Sequence>
      <Sequence from={g.m3.from} durationInFrames={g.m3.dur} layout="none">
        <Tip sky={sky} d={g.m3.dur} />
      </Sequence>
      <Sequence from={g.q.from} durationInFrames={g.q.dur} layout="none">
        <Ask sky={sky} d={g.q.dur} />
      </Sequence>
      <Sequence from={g.cta.from} durationInFrames={g.cta.dur} layout="none">
        {!tiktokClean && <Cta sky={sky} />}
      </Sequence>
    </AbsoluteFill>
  );
};
