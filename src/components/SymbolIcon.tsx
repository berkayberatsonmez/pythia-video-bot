import React from "react";
import type { IconType } from "../data/dream-symbols";

const GOLD = "#D4A843";

type Props = {
  type: IconType;
  size?: number;
};

// ═══════════════════════════════════════════════════════════════════════════
// SVG Icons — her sembol için ayrı tasarım
// Hepsi: viewBox 100x100, altın stroke, mistik vibe
// ═══════════════════════════════════════════════════════════════════════════

const Snake: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
       stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M50 12 C35 12, 22 22, 22 38 C22 50, 35 55, 50 55 C65 55, 78 50, 78 62 C78 75, 65 82, 50 82 C40 82, 32 78, 28 72" />
    <ellipse cx="50" cy="12" rx="9" ry="6" fill={GOLD} stroke="none" />
    <circle cx="53" cy="11" r="1.5" fill="#09071A" />
    <path d="M58 12 L64 10 M58 12 L64 14" strokeWidth="2" />
    <path d="M28 72 L24 78 L20 75" strokeWidth="3" />
  </svg>
);

const Tooth: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="#F8F0DA"
       stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round">
    <path d="M30 18 C25 18, 20 22, 20 30 L20 50 C20 55, 22 60, 25 65 L28 78 C28 84, 32 86, 35 82 L37 70 C38 65, 42 65, 43 70 L46 82 C49 86, 53 84, 53 78 L56 65 C59 60, 62 55, 62 50 L62 42 C62 36, 68 32, 70 28 C72 22, 70 18, 65 18 Z" />
    <path d="M30 24 C28 26, 26 30, 26 35" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
    <path d="M40 30 L42 50" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.5" />
  </svg>
);

const Water: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="#9ec5ff"
       stroke={GOLD} strokeWidth="2.5">
    <path d="M50 12 C50 12, 78 42, 78 60 A28 28 0 0 1 22 60 C22 42, 50 12, 50 12 Z" />
    <ellipse cx="38" cy="58" rx="5" ry="8" fill="rgba(255,255,255,0.55)" stroke="none" />
    <path d="M42 70 Q50 75, 58 70" fill="none" strokeWidth="2" opacity="0.7" />
  </svg>
);

const Fire: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="#ff6b35"
       stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round">
    <path d="M50 88 C30 88, 22 70, 28 56 C32 46, 40 42, 38 32 C36 22, 44 14, 50 10 C52 22, 60 22, 62 36 C64 46, 70 50, 72 60 C74 76, 64 88, 50 88 Z" />
    <path d="M50 78 C42 78, 38 70, 42 62 C45 56, 50 52, 50 44 C52 52, 58 56, 58 64 C58 72, 54 78, 50 78 Z" fill="#ffb84d" stroke="none" />
  </svg>
);

const Spider: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="#2a1845"
       stroke={GOLD} strokeWidth="2.5" strokeLinecap="round">
    {/* Body */}
    <ellipse cx="50" cy="55" rx="14" ry="18" fill={GOLD} />
    <ellipse cx="50" cy="42" rx="9" ry="8" fill={GOLD} />
    {/* Eyes */}
    <circle cx="47" cy="40" r="1.5" fill="#09071A" />
    <circle cx="53" cy="40" r="1.5" fill="#09071A" />
    {/* Legs */}
    <path d="M40 50 L20 35 M40 55 L18 50 M40 60 L18 70 M40 65 L22 82" strokeWidth="3" />
    <path d="M60 50 L80 35 M60 55 L82 50 M60 60 L82 70 M60 65 L78 82" strokeWidth="3" />
    {/* Web hint */}
    <path d="M50 20 L50 32" strokeWidth="1.5" opacity="0.5" />
  </svg>
);

const Falling: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
       stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {/* Figure falling */}
    <circle cx="50" cy="22" r="7" fill={GOLD} />
    <path d="M50 30 L50 55 M40 35 L60 45 M50 55 L42 75 M50 55 L58 75" />
    {/* Motion lines */}
    <path d="M30 15 L35 25 M70 15 L65 25 M25 30 L32 40 M75 30 L68 40" strokeWidth="2" opacity="0.6" />
    {/* Ground below */}
    <path d="M15 88 L85 88" strokeWidth="2" opacity="0.4" />
  </svg>
);

const Flying: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
       stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {/* Wings */}
    <path d="M50 50 Q30 40, 15 50 Q25 55, 50 55 Z" fill={GOLD} />
    <path d="M50 50 Q70 40, 85 50 Q75 55, 50 55 Z" fill={GOLD} />
    {/* Body */}
    <circle cx="50" cy="35" r="6" fill={GOLD} />
    <path d="M50 41 L50 60 M50 60 L45 72 M50 60 L55 72" />
    {/* Wind lines */}
    <path d="M20 25 Q35 28, 50 25 M50 25 Q65 28, 80 25" opacity="0.4" />
    <path d="M15 80 L25 80 M75 80 L85 80" opacity="0.3" />
  </svg>
);

