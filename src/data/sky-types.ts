// Gök Gündemi kartı — Remotion prop'u (JSON-serileştirilebilir; scripts/sky-events.ts üretir).
export type SkyKind =
  | "retro-pre"
  | "retro-start"
  | "retro-mid"
  | "retro-end"
  | "full-moon"
  | "new-moon"
  | "lunar-eclipse"
  | "solar-eclipse";

export type SkyAccent = "retro" | "direct" | "full" | "new" | "eclipse";

export type SkyCard = {
  id: string;
  kind: SkyKind;
  body: string; // mercury | venus | mars | jupiter | saturn | moon | sun
  accent: SkyAccent;
  headline: string[]; // 2 satır, kanca (0. karede tam görünür)
  sub: string;
  dateLabel: string; // "24 EKİM"
  hookLine: string; // headline + " · " + dateLabel (kapak / dedup)
  signId: string;
  signName: string;
  theme: { title: string; desc: string };
  affected: { signId: string; signName: string; line: string }[]; // 3
  tip: string;
  question: string;
  planetName: string;
  hashtags: string[]; // IG: 5
};
