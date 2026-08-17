import type { MapaDiarioItem } from '@/types/mapa-diario';

export function startOfLocalDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function addDaysToDate(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function toDiaSemanaApi(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function findLatestDataAtividadeTimestamp(items: MapaDiarioItem[]): number | null {
  let latest: number | null = null;

  for (const item of items) {
    if (item.dataAtividade == null) {
      continue;
    }

    const dayStart = startOfLocalDay(new Date(item.dataAtividade)).getTime();

    if (latest === null || dayStart > latest) {
      latest = dayStart;
    }
  }

  return latest;
}

export function suggestNextMapaDiarioDate(
  latestDataAtividadeMs: number | null,
  referenceDate = new Date(),
): Date {
  if (latestDataAtividadeMs === null) {
    return startOfLocalDay(referenceDate);
  }

  return addDaysToDate(new Date(latestDataAtividadeMs), 1);
}

export function formatMapaDiarioShortDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  return `${day}/${month}/${year}`;
}

export function formatMapaDiarioFullDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/** Data no formato esperado por POST /mapaDiarioGerar (`YYYY-MM-DD`). */
export function formatMapaDiarioApiDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
}