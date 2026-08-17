import type { Atividade } from '@/types/atividade';
import {
  normalizeBoolean,
  normalizeRecordId,
  readString,
} from '@/utils/normalize-api-fields';

function readNumber(record: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

export function normalizeAtividadeFromApi(raw: unknown): Atividade | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = normalizeRecordId(record.id);
  const academiasId = normalizeRecordId(record.academias_id);
  const atividade = readString(record, ['atividade']).trim();

  if (id == null || academiasId == null || !atividade) {
    return null;
  }

  return {
    id,
    atividade,
    academias_id: academiasId,
    capacidade: readNumber(record, ['capacidade']),
    controlePresenca: normalizeBoolean(record.controlePresenca),
    horasAntes: readNumber(record, ['horasAntes']),
    minutosCancelamento: readNumber(record, ['minutosCancelamento']),
    observacao: readString(record, ['observacao']),
    tolerancia: readNumber(record, ['tolerancia']),
    qtdeHorarios: readNumber(record, ['qtdeHorarios']),
    tipoProgramacao: readString(record, ['tipoProgramacao']),
    checkinAntes: readNumber(record, ['checkinAntes']),
    checkinDepois: readNumber(record, ['checkinDepois']),
    checkinSeguro: normalizeBoolean(record.checkinSeguro),
    limiteReservasSemana: readNumber(record, ['limiteReservasSemana']),
    temUnidades: normalizeBoolean(
      record.temUnidades ?? record.temUnidade ?? record.hasUnidades,
    ),
  };
}

export function normalizeAtividadesFromApi(raw: unknown): Atividade[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => normalizeAtividadeFromApi(item))
    .filter((item): item is Atividade => item !== null);
}
