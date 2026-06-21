import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { HelloWorld } from "./Composition";
import { TarotReveal } from "./TarotReveal";
import { DreamReveal } from "./DreamReveal";
import { SnakeDream } from "./SnakeDream";
import { TeethDream } from "./TeethDream";
import { DreamSymbolVideo } from "./DreamSymbolVideo";
import { DREAM_SYMBOLS, getSymbolById } from "./data/dream-symbols";
import { TarotVideo } from "./TarotVideo";
import { TAROT_CARDS, getTarotById } from "./data/tarot-cards";
import { NumberVideo } from "./NumberVideo";
import { NUMBERS, getNumberById } from "./data/numbers";
import { ZodiacVideo } from "./ZodiacVideo";
import { ZODIAC_SIGNS, getZodiacById } from "./data/zodiac-signs";
import { ManifestVideo } from "./ManifestVideo";
import { MANIFESTATIONS, getManifestById } from "./data/manifestation";
import { voiceoverTotalFrames, type Voiceover } from "./components/voiceover";
import { RankingVideo } from "./RankingVideo";
import { ZODIAC_RANKINGS, getRankingById } from "./data/zodiac-rankings";
import { BehaviorVideo } from "./BehaviorVideo";
import { ZODIAC_BEHAVIORS, getBehaviorById } from "./data/zodiac-behaviors";
import { CompatibilityVideo } from "./CompatibilityVideo";
import { ZODIAC_COMPATIBILITY, getCompatibilityById } from "./data/zodiac-compatibility";

// ─── Wrapper — symbolId → full symbol lookup ────────────────────────────
const DreamSymbolWrapper: React.FC<{
  symbolId: string;
  voiceover?: Voiceover;
}> = ({ symbolId, voiceover }) => {
  const symbol = getSymbolById(symbolId) ?? DREAM_SYMBOLS[0];
  return <DreamSymbolVideo symbol={symbol} voiceover={voiceover} />;
};

// ─── Wrapper — tarot cardId → full card lookup ──────────────────────────
const TarotWrapper: React.FC<{ cardId: string; voiceover?: Voiceover }> = ({
  cardId,
  voiceover,
}) => {
  const card = getTarotById(cardId) ?? TAROT_CARDS[0];
  return <TarotVideo card={card} voiceover={voiceover} />;
};

// ─── Wrapper — number id → full content lookup ──────────────────────────
const NumberWrapper: React.FC<{ numberId: string; voiceover?: Voiceover }> = ({
  numberId,
  voiceover,
}) => {
  const content = getNumberById(numberId) ?? NUMBERS[0];
  return <NumberVideo content={content} voiceover={voiceover} />;
};

// ─── Wrapper — zodiac id → full sign lookup ─────────────────────────────
const ZodiacWrapper: React.FC<{ signId: string; voiceover?: Voiceover }> = ({
  signId,
  voiceover,
}) => {
  const sign = getZodiacById(signId) ?? ZODIAC_SIGNS[0];
  return <ZodiacVideo sign={sign} voiceover={voiceover} />;
};

// ─── Wrapper — manifest id → full content lookup ────────────────────────
const ManifestWrapper: React.FC<{
  manifestId: string;
  voiceover?: Voiceover;
}> = ({ manifestId, voiceover }) => {
  const content = getManifestById(manifestId) ?? MANIFESTATIONS[0];
  return <ManifestVideo content={content} voiceover={voiceover} />;
};

// ─── Wrapper — ranking id → full sıralama lookup ────────────────────────
const RankingWrapper: React.FC<{
  rankingId: string;
  voiceover?: Voiceover;
}> = ({ rankingId, voiceover }) => {
  const ranking = getRankingById(rankingId) ?? ZODIAC_RANKINGS[0];
  return <RankingVideo ranking={ranking} voiceover={voiceover} />;
};

// ─── Wrapper — behavior id → full senaryo lookup ────────────────────────
const BehaviorWrapper: React.FC<{
  behaviorId: string;
  voiceover?: Voiceover;
}> = ({ behaviorId, voiceover }) => {
  const behavior = getBehaviorById(behaviorId) ?? ZODIAC_BEHAVIORS[0];
  return <BehaviorVideo behavior={behavior} voiceover={voiceover} />;
};

