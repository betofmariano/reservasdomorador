import type { Horario } from '@/types/horario';
import {
  normalizeBoolean,
  normalizeRecordId,
  readAcademiaId,
  readString,
  unwrapApiList,
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

export function normalizeHorarioFromApi(raw: unknown): Horario | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = normalizeRecordId(record.id);
  const academiasId = readAcademiaId(record);
  const atividadesId = normalizeRecordId(record.atividades_id);
  const atividade = readString(record, ['atividade', 'nome']).trim();

  if (id == null || academiasId == null || atividadesId == null || !atividade) {
    return null;
  }

  return {
    id,
    academias_id: academiasId,
    atividades_id: atividadesId,
    atividade,
    capacidade: readNumber(record, ['capacidade']),
    hora: readNumber(record, ['hora']),
    minutos: readNumber(record, ['minutos']),
    segunda: normalizeBoolean(record.segunda),
    terca: normalizeBoolean(record.terca),
    quarta: normalizeBoolean(record.quarta),
    quinta: normalizeBoolean(record.quinta),
    sexta: normalizeBoolean(record.sexta),
    sabado: normalizeBoolean(record.sabado),
    domingo: normalizeBoolean(record.domingo),
    tipoProgramacao: readString(record, ['tipoProgramacao']),
  };
}

export function normalizeHorariosFromApi(raw: unknown): Horario[] {
  return unwrapApiList(raw)
    .map((item) => normalizeHorarioFromApi(item))
    .filter((item): item is Horario => item !== null);
}

export function filterHorariosByAcademiaAndAtividade(
  horarios: Horario[],
  academiasId: number,
  atividadesId?: number | null,
): Horario[] {
  return horarios.filter((item) => {
    if (item.academias_id !== academiasId) {
      return false;
    }

    if (atividadesId == null) {
      return true;
    }

    return item.atividades_id === atividadesId;
  });
}
