// ═══════════════════════════════════════════════════════════════════════════
// GameScene.tsx — SimResult'ı belirli bir oyun-zamanında (gt, sn) kare kare çizer
//
// Oyunun görsel dili BİREBİR (theme.dart + components): gökyüzü gradyanı, gri
// bant + akan makara çizgileri + sarı-siyah tehlike şeridi, koli bantlı yuvarlak
// paketler + gölge, kapaklı kutular + sayaç + mühür animasyonu, açık raf dock, HUD.
// Saf görsel (Audio yok — onu GameAudio timeline'a koyar).
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import {
  STAGE_W,
  STAGE_H,
  kSkyTop,
  kSkyBottom,
  kBeltBase,
  kBeltRoller,
  kShelf,
  kHazardYellow,
  kHazardDark,
  kTape,
  kInk,
  kInkSoft,
  kCoinGold,
  kCard,
  ITEM,
  ITEM_RADIUS,
  TAPE_FRAC,
  BIN_W,
  BIN_H,
  BIN_RADIUS,
  BELT_H,
  STRIPE_GAP,
  HAZARD_FRAC,
  DOCK_SLOT,
  beltTop,
  shelfY,
  dockSlotCenters,
  dockBox,
  beltSpeed as beltSpeedFor,
  ITEM_SPAWN_X,
  beltCenterY,
  darken,
  lighten,
} from "./layout";
import { PALETTE } from "./levelConfig";
import { effElapsed, type SpeedProfile } from "./speedProfile";
import type { SimResult, ItemTrack, Seg, BoosterEvent } from "./botSim";

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ─── Bir paketin gt anındaki durumu ────────────────────────────────────────
type ItemVisual = { x: number; y: number; scale: number; opacity: number } | null;

function itemAt(track: ItemTrack, gt: number, profile: SpeedProfile): ItemVisual {
  if (gt < track.spawnT) return null;
  const beltXAt = (t: number) => ITEM_SPAWN_X + track.bs * effElapsed(profile, track.spawnT, t);
  let active: Seg | undefined;
  for (const s of track.segs) {
    if (gt >= s.t0 && gt < s.t1) {
      active = s;
      break;
    }
  }
  // segler bittiyse: son seg absorb/lost ise görünmez
  if (!active) {
    const last = track.segs[track.segs.length - 1];
    if (!last) return null;
    if (gt >= last.t1) {
      if (last.k === "absorb" || last.k === "lost") return null;
      if (last.k === "dockHold") {
        return { x: last.x, y: last.y, scale: 0.85, opacity: 1 };
      }
      // belt/drag/dockIn bittikten sonra bir sonraki segment yoksa (teorik) gizle
      return null;
    }
    return null;
  }

  switch (active.k) {
    case "belt": {
      return { x: beltXAt(gt), y: beltCenterY, scale: 1, opacity: 1 };
    }
    case "drag": {
      const p = easeInOut(clamp01((gt - active.t0) / (active.t1 - active.t0)));
      const lift = -18 * Math.sin(p * Math.PI); // hafif kaldırma yayı
      return {
        x: active.x0 + (active.x1 - active.x0) * p,
        y: active.y0 + (active.y1 - active.y0) * p + lift,
        scale: 1 + 0.12 * Math.sin(p * Math.PI),
        opacity: 1,
      };
    }
    case "absorb": {
      const p = clamp01((gt - active.t0) / (active.t1 - active.t0));
      return { x: active.x, y: active.y, scale: 1.12 - 0.82 * p, opacity: 1 - p };
    }
    case "dockIn": {
      const p = easeInOut(clamp01((gt - active.t0) / (active.t1 - active.t0)));
      return {
        x: active.x0 + (active.x1 - active.x0) * p,
        y: active.y0 + (active.y1 - active.y0) * p,
        scale: 1 - 0.15 * p,
        opacity: 1,
      };
    }
    case "dockHold":
      return { x: active.x, y: active.y, scale: 0.85, opacity: 1 };
    case "lost": {
      const p = clamp01((gt - active.t0) / (active.t1 - active.t0));
      return { x: beltXAt(gt), y: beltCenterY, scale: 1, opacity: 1 - p };
    }
  }
}

