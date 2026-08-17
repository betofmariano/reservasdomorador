type ClubScheduleConfig = {
  horaInicial: number;
  horaFinal: number;
  minutosDuracao: number;
};

const DEFAULT_SCHEDULE: ClubScheduleConfig = {
  horaInicial: 7,
  horaFinal: 22,
  minutosDuracao: 75,
};

export const LISTA_ESPERA_SCHEDULE: ClubScheduleConfig = {
  horaInicial: 7,
  horaFinal: 22,
  minutosDuracao: 15,
};

export function formatDateLabel(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}/${month}`;
}

export function formatFullDateLabel(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatRelativeDateLabel(date: Date, referenceDate: Date = new Date()): string {
  if (isSameCalendarDay(date, referenceDate)) {
    return 'Hoje';
  }

  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameCalendarDay(date, tomorrow)) {
    return 'Amanhã';
  }

  return formatFullDateLabel(date);
}

export function buildDateTimeTimestamp(date: Date, time: Date): number {
  return buildDataCorteTimestamp(date, time);
}

export function formatTimeLabel(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function formatGameTime(timestamp: number | null): string {
  if (!timestamp) {
    return '--:--';
  }

  return formatTimeLabel(new Date(timestamp));
}

export function buildDataCorteTimestamp(date: Date, time: Date): number {
  const combined = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0,
  );

  return combined.getTime();
}

export function generateTimeSlots(config: ClubScheduleConfig = DEFAULT_SCHEDULE): Date[] {
  const slots: Date[] = [];
  const baseDate = new Date();
  baseDate.setHours(config.horaInicial, 0, 0, 0);

  const endMinutes = config.horaFinal * 60;
  let currentMinutes = config.horaInicial * 60;

  while (currentMinutes <= endMinutes) {
    const slot = new Date(baseDate);
    slot.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);
    slots.push(slot);
    currentMinutes += config.minutosDuracao;
  }

  return slots;
}

export function roundToCurrentTimeSlot(
  referenceDate: Date = new Date(),
  config: ClubScheduleConfig = DEFAULT_SCHEDULE,
): Date {
  const slots = generateTimeSlots(config);

  if (slots.length === 0) {
    return referenceDate;
  }

  const referenceMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const firstSlotMinutes = config.horaInicial * 60;

  if (referenceMinutes < firstSlotMinutes) {
    return slots[0];
  }

  let selectedSlot = slots[0];

  for (const slot of slots) {
    const slotMinutes = slot.getHours() * 60 + slot.getMinutes();

    if (slotMinutes <= referenceMinutes) {
      selectedSlot = slot;
      continue;
    }

    break;
  }

  return selectedSlot;
}

export function snapTimeToSchedule(
  time: Date,
  config: ClubScheduleConfig = LISTA_ESPERA_SCHEDULE,
): Date {
  const slots = generateTimeSlots(config);

  if (slots.length === 0) {
    return time;
  }

  const timeMinutes = time.getHours() * 60 + time.getMinutes();
  let nearestSlot = slots[0];
  let smallestDiff = Number.POSITIVE_INFINITY;

  for (const slot of slots) {
    const slotMinutes = slot.getHours() * 60 + slot.getMinutes();
    const diff = Math.abs(slotMinutes - timeMinutes);

    if (diff < smallestDiff) {
      smallestDiff = diff;
      nearestSlot = slot;
    }
  }

  const snapped = new Date(time);
  snapped.setHours(nearestSlot.getHours(), nearestSlot.getMinutes(), 0, 0);

  return snapped;
}

export function applyTimeToDate(date: Date, time: Date): Date {
  const result = new Date(date);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return result;
}

export function isSameCalendarDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export type MapaDiaOption = 'hoje' | 'amanha';

export function normalizeCalendarDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  return normalized;
}

export function getTodayDate(referenceDate: Date = new Date()): Date {
  return normalizeCalendarDate(referenceDate);
}

export function getTomorrowDate(referenceDate: Date = new Date()): Date {
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return tomorrow;
}

export function resolveMapaDiaDate(
  option: MapaDiaOption,
  referenceDate: Date = new Date(),
): Date {
  return option === 'amanha' ? getTomorrowDate(referenceDate) : getTodayDate(referenceDate);
}

export function filterJogosBySelectedDate<T extends { dataJogo: number | null }>(
  jogos: T[],
  selectedDate: Date,
  selectedTime: Date,
): T[] {
  const minTimestamp = buildDataCorteTimestamp(selectedDate, selectedTime);

  return jogos.filter((jogo) => {
    if (!jogo.dataJogo || jogo.dataJogo < minTimestamp) {
      return false;
    }

    return isSameCalendarDay(new Date(jogo.dataJogo), selectedDate);
  });
}

export function sortJogos<T extends { dataJogo: number | null; quadra: number }>(jogos: T[]): T[] {
  return [...jogos].sort((a, b) => {
    const timeA = a.dataJogo ?? 0;
    const timeB = b.dataJogo ?? 0;

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return a.quadra - b.quadra;
  });
}

export function getClubScheduleConfig(club?: {
  horaInicial: number;
  horaFinal: number;
  minutosDuracao: number;
} | null): ClubScheduleConfig {
  if (!club) {
    return DEFAULT_SCHEDULE;
  }

  return {
    horaInicial: club.horaInicial,
    horaFinal: club.horaFinal,
    minutosDuracao: club.minutosDuracao,
  };
}
