import type { MapaDiaOption } from '@/utils/jogos-time';

export const LIBERACAO_COUNTDOWN_MINUTE_TICK_MS = 60 * 1000;
export const LIBERACAO_COUNTDOWN_SECOND_TICK_MS = 1000;
export const LIBERACAO_COUNTDOWN_IDLE_TICK_MS = 60 * 1000;
export const LIBERACAO_COUNTDOWN_SECONDS_THRESHOLD_MS = 5 * 60 * 1000;

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export function shouldShowLiberacaoCountdown(selectedDay: MapaDiaOption): boolean {
  return selectedDay === 'amanha';
}

export function getCountdownRemainingMinutes(remainingMs: number): number {
  return Math.max(1, Math.ceil(remainingMs / MS_PER_MINUTE));
}

function formatCountdownUnit(count: number, singular: string, plural: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

function formatHoursAndMinutes(remainingMs: number): string {
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / MS_PER_MINUTE));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes}`;
}

function formatDaysAndHours(remainingMs: number): string {
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / MS_PER_MINUTE));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);

  if (hours === 0) {
    return `${days} d`;
  }

  return `${days} d e ${hours} hs`;
}

/** Nos últimos 5 minutos: `m:ss` (ex.: 4:59). */
function formatMinutesAndSeconds(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatCountdownDisplay(remainingMs: number): string {
  if (remainingMs <= 0) {
    return '0:00';
  }

  if (remainingMs <= LIBERACAO_COUNTDOWN_SECONDS_THRESHOLD_MS) {
    return formatMinutesAndSeconds(remainingMs);
  }

  if (remainingMs > MS_PER_DAY) {
    return formatDaysAndHours(remainingMs);
  }

  if (remainingMs > MS_PER_HOUR) {
    return formatHoursAndMinutes(remainingMs);
  }

  const minutes = getCountdownRemainingMinutes(remainingMs);

  return formatCountdownUnit(minutes, 'minuto', 'minutos');
}

export function formatLiberacaoCountdownLabel(
  nextLiberacao: number | null,
  remainingMs: number,
): string {
  if (nextLiberacao === null) {
    return 'sem horários pendentes';
  }

  return formatCountdownDisplay(remainingMs);
}

export function getCountdownTickDelay(remainingMs: number, hasLiberacao: boolean): number {
  if (!hasLiberacao) {
    return LIBERACAO_COUNTDOWN_IDLE_TICK_MS;
  }

  if (remainingMs <= LIBERACAO_COUNTDOWN_SECONDS_THRESHOLD_MS) {
    return LIBERACAO_COUNTDOWN_SECOND_TICK_MS;
  }

  return LIBERACAO_COUNTDOWN_MINUTE_TICK_MS;
}
