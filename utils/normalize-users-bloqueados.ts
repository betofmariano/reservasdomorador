import type { UsersBloqueadoRegistro } from '@/types/users-bloqueados';
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

export function normalizeUsersBloqueadoFromApi(raw: unknown): UsersBloqueadoRegistro | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = normalizeRecordId(record.id);
  const userslocalId = normalizeRecordId(record.userslocal_id);
  const usersId = normalizeRecordId(record.users_id);
  const atividadesId = normalizeRecordId(record.atividades_id);

  if (id == null || userslocalId == null || usersId == null || atividadesId == null) {
    return null;
  }

  const usersRecord =
    record._users && typeof record._users === 'object'
      ? (record._users as Record<string, unknown>)
      : null;
  const atividadeRecord =
    record._atividades && typeof record._atividades === 'object'
      ? (record._atividades as Record<string, unknown>)
      : null;
  const usersLocalRecord =
    record._userslocal && typeof record._userslocal === 'object'
      ? (record._userslocal as Record<string, unknown>)
      : null;

  const nome =
    (usersRecord ? readPersonName(usersRecord) : '') ||
    readPersonName(record) ||
    readString(record, ['nome']).trim();
  const telefone = usersRecord ? readString(usersRecord, ['telefone']) : readString(record, ['telefone']);
  const atividade = atividadeRecord
    ? readString(atividadeRecord, ['atividade']).trim()
    : readString(record, ['atividade']).trim();
  const academiasId =
    normalizeRecordId(usersLocalRecord?.academias_id) ??
    normalizeRecordId(record.academias_id) ??
    0;

  const dataInicio = readTimestamp(record, ['dataInicio']) ?? 0;
  const dataFinal = readTimestamp(record, ['dataFinal']) ?? 0;

  return {
    id,
    created_at: readTimestamp(record, ['created_at']) ?? 0,
    userslocal_id: userslocalId,
    users_id: usersId,
    atividades_id: atividadesId,
    dataInicio,
    dataFinal,
    encerrado: normalizeBoolean(record.encerrado),
    nome,
    telefone,
    atividade,
    academias_id: academiasId,
  };
}

export function normalizeUsersBloqueadosListFromApi(raw: unknown): UsersBloqueadoRegistro[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => normalizeUsersBloqueadoFromApi(item))
    .filter((item): item is UsersBloqueadoRegistro => item !== null);
}
