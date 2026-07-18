// ═══════════════════════════════════════════════════════════════════════════
// gameStyle.tsx — Conveyor Sort görsel dili (tüm klip kompozisyonlarında ortak)
//
// Oyunun paleti: #A8D8EA gökyüzü + doygun aksan renkleri. Çerçeve, üst hook
// bandı, alt progress bar, kapanış CTA kartı burada tanımlı — tıpkı Pythia'nın
// shared.tsx'i gibi tek yerden stil.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { APP, STORE_URL_IS_PLACEHOLDER } from "../appConfig";

// ─── Palet ────────────────────────────────────────────────────────────────
export const SKY = "#A8D8EA"; // oyunun gökyüzü
export const SKY_DEEP = "#6FB2D2";
export const CORAL = "#FF6B6B";
export const SUNNY = "#FFD93D";
export const MINT = "#4ECDC4";
export const GRAPE = "#845EC2";
export const INK = "#173A4D"; // koyu metin (gökyüzü üstünde okunur)
export const CREAM = "#FFF8E7";

// Letterbox (dikey klip 1080x1920'ye tam oturmazsa arkada görünen) arka planı
export const STAGE_BG = `linear-gradient(180deg, ${SKY} 0%, ${SKY_DEEP} 100%)`;

const CTA_SECONDS = 2.5; // kapanış CTA kartı süresi
export const ctaFrames = (fps: number) => Math.round(CTA_SECONDS * fps);

