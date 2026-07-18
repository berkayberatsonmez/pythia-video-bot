// ═══════════════════════════════════════════════════════════════════════════
// layout.ts — Sahne geometrisi + palet (conveyor_game.dart + components + theme.dart)
//
// Oyun ekranı çözünürlükten bağımsız (crossTime cinsinden hız). Video 1080×1920
// dikey. Tüm konum/boyutlar oyundaki oranlarla BİREBİR (belt %78, bins %45,
// dock %62, item 52px, bin 92×106, hazard %12 ...). GameReplay bunları kullanır.
// ═══════════════════════════════════════════════════════════════════════════

export const STAGE_W = 1080;
export const STAGE_H = 1920;

// ─── theme.dart renkleri ───────────────────────────────────────────────────
export const kSkyTop = "#A8D8EA";
export const kSkyBottom = "#D6EEF5";
export const kBeltBase = "#5D6D7E";
export const kBeltRoller = "#8A9AA9";
export const kShelf = "#8A9AA9";
export const kHazardYellow = "#F1C40F";
export const kHazardDark = "#2C3E50";
export const kTape = "#F7EFDC";
export const kInk = "#2C3E50";
export const kInkSoft = "#7A8B99";
export const kCoinGold = "#F39C12";
export const kHeart = "#E74C3C";
export const kCard = "#FFFFFF";

// ─── item_component.dart ───────────────────────────────────────────────────
export const ITEM = 52; // 52×52 paket
export const ITEM_RADIUS = 10;
export const TAPE_FRAC = 0.22; // dikey koli bandı genişliği

// ─── bin_component.dart ────────────────────────────────────────────────────
export const BIN_W = 92;
export const BIN_H = 106;
export const BIN_RADIUS = 10;
export const BIN_CAPACITY = 3;
export const ACTIVE_BINS = 3;

// ─── belt_component.dart ───────────────────────────────────────────────────
export const BELT_H = 88;
export const STRIPE_GAP = 48;
export const HAZARD_FRAC = 0.12; // bant sonu tehlike bölgesi genişliği

// ─── dock_component.dart ───────────────────────────────────────────────────
export const DOCK_SLOT = 64;
export const DOCK_SLOT_GAP = 16;

// ─── Yerleşim oranları (conveyor_game._buildLevel) ─────────────────────────
export const beltTop = STAGE_H * 0.78; // belt.position.y
export const beltCenterY = beltTop + BELT_H / 2; // paketlerin aktığı çizgi
export const binY = STAGE_H * 0.45; // kutu merkez y
export const dockY = STAGE_H * 0.62; // dock merkez y
export const shelfY = binY + BIN_H / 2 + 2;

/** Kutu slotunun merkez x'i (i = 0..2). spacing = W/(activeBins+1). */
export function binSlotX(i: number): number {
  const spacing = STAGE_W / (ACTIVE_BINS + 1);
  return spacing * (i + 1);
}

/** Dock slot merkezleri (dockSlots kadar), dock merkezi W/2. */
export function dockSlotCenters(slotCount: number): { x: number; y: number }[] {
  const width = slotCount * DOCK_SLOT + (slotCount + 1) * DOCK_SLOT_GAP;
  const left = STAGE_W / 2 - width / 2;
  const centers: { x: number; y: number }[] = [];
  for (let i = 0; i < slotCount; i++) {
    centers.push({
      x: left + DOCK_SLOT_GAP + DOCK_SLOT / 2 + i * (DOCK_SLOT + DOCK_SLOT_GAP),
      y: dockY,
    });
  }
  return centers;
}
export function dockBox(slotCount: number): { x: number; y: number; w: number; h: number } {
  const w = slotCount * DOCK_SLOT + (slotCount + 1) * DOCK_SLOT_GAP;
  const h = DOCK_SLOT + 2 * DOCK_SLOT_GAP;
  return { x: STAGE_W / 2 - w / 2, y: dockY - h / 2, w, h };
}

// ─── Bant hızı: item ekranı crossTime saniyede geçer (beltSpeed = W/crossTime) ──
export function beltSpeed(crossTime: number): number {
  return STAGE_W / crossTime;
}

/** Item spawn x = -ITEM; kaybolma eşiği x > W + ITEM/2. */
export const ITEM_SPAWN_X = -ITEM;
export const ITEM_LOST_X = STAGE_W + ITEM / 2;

// ─── HSL koyultma/açma (theme.dart darken/lighten) ─────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}
function hslToHex(h: number, s: number, l: number): string {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
/** theme.dart darken — HSL lightness × (1-amount). */
export function darken(hex: string, amount = 0.2): string {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  return hslToHex(h, s, Math.max(0, Math.min(1, l * (1 - amount))));
}
/** theme.dart lighten — l + (1-l)*amount. */
export function lighten(hex: string, amount = 0.25): string {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  return hslToHex(h, s, Math.max(0, Math.min(1, l + (1 - l) * amount)));
}
