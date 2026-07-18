// ═══════════════════════════════════════════════════════════════════════════
// hookProgress.tsx — Oyun üstü pazarlama çerçevesi: hook bandı + alt progress bar
// (GameReplay ve SealCompilation ortak; HUD'un altına, kutuların üstüne oturur)
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CREAM, INK, SUNNY } from "../components/gameStyle";

export const GameHookBanner: React.FC<{ text: string; holdFrames: number }> = ({ text, holdFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 }, durationInFrames: 0.5 * fps });
  const ty = interpolate(enter, [0, 1], [-60, 0]);
  const fade = interpolate(frame, [holdFrames - 0.4 * fps, holdFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]) * fade;
  return (
    <div style={{ position: "absolute", top: 210, left: 60, right: 60, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          opacity,
          transform: `translateY(${ty}px)`,
          maxWidth: 940,
          textAlign: "center",
          background: CREAM,
          color: INK,
          fontFamily: "'Baloo 2','Nunito',system-ui,sans-serif",
          fontWeight: 800,
          fontSize: text.length > 30 ? 52 : 62,
          lineHeight: 1.15,
          padding: "20px 38px",
          borderRadius: 30,
          border: `8px solid ${SUNNY}`,
          boxShadow: "0 12px 0 rgba(23,58,77,0.22), 0 8px 34px rgba(0,0,0,0.28)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const GameProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const p = total > 0 ? Math.max(0, Math.min(1, frame / total)) : 0;
  return (
    <div style={{ position: "absolute", bottom: 70, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "82%", height: 20, background: "rgba(23,58,77,0.3)", borderRadius: 999, overflow: "hidden", border: `4px solid ${CREAM}` }}>
        <div style={{ width: `${p * 100}%`, height: "100%", background: `linear-gradient(90deg,#4ECDC4,${SUNNY})`, borderRadius: 999 }} />
      </div>
    </div>
  );
};

export const GameReplayHookProgress: React.FC<{ hook: string; total: number }> = ({ hook, total }) => (
  <>
    <GameHookBanner text={hook} holdFrames={total} />
    <GameProgressBar total={total} />
  </>
);