// ─── Paket görseli (koli) ──────────────────────────────────────────────────
const Package: React.FC<{ v: NonNullable<ItemVisual>; color: string }> = ({ v, color }) => {
  const tapeW = ITEM * TAPE_FRAC;
  return (
    <div
      style={{
        position: "absolute",
        left: v.x - ITEM / 2,
        top: v.y - ITEM / 2,
        width: ITEM,
        height: ITEM,
        transform: `scale(${v.scale})`,
        opacity: v.opacity,
      }}
    >
      {/* gölge */}
      <div style={{ position: "absolute", inset: 0, top: 3, background: darken(color, 0.2), borderRadius: ITEM_RADIUS }} />
      {/* gövde */}
      <div style={{ position: "absolute", inset: 0, background: color, borderRadius: ITEM_RADIUS, border: "1.5px solid rgba(255,255,255,0.5)" }} />
      {/* dikey koli bandı */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: (ITEM - tapeW) / 2, width: tapeW, background: kTape }} />
    </div>
  );
};

// ─── Kutu ──────────────────────────────────────────────────────────────────
const SEAL_DUR = 0.35;
const Bin: React.FC<{ x: number; y: number; color: string; filled: number; sealScale: number; sealOpacity: number }> = ({
  x,
  y,
  color,
  filled,
  sealScale,
  sealOpacity,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - BIN_W / 2,
      top: y - BIN_H / 2,
      width: BIN_W,
      height: BIN_H,
      transform: `scale(${sealScale})`,
      opacity: sealOpacity,
    }}
  >
    <div style={{ position: "absolute", inset: 0, top: 3, background: darken(color, 0.25), borderRadius: BIN_RADIUS }} />
    <div style={{ position: "absolute", inset: 0, background: color, borderRadius: BIN_RADIUS, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: BIN_H * 0.15, background: lighten(color, 0.25) }} />
    </div>
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 20,
        fontWeight: 700,
        fontFamily: "system-ui, sans-serif",
        textShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }}
    >
      {filled}/3
    </div>
  </div>
);