// ─── Wrapper — compat id → full uyum lookup ─────────────────────────────
const CompatibilityWrapper: React.FC<{
  compatId: string;
  voiceover?: Voiceover;
}> = ({ compatId, voiceover }) => {
  const compat = getCompatibilityById(compatId) ?? ZODIAC_COMPATIBILITY[0];
  return <CompatibilityVideo compat={compat} voiceover={voiceover} />;
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ═══ RÜYA — 10 sembol ═══════════════════════════════════════ */}
      {/* Render: npx remotion render src/index.ts DreamSymbolVideo \
                  out/v.mp4 --props='{"symbolId":"snake"}'                */}
      <Composition
        id="DreamSymbolVideo"
        component={DreamSymbolWrapper}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ symbolId: "snake" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.voiceover
            ? voiceoverTotalFrames(props.voiceover, 30)
            : 15 * 30,
        })}
      />

      {/* ═══ TAROT — 22 Major Arcana ════════════════════════════════ */}
      {/* Render: npx remotion render src/index.ts TarotVideo \
                  out/v.mp4 --props='{"cardId":"star"}'                   */}
      <Composition
        id="TarotVideo"
        component={TarotWrapper}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ cardId: "star" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.voiceover
            ? voiceoverTotalFrames(props.voiceover, 30)
            : 15 * 30,
        })}
      />

      {/* ═══ NUMEROLOJİ + MELEK SAYILARI — 21 sayı ══════════════════ */}
      {/* Render: npx remotion render src/index.ts NumberVideo \
                  out/v.mp4 --props='{"numberId":"a111"}'                 */}
      <Composition
        id="NumberVideo"
        component={NumberWrapper}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ numberId: "a111" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.voiceover
            ? voiceoverTotalFrames(props.voiceover, 30)
            : 15 * 30,
        })}
      />

      {/* ═══ BURÇ — 12 burç (gizli yüz) ═════════════════════════════ */}
      {/* Render: npm run video -- zodiac scorpio                       */}
      <Composition
        id="ZodiacVideo"
        component={ZodiacWrapper}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ signId: "scorpio" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.voiceover
            ? voiceoverTotalFrames(props.voiceover, 30)
            : 15 * 30,
        })}
      />

      {/* ═══ MANİFEST — 12 teknik + ay fazları ══════════════════════ */}
      {/* Render: npm run video -- manifest m369                         */}
      <Composition
        id="ManifestVideo"
        component={ManifestWrapper}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ manifestId: "confidence" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.voiceover
            ? voiceoverTotalFrames(props.voiceover, 30)
            : 15 * 30,
        })}
      />

      {/* ═══ SIRALAMA — viral Top-3 burç ════════════════════════════ */}
      <Composition
        id="RankingVideo"
        component={RankingWrapper}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ rankingId: "yalanci" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.voiceover
            ? voiceoverTotalFrames(props.voiceover, 30)
            : 15 * 30,
        })}
      />

      {/* ═══ DAVRANIŞ — viral burç senaryosu ════════════════════════ */}
      <Composition
        id="BehaviorVideo"
        component={BehaviorWrapper}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ behaviorId: "akrep-silince" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.voiceover
            ? voiceoverTotalFrames(props.voiceover, 30)
            : 15 * 30,
        })}
      />

      {/* ═══ UYUM — viral burç çifti ════════════════════════════════ */}
      <Composition
        id="CompatibilityVideo"
        component={CompatibilityWrapper}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ compatId: "akrep-boga" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.voiceover
            ? voiceoverTotalFrames(props.voiceover, 30)
            : 15 * 30,
        })}
      />

      {/* ═══ Eski (specific) compositions — referans için ═══════════ */}
      <Composition
        id="TeethDream"
        component={TeethDream}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SnakeDream"
        component={SnakeDream}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="DreamReveal"
        component={DreamReveal}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TarotReveal"
        component={TarotReveal}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={90}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