const Dead: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="#F8F0DA"
       stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round">
    {/* Skull */}
    <path d="M30 35 C30 22, 40 14, 50 14 C60 14, 70 22, 70 35 L70 50 C70 56, 66 60, 62 60 L60 70 L56 65 L52 70 L48 65 L44 70 L40 65 L38 60 C34 60, 30 56, 30 50 Z" />
    {/* Eye sockets */}
    <ellipse cx="42" cy="38" rx="5" ry="6" fill="#09071A" stroke="none" />
    <ellipse cx="58" cy="38" rx="5" ry="6" fill="#09071A" stroke="none" />
    {/* Nose */}
    <path d="M50 45 L46 52 L50 54 L54 52 Z" fill="#09071A" stroke="none" />
    {/* Teeth */}
    <path d="M40 60 L42 56 L44 60 L46 56 L48 60 L50 56 L52 60 L54 56 L56 60 L58 56 L60 60" strokeWidth="1.5" />
  </svg>
);

const Key: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
       stroke={GOLD} strokeWidth="3.5" strokeLinejoin="round">
    {/* Key head */}
    <circle cx="32" cy="50" r="16" fill={GOLD} />
    <circle cx="32" cy="50" r="7" fill="#09071A" stroke="none" />
    {/* Shaft */}
    <path d="M48 50 L82 50" strokeLinecap="round" />
    {/* Teeth */}
    <path d="M70 50 L70 62 M78 50 L78 58" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Eye: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
       stroke={GOLD} strokeWidth="3" strokeLinejoin="round">
    {/* Outer eye shape */}
    <path d="M10 50 Q50 18, 90 50 Q50 82, 10 50 Z" fill="#1a0a2e" />
    {/* Iris */}
    <circle cx="50" cy="50" r="16" fill={GOLD} />
    {/* Pupil */}
    <circle cx="50" cy="50" r="7" fill="#09071A" />
    {/* Highlight */}
    <circle cx="46" cy="46" r="2.5" fill="#ffffff" />
    {/* Eyelash hints */}
    <path d="M22 30 L24 35 M50 22 L50 28 M78 30 L76 35" strokeWidth="2" opacity="0.6" />
  </svg>
);

// ─── Yeni semboller (batch 2) ────────────────────────────────────────────

const Baby: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="#F8F0DA"
       stroke={GOLD} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    <circle cx="50" cy="52" r="30" />
    <circle cx="42" cy="50" r="2.5" fill="#09071A" stroke="none" />
    <circle cx="58" cy="50" r="2.5" fill="#09071A" stroke="none" />
    <path d="M43 62 Q50 67 57 62" fill="none" strokeWidth="2.5" stroke="#09071A" />
    <path d="M38 26 Q50 18 52 30" fill="none" stroke={GOLD} strokeWidth="3" />
  </svg>
);

const BrokenHeart: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill={GOLD}
       stroke="#09071A" strokeWidth="2" strokeLinejoin="round">
    <path d="M50 82 C18 58 22 28 42 28 C49 28 50 36 50 41 C50 36 51 28 58 28 C78 28 82 58 50 82 Z" stroke="none" />
    <path d="M50 41 L44 53 L55 61 L47 74" fill="none" stroke="#09071A" strokeWidth="2.5" />
  </svg>
);

const Dog: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill={GOLD}
       stroke={GOLD} strokeWidth="2" strokeLinejoin="round">
    <path d="M28 40 Q20 32 24 56 Q28 60 34 50 Z" />
    <path d="M72 40 Q80 32 76 56 Q72 60 66 50 Z" />
    <ellipse cx="50" cy="54" rx="24" ry="22" />
    <circle cx="42" cy="50" r="3" fill="#09071A" stroke="none" />
    <circle cx="58" cy="50" r="3" fill="#09071A" stroke="none" />
    <ellipse cx="50" cy="62" rx="5" ry="4" fill="#09071A" stroke="none" />
    <path d="M50 66 L50 72 M50 72 Q44 74 42 70 M50 72 Q56 74 58 70" fill="none" stroke="#09071A" strokeWidth="2" />
  </svg>
);

const Cat: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill={GOLD}
       stroke={GOLD} strokeWidth="2" strokeLinejoin="round">
    <path d="M30 44 L26 26 L44 38 Z" />
    <path d="M70 44 L74 26 L56 38 Z" />
    <ellipse cx="50" cy="56" rx="24" ry="22" />
    <circle cx="42" cy="52" r="3" fill="#09071A" stroke="none" />
    <circle cx="58" cy="52" r="3" fill="#09071A" stroke="none" />
    <path d="M50 60 L47 64 L53 64 Z" fill="#09071A" stroke="none" />
    <path d="M28 56 L40 58 M28 62 L40 62 M72 56 L60 58 M72 62 L60 62" fill="none" stroke="#09071A" strokeWidth="1.5" />
  </svg>
);

