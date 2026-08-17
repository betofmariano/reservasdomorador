import type { UserLocalAssociation } from '@/types/user-local';
import {
  normalizeBoolean,
  normalizeRecordId,
  readAcademiaId,
  readPersonName,
  readString,
  readUserId,
} from '@/utils/normalize-api-fields';

export function normalizeUserLocalFromApi(raw: unknown): UserLocalAssociation | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = normalizeRecordId(record.id);
  const usersId = readUserId(record);
  const academiasId = readAcademiaId(record);

  if (id == null || usersId == null || academiasId == null) {
    return null;
  }

  const nestedUser =
    record._users && typeof record._users === 'object'
      ? (record._users as Record<string, unknown>)
      : record.users && typeof record.users === 'object'
        ? (record.users as Record<string, unknown>)
        : null;

  return {
    id,
    nome: readPersonName(record),
    ultimoAcesso:
      typeof record.ultimoAcesso === 'number'
        ? record.ultimoAcesso
        : normalizeRecordId(record.ultimoAcesso),
    users_id: usersId,
    academias_id: academiasId,
    aprovado: normalizeBoolean(record.aprovado),
    administrador:
      (nestedUser ? normalizeBoolean(nestedUser.administrador) : false) ||
      normalizeBoolean(record.administrador),
    gestor: normalizeBoolean(record.gestor),
    professor: normalizeBoolean(record.professor),
    bloqueado:
      normalizeBoolean(record.bloqueado) ||
      (nestedUser ? normalizeBoolean(nestedUser.bloqueado) : false),
    cienteCancelamento: normalizeBoolean(record.cienteCancelamento),
    matricula: readString(record, ['matricula', 'socioTitulo']),
    complemento: readString(record, ['complemento']),
    socioTitulo: readString(record, ['socioTitulo', 'matricula']),
    dataRegulamento:
      typeof record.dataRegulamento === 'number'
        ? record.dataRegulamento
        : normalizeRecordId(record.dataRegulamento),
  };
}

export function normalizeUserLocalListFromApi(raw: unknown): UserLocalAssociation[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => normalizeUserLocalFromApi(item))
    .filter((item): item is UserLocalAssociation => item !== null);
}
