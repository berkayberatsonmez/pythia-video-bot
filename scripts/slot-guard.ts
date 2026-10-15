// ─── Slot koruması — bir IG slotu günde EN ÇOK BİR kez yayınlanır ──────────
//
// Neden (2026-10-13): IG slotunu iki yol tetikliyor — cron-job.org dispatch
// (asıl, dakik) ve GitHub cron (yedek, bu repoda 4-8 saat gecikiyor). Eski
// koruma yalnız "aynı kanca son 20 saatte paylaşıldı mı" diye bakıyordu.
// 13 Eki'de sabah dispatch'i 10:07'de ESKİ kodla bir video attı; araya yeni
// rotasyon (#6/#10) girdi; 7,5 saat geciken sabah yedeği 17:33'te YENİ kodla
// aynı slot için BAŞKA bir video seçti. Kanca farklı → koruma geçti → sabah
// slotu iki kez yayınlandı. Ayrıca gece yarısını (TR) geçen akşam yedeği
// ertesi günün akşam videosunu sabaha karşı atabiliyordu (13 Eki 00:32 UTC).
//
// Kural: koruma videonun KİMLİĞİNE değil SLOTA bakar.
//   - Bugün (İstanbul günü) IG'de zaten yayınlanmış gönderi sayısı:
//       sabah slotu: 0 olmalı;  akşam slotu: en çok 1 olmalı.
//   - Yedek (GitHub cron) kendi gününü geçtiyse hiç yayınlamaz: cron'un
//     UTC saati şimdiki UTC saatinden büyükse tetik dünkü cron'dur.
// Saf fonksiyon: saat ve gönderi zaman damgaları dışarıdan.

export type Slot = "morning" | "evening";

/** Slotun GitHub cron saati (UTC) — daily-video.yml ile aynı. */
export const BACKUP_CRON_HOUR_UTC: Record<Slot, number> = { morning: 10, evening: 18 };

const IST_OFFSET_MS = 3 * 3600 * 1000; // TR = UTC+3, DST yok

export function istanbulDate(ms: number): string {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function postsOnIstanbulDay(timestamps: string[], nowMs: number): number {
  const today = istanbulDate(nowMs);
  return timestamps.filter((t) => {
    const ms = Date.parse(t);
    return Number.isFinite(ms) && istanbulDate(ms) === today;
  }).length;
}

export interface GuardInput {
  slot: Slot;
  nowMs: number;
  /** IG'deki son gönderilerin zaman damgaları; null = okunamadı. */
  postTimestamps: string[] | null;
  /** GitHub cron yedeği mi (dispatch değil)? */
  backup: boolean;
}

/** null → yayınla; string → atla (sebep). */
export function slotSkipReason(i: GuardInput): string | null {
  if (i.backup) {
    const hourUtc = new Date(i.nowMs).getUTCHours();
    if (hourUtc < BACKUP_CRON_HOUR_UTC[i.slot]) {
      return `yedek cron dünkü tetik (şimdi ${hourUtc}:xx UTC < ${BACKUP_CRON_HOUR_UTC[i.slot]}:07) — gün geçti`;
    }
    // 21:00 UTC = 00:00 TR: yedek kendi TR gününü geçti. Sayım yeni güne
    // bakacağı için boş görür ve atardı (14 Eki 21:34 UTC akşam yedeği).
    if (hourUtc >= 21) {
      return `yedek cron TR gece yarısını geçti (şimdi ${hourUtc}:xx UTC ≥ 21:00) — gün geçti`;
    }
  }
  if (i.postTimestamps === null) {
    // Okunamadıysa: asıl yol yayınlar (eski davranış), yedek risk almaz.
    return i.backup ? "IG gönderileri okunamadı — yedek mükerrer riskine girmez" : null;
  }
  const n = postsOnIstanbulDay(i.postTimestamps, i.nowMs);
  const allowed = i.slot === "morning" ? 0 : 1;
  if (n > allowed) {
    return `bugün (TR) IG'de zaten ${n} gönderi var — ${i.slot} slotu dolu`;
  }
  return null;
}