const Blood: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="#C0392B"
       stroke={GOLD} strokeWidth="2.5">
    <path d="M50 14 C50 14, 78 46, 78 64 A28 28 0 0 1 22 64 C22 46, 50 14, 50 14 Z" />
    <ellipse cx="38" cy="62" rx="5" ry="8" fill="rgba(255,255,255,0.5)" stroke="none" />
  </svg>
);

const Money: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
       stroke={GOLD} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
    <circle cx="50" cy="50" r="32" fill="rgba(212,168,67,0.15)" />
    <circle cx="50" cy="50" r="32" />
    {/* ₺ — dik gövde + 2 çapraz çizgi */}
    <path d="M48 32 L43 70" strokeWidth="4" />
    <path d="M37 44 L60 37" strokeWidth="4" />
    <path d="M36 55 L59 48" strokeWidth="4" />
  </svg>
);

const Wedding: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
       stroke={GOLD} strokeWidth="4">
    <circle cx="40" cy="56" r="20" />
    <circle cx="62" cy="56" r="20" />
    <path d="M34 30 L40 38 L46 30 L40 24 Z" fill={GOLD} stroke="none" />
  </svg>
);

const Car: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
       stroke={GOLD} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    <path d="M16 62 L20 62 L26 46 Q28 42 34 42 L66 42 Q72 42 74 46 L80 62 L84 62" />
    <path d="M16 62 L16 70 L84 70 L84 62 Z" fill="rgba(212,168,67,0.12)" />
    <path d="M32 42 L36 30 L60 30 L66 42" />
    <circle cx="32" cy="70" r="7" fill="#09071A" />
    <circle cx="68" cy="70" r="7" fill="#09071A" />
  </svg>
);

const House: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
       stroke={GOLD} strokeWidth="3.5" strokeLinejoin="round">
    <path d="M50 18 L82 46 L74 46 L74 80 L26 80 L26 46 L18 46 Z" fill="rgba(212,168,67,0.12)" />
    <path d="M44 80 L44 60 L56 60 L56 80" />
    <rect x="34" y="50" width="10" height="10" />
  </svg>
);

const Hair: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
       stroke={GOLD} strokeWidth="3.5" strokeLinecap="round">
    <path d="M34 20 Q26 45 32 70 Q34 80 38 84" />
    <path d="M44 18 Q38 45 42 72 Q44 82 48 86" />
    <path d="M56 18 Q62 45 58 72 Q56 82 52 86" />
    <path d="M66 20 Q74 45 68 70 Q66 80 62 84" />
  </svg>
);

const Lost: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
       stroke={GOLD} strokeWidth="3.5" strokeLinejoin="round">
    <path d="M50 84 C50 84, 26 56, 26 40 A24 24 0 0 1 74 40 C74 56, 50 84, 50 84 Z" fill="rgba(212,168,67,0.12)" />
    {/* ? işareti */}
    <path d="M42 34 Q42 26 50 26 Q58 26 58 34 Q58 40 50 42 L50 46" strokeWidth="3.5" />
    <circle cx="50" cy="54" r="2" fill={GOLD} stroke="none" />
  </svg>
);

const Crying: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="#F8F0DA"
       stroke={GOLD} strokeWidth="3" strokeLinejoin="round">
    <circle cx="50" cy="50" r="30" />
    <path d="M40 46 Q42 50 44 46 M56 46 Q58 50 60 46" fill="none" stroke="#09071A" strokeWidth="2.5" />
    <path d="M42 64 Q50 58 58 64" fill="none" stroke="#09071A" strokeWidth="2.5" />
    <path d="M40 52 Q38 62 40 66 Q43 68 44 64 Q44 58 40 52 Z" fill="#9ec5ff" stroke="#60a5fa" strokeWidth="1.5" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// Main component — type'a göre doğru ikonu seçer
// ═══════════════════════════════════════════════════════════════════════════

export const SymbolIcon: React.FC<Props> = ({ type, size = 340 }) => {
  switch (type) {
    case "snake":
      return <Snake size={size} />;
    case "tooth":
      return <Tooth size={size} />;
    case "water":
      return <Water size={size} />;
    case "fire":
      return <Fire size={size} />;
    case "spider":
      return <Spider size={size} />;
    case "falling":
      return <Falling size={size} />;
    case "flying":
      return <Flying size={size} />;
    case "dead":
      return <Dead size={size} />;
    case "key":
      return <Key size={size} />;
    case "eye":
      return <Eye size={size} />;
    case "baby":
      return <Baby size={size} />;
    case "broken-heart":
      return <BrokenHeart size={size} />;
    case "dog":
      return <Dog size={size} />;
    case "cat":
      return <Cat size={size} />;
    case "blood":
      return <Blood size={size} />;
    case "money":
      return <Money size={size} />;
    case "wedding":
      return <Wedding size={size} />;
    case "car":
      return <Car size={size} />;
    case "house":
      return <House size={size} />;
    case "hair":
      return <Hair size={size} />;
    case "lost":
      return <Lost size={size} />;
    case "crying":
      return <Crying size={size} />;
    default:
      return <Snake size={size} />;
  }
};
