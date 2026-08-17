import type { UsoQuadraProgramarOption } from '@/types/programar-quadras';
import { buildDataCorteTimestamp, normalizeCalendarDate } from '@/utils/jogos-time';

export const PROGRAMAR_QUADRAS_HOUR_RANGE = {
  start: 6,
  end: 22,
} as const;

export const PROGRAMAR_QUADRAS_MESSAGES = {
  permission: 'Você não tem permissão para programar quadras deste clube.',
  submitError: 'Não foi possível programar a quadra. Tente novamente.',
  submitSuccess: 'Quadra programada com sucesso.',
  quadraInvalid: 'Selecione uma quadra válida.',
  quadrasEmpty: 'Não há quadras cadastradas para este clube.',
  horarioInvalid: 'Informe horários válidos.',
  horarioRangeInvalid: 'O horário final deve ser posterior ao horário inicial.',
  usoRequired: 'Selecione o uso da quadra.',
  clubRequired: 'Selecione um clube.',
};

export type ProgramarQuadrasFormValues = {
  startDate: Date;
  endDate: Date;
  startTime: Date;
  endTime: Date;
  quadra: string;
  usoQuadra: UsoQuadraProgramarOption;
};

export function createInitialProgramarQuadrasFormValues(referenceDate = new Date()): ProgramarQuadrasFormValues {
  const today = normalizeCalendarDate(referenceDate);
  const defaultStartTime = new Date(today);
  defaultStartTime.setHours(PROGRAMAR_QUADRAS_HOUR_RANGE.start, 0, 0, 0);
  const defaultEndTime = new Date(today);
  defaultEndTime.setHours(PROGRAMAR_QUADRAS_HOUR_RANGE.start + 1, 0, 0, 0);

  return {
    startDate: today,
    endDate: today,
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    quadra: '',
    usoQuadra: 'Torneio',
  };
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.trunc(parsed);
}

export function validateProgramarQuadrasForm(
  values: ProgramarQuadrasFormValues,
  options?: { registeredQuadras?: number[] },
): string | null {
  const registeredQuadras = options?.registeredQuadras;

  if (registeredQuadras != null && registeredQuadras.length === 0) {
    return PROGRAMAR_QUADRAS_MESSAGES.quadrasEmpty;
  }

  const quadra = parsePositiveInt(values.quadra);

  if (quadra == null) {
    return PROGRAMAR_QUADRAS_MESSAGES.quadraInvalid;
  }

  if (registeredQuadras != null && !registeredQuadras.includes(quadra)) {
    return PROGRAMAR_QUADRAS_MESSAGES.quadraInvalid;
  }

  if (
    !Number.isFinite(values.startTime.getTime()) ||
    !Number.isFinite(values.endTime.getTime())
  ) {
    return PROGRAMAR_QUADRAS_MESSAGES.horarioInvalid;
  }

  const startTimestamp = buildDataCorteTimestamp(values.startDate, values.startTime);
  const endTimestamp = buildDataCorteTimestamp(values.endDate, values.endTime);

  if (endTimestamp < startTimestamp) {
    return PROGRAMAR_QUADRAS_MESSAGES.horarioRangeInvalid;
  }

  if (!values.usoQuadra.trim()) {
    return PROGRAMAR_QUADRAS_MESSAGES.usoRequired;
  }

  return null;
}

export function buildProgramarQuadrasPayload(academiasId: number, values: ProgramarQuadrasFormValues) {
  return {
    academias_id: academiasId,
    dataJogoInic: buildDataCorteTimestamp(values.startDate, values.startTime),
    dataJogoFinal: buildDataCorteTimestamp(values.endDate, values.endTime),
    quadra: parsePositiveInt(values.quadra)!,
    usoQuadra: values.usoQuadra,
  };
}

export function formatProgramarDateLabel(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}/${month}`;
}

export function formatProgramarTimeLabel(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}