// ─── HUD kalp ───────────────────────────────────────────────────────────────
const Heart: React.FC<{ filled: boolean }> = ({ filled }) => (
  <div style={{ fontSize: 40, opacity: filled ? 1 : 0.25, filter: filled ? "none" : "grayscale(1)", lineHeight: 1 }}>❤️</div>
);

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── BoosterSave — Yavaşlat butonu basılışı + coin düşüşü + flash ───────────
const BoosterOverlay: React.FC<{ booster: BoosterEvent; gt: number }> = ({ booster, gt }) => {
  const { t, dur, coinBefore, coinCost } = booster;
  const dtb = gt - t; // basıştan bu yana
  // buton basış animasyonu (t civarı küçül→büyü)
  const press = dtb >= -0.15 && dtb < 0.35 ? 1 - 0.35 * Math.exp(-Math.pow((dtb - 0.05) * 8, 2)) : 1;
  const active = gt >= t && gt < t + dur; // yavaşlatma penceresi
  const coin = gt >= t ? coinBefore - coinCost : coinBefore;
  // -150 yükselen float (basıştan sonra 1sn)
  const floatP = dtb >= 0 && dtb < 1 ? dtb : -1;
  const flashP = dtb >= 0 && dtb < 0.7 ? 1 - dtb / 0.7 : 0;

  return (
    <>
      {/* yavaşlatma tint (hafif mavi) */}
      {active && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(52,152,219,0.10)", pointerEvents: "none" }} />
      )}
      {/* coin sayacı (üst-orta, HUD altına) */}
      <div style={{ position: "absolute", top: 190, right: 44, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 34 }}>🪙</div>
        <div style={{ color: kCoinGold, fontWeight: 800, fontSize: 36, fontFamily: "system-ui, sans-serif", textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{coin}</div>
        {floatP >= 0 && (
          <div style={{ position: "absolute", right: 0, top: -30 - floatP * 40, opacity: 1 - floatP, color: "#E74C3C", fontWeight: 800, fontSize: 32 }}>
            −{coinCost}
          </div>
        )}
      </div>
      {/* YAVAŞLAT flash */}
      {flashP > 0 && (
        <div style={{ position: "absolute", top: STAGE_H * 0.34, left: 0, right: 0, textAlign: "center", opacity: flashP }}>
          <span style={{ display: "inline-block", background: "#3498DB", color: "#fff", fontWeight: 900, fontSize: 60, padding: "14px 44px", borderRadius: 26, fontFamily: "system-ui, sans-serif", transform: `scale(${1 + flashP * 0.15})`, boxShadow: "0 8px 26px rgba(0,0,0,0.3)" }}>
            ⏳ YAVAŞLAT!
          </span>
        </div>
      )}
      {/* booster butonu (sağ-alt) */}
      <div style={{ position: "absolute", bottom: 150, right: 60, transform: `scale(${press})` }}>
        <div style={{ width: 110, height: 110, borderRadius: 55, background: active ? "#3498DB" : "#FFFFFF", border: `5px solid #3498DB`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, boxShadow: "0 8px 0 rgba(23,58,77,0.2)" }}>
          ⏳
        </div>
      </div>
    </>
  );
};

export const GameScene: React.FC<{ sim: SimResult; gt: number; label: string; showTimer: boolean }> = ({
  sim,
  gt,
  label,
  showTimer,
}) => {
  const cfg = sim.config;
  const bs = beltSpeedFor(cfg.crossTime);
  // Bant şeritleri profilli mesafeyle akar (booster yavaşlatmasında görsel olarak yavaşlar).
  const beltDist = bs * effElapsed(sim.speedProfile, 0, gt);
  const stripeOffset = ((beltDist % STRIPE_GAP) + STRIPE_GAP) % STRIPE_GAP;
  const dockCenters = dockSlotCenters(cfg.dockSlots);
  const db = cfg.dockSlots > 0 ? dockBox(cfg.dockSlots) : null;

  // dinamik HUD değerleri
  const livesLost = sim.audio.filter((a) => a.sfx === "lost" && a.t <= gt).length;
  const failThreshold = cfg.maxLost;
  const sealedNow = sim.bins.filter((b) => b.sealStartT != null && b.sealStartT <= gt).length;
  const totalBoxes = Math.round(sim.sequence.length / 3);
  const won = gt >= sim.finishTimeSec;

  return (
    <div style={{ position: "absolute", width: STAGE_W, height: STAGE_H, overflow: "hidden" }}>
      {/* Gökyüzü */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${kSkyTop} 0%, ${kSkyBottom} 100%)` }} />

      {/* Kutu rafı */}
      <div style={{ position: "absolute", left: 0, top: shelfY, width: STAGE_W, height: 6, background: kShelf }} />

      {/* Dock */}
      {db && (
        <div style={{ position: "absolute", left: db.x, top: db.y, width: db.w, height: db.h, background: "rgba(255,255,255,0.55)", borderRadius: 12, border: `2px solid ${kInkSoft}99` }}>
          {dockCenters.map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c.x - db.x - DOCK_SLOT / 2,
                top: db.h / 2 - DOCK_SLOT / 2,
                width: DOCK_SLOT,
                height: DOCK_SLOT,
                borderRadius: 8,
                border: `2px solid ${kInkSoft}73`,
              }}
            />
          ))}
        </div>
      )}

      {/* Kutular (her slot için o an aktif binLife) */}
      {[0, 1, 2].map((slot) => {
        const life = sim.bins
          .filter((b) => b.slot === slot && b.openT <= gt && gt < b.closeT)
          .sort((a, b) => b.openT - a.openT)[0];
        if (!life) return null;
        const filled = life.fills.filter((t) => t <= gt).length;
        let sealScale = 1;
        let sealOpacity = 1;
        if (life.sealStartT != null && gt >= life.sealStartT) {
          const p = clamp01((gt - life.sealStartT) / SEAL_DUR);
          // büyü (0..0.43) sonra küçül (0.43..1)
          if (p < 0.43) sealScale = 1 + 0.2 * (p / 0.43);
          else sealScale = 1.2 * (1 - (p - 0.43) / 0.57);
          sealOpacity = p < 0.43 ? 1 : 1 - (p - 0.43) / 0.57;
        }
        return <Bin key={slot} x={life.x} y={life.y} color={PALETTE[life.color]} filled={filled} sealScale={sealScale} sealOpacity={sealOpacity} />;
      })}

      {/* Bant */}
      <div style={{ position: "absolute", left: 0, top: beltTop, width: STAGE_W, height: BELT_H, background: kBeltBase, borderRadius: 8, overflow: "hidden" }}>
        {/* akan makara çizgileri (dikey) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `repeating-linear-gradient(90deg, ${kBeltRoller} 0px, ${kBeltRoller} 5px, transparent 5px, transparent ${STRIPE_GAP}px)`,
            backgroundPositionX: `${stripeOffset}px`,
          }}
        />
        {/* tehlike bölgesi (sağ %12) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: STAGE_W * HAZARD_FRAC,
            backgroundColor: kHazardYellow,
            backgroundImage: `repeating-linear-gradient(45deg, ${kHazardDark} 0px, ${kHazardDark} 9px, ${kHazardYellow} 9px, ${kHazardYellow} 22px)`,
          }}
        />
      </div>

      {/* Paketler */}
      {sim.tracks.map((track) => {
        const v = itemAt(track, gt, sim.speedProfile);
        if (!v) return null;
        return <Package key={track.id} v={v} color={PALETTE[track.color]} />;
      })}

      {/* BoosterSave — Yavaşlat booster butonu + coin düşüşü + flash */}
      {sim.booster && <BoosterOverlay booster={sim.booster} gt={gt} />}

      {/* HUD üst bar */}
      <div style={{ position: "absolute", top: 60, left: 40, right: 40, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <Heart key={i} filled={i < failThreshold - livesLost} />
          ))}
        </div>
        <div style={{ background: kCard, borderRadius: 18, padding: "10px 22px", color: kInk, fontWeight: 800, fontSize: 34, fontFamily: "system-ui, sans-serif", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
          {label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 34 }}>📦</div>
          <div style={{ color: kInk, fontWeight: 800, fontSize: 34, fontFamily: "system-ui, sans-serif" }}>
            {sealedNow}/{totalBoxes}
          </div>
        </div>
      </div>

      {showTimer && (
        <div style={{ position: "absolute", top: 128, left: 0, right: 0, textAlign: "center", color: kInk, fontWeight: 800, fontSize: 56, fontFamily: "system-ui, sans-serif", textShadow: "0 2px 8px rgba(255,255,255,0.6)" }}>
          ⏱ {fmtTime(Math.min(gt, sim.finishTimeSec))}
        </div>
      )}

      {won && (
        <div style={{ position: "absolute", top: STAGE_H * 0.3, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ display: "inline-block", background: kCoinGold, color: "#fff", fontWeight: 900, fontSize: 64, padding: "18px 54px", borderRadius: 30, fontFamily: "system-ui, sans-serif", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", transform: `scale(${1 + 0.05 * Math.sin((gt - sim.finishTimeSec) * 6)})` }}>
            ✅ TAMAMLANDI
          </div>
        </div>
      )}
    </div>
  );
};