// ═══════════════════════════════════════════════════════════════════════════
// ConveyorBelt — arka plan bandı: sağa akan chevron'lar (oyun temasını çağrıştırır)
// Letterbox alanı boş kalmasın; hafif ve döngüsel.
// ═══════════════════════════════════════════════════════════════════════════
export const ConveyorBelt: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = (frame * 3) % 120;
  const chevrons = React.useMemo(
    () => Array.from({ length: 24 }, (_, i) => i),
    [],
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 0.25 }}>
      {chevrons.map((row) => (
        <div
          key={row}
          style={{
            position: "absolute",
            top: `${row * 90 - 40}px`,
            left: -120 + shift,
            display: "flex",
            gap: 40,
          }}
        >
          {Array.from({ length: 16 }, (_, c) => (
            <div
              key={c}
              style={{
                width: 60,
                height: 60,
                borderRight: `10px solid ${row % 2 ? SUNNY : CREAM}`,
                borderBottom: `10px solid ${row % 2 ? SUNNY : CREAM}`,
                transform: "rotate(-45deg)",
              }}
            />
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ClipStage — mp4'ü 1080x1920'ye "cover" doldurur (scrcpy dikey kaydı için)
// children = OffthreadVideo. Arka planda ConveyorBelt letterbox'ı doldurur.
// ═══════════════════════════════════════════════════════════════════════════
export const ClipStage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <AbsoluteFill style={{ background: STAGE_BG }}>
    <ConveyorBelt />
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);

// ═══════════════════════════════════════════════════════════════════════════
// HookBanner — üstte hook metni (props'tan). Kayarak girer, tutar, sona doğru solar.
// ═══════════════════════════════════════════════════════════════════════════
export const HookBanner: React.FC<{
  text: string;
  holdFrames?: number; // bu frame'e kadar tam görünür, sonra solar
}> = ({ text, holdFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120 },
    durationInFrames: 0.5 * fps,
  });
  const ty = interpolate(enter, [0, 1], [-120, 0]);
  const fadeStart = holdFrames ?? Number.MAX_SAFE_INTEGER;
  const fade = interpolate(
    frame,
    [fadeStart - 0.4 * fps, fadeStart],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = interpolate(enter, [0, 1], [0, 1]) * fade;

  return (
    <AbsoluteFill
      style={{ justifyContent: "flex-start", alignItems: "center", padding: "150px 60px 0" }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${ty}px)`,
          maxWidth: 940,
          textAlign: "center",
          background: CREAM,
          color: INK,
          fontFamily: "'Baloo 2', 'Nunito', system-ui, sans-serif",
          fontWeight: 800,
          fontSize: text.length > 32 ? 56 : 68,
          lineHeight: 1.15,
          padding: "22px 40px",
          borderRadius: 32,
          border: `8px solid ${SUNNY}`,
          boxShadow: "0 14px 0 rgba(23,58,77,0.25), 0 10px 40px rgba(0,0,0,0.3)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ProgressBar — altta ilerleme çubuğu (klip boyunca 0→1). Oyun paleti.
// progress: 0..1
// ═══════════════════════════════════════════════════════════════════════════
export const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <AbsoluteFill
      style={{ justifyContent: "flex-end", alignItems: "center", padding: "0 0 90px" }}
    >
      <div
        style={{
          width: "78%",
          height: 22,
          background: "rgba(23,58,77,0.35)",
          borderRadius: 999,
          overflow: "hidden",
          border: `4px solid ${CREAM}`,
          boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            width: `${p * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${MINT} 0%, ${SUNNY} 100%)`,
            borderRadius: 999,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CtaCard — kapanış: oyun ikonu + "Conveyor Sort — Google Play" + link (+ opsiyonel QR)
// public/icon.png = oyun ikonu (gerekli). public/qr.png = store QR (opsiyonel).
// ═══════════════════════════════════════════════════════════════════════════
export const CtaCard: React.FC<{ showQr?: boolean }> = ({ showQr }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 100 },
    durationInFrames: 0.6 * fps,
  });
  const scale = interpolate(enter, [0, 1], [0.6, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const bounce = Math.sin(frame * 0.2) * 8;

  return (
    <AbsoluteFill style={{ background: STAGE_BG }}>
      <ConveyorBelt />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Img
            src={staticFile("icon.png")}
            style={{
              width: 300,
              height: 300,
              borderRadius: 72,
              boxShadow: "0 18px 0 rgba(23,58,77,0.25), 0 12px 50px rgba(0,0,0,0.35)",
            }}
          />
          <div
            style={{
              fontSize: 92,
              fontFamily: "'Baloo 2', 'Nunito', system-ui, sans-serif",
              fontWeight: 800,
              color: INK,
              marginTop: 40,
              letterSpacing: 1,
              textShadow: `0 3px 0 ${CREAM}`,
            }}
          >
            {APP.name}
          </div>

          {showQr && (
            <Img
              src={staticFile("qr.png")}
              style={{ width: 220, height: 220, borderRadius: 24, marginTop: 28, background: CREAM, padding: 10 }}
            />
          )}

          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: INK,
              backgroundColor: SUNNY,
              marginTop: 34,
              padding: "18px 48px",
              borderRadius: 999,
              letterSpacing: 1,
              boxShadow: "0 10px 0 rgba(23,58,77,0.2)",
            }}
          >
            ▶ {APP.storeName}'de indir
          </div>
          <div
            style={{
              fontSize: 34,
              color: INK,
              marginTop: 22,
              fontFamily: "'Nunito', system-ui, sans-serif",
              fontWeight: 700,
              transform: `translateY(${bounce}px)`,
            }}
          >
            👇 Ücretsiz oyna
          </div>

          {STORE_URL_IS_PLACEHOLDER && (
            <div
              style={{
                marginTop: 24,
                fontSize: 22,
                color: CORAL,
                fontWeight: 700,
                background: CREAM,
                padding: "6px 16px",
                borderRadius: 12,
              }}
            >
              ⚠️ appConfig.ts → PACKAGE_ID doldur
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// BgMusic — opsiyonel arka müzik (public/music.mp3). Klip kendi sesini korur;
// müzik varsayılan KISIK. manifest'te music:true ile açılır.
// ═══════════════════════════════════════════════════════════════════════════
export const BgMusic: React.FC<{ maxVolume?: number }> = ({
  maxVolume = 0.18,
}) => {
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <Audio
      src={staticFile("music.mp3")}
      volume={(f) =>
        interpolate(
          f,
          [0, Math.round(0.6 * fps), durationInFrames - Math.round(1 * fps), durationInFrames],
          [0, maxVolume, maxVolume, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      }
    />
  );
};
