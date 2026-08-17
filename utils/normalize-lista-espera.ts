import type { ListaEsperaRegistro } from '@/types/lista-espera';
import {
  normalizeBoolean,
  normalizeRecordId,
  readPersonName,
  readString,
} from '@/utils/normalize-api-fields';

function readTimestamp(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

export function normalizeListaEsperaFromApi(raw: unknown): ListaEsperaRegistro | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = normalizeRecordId(record.id);
  const academiasId = normalizeRecordId(record.academias_id);
  const usersId = normalizeRecordId(record.users_id);
  const atividadesId = normalizeRecordId(record.atividades_id);

  if (id == null || academiasId == null || usersId == null) {
    return null;
  }

  const dataAtividade =
    readTimestamp(record, ['dataAtividade', 'dataEspera']) ??
    null;

  const nome =
    readPersonName(record) ||
    readString(record, ['nome', 'usuario']).trim();

  const atividade = readString(record, ['atividade']).trim();

  return {
    id,
    created_at: readTimestamp(record, ['created_at']) ?? 0,
    academias_id: academiasId,
    atividades_id: atividadesId ?? 0,
    atividade,
    dataAtividade,
    nome,
    users_id: usersId,
    email: readString(record, ['email']),
    telefone: readString(record, ['telefone']),
    avisar: normalizeBoolean(record.avisar),
    avisado: normalizeBoolean(record.avisado),
    horaAviso: readTimestamp(record, ['horaAviso']),
    _users:
      record._users && typeof record._users === 'object'
        ? { nome: readPersonName(record._users as Record<string, unknown>) || nome }
        : null,
  };
}

export function normalizeListaEsperaListFromApi(raw: unknown): ListaEsperaRegistro[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => normalizeListaEsperaFromApi(item))
    .filter((item): item is ListaEsperaRegistro => item !== null);
}
