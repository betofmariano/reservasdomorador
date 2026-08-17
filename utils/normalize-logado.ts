import { formatAssociacaoLocalFallback } from '@/constants/associacao-local-labels';
import type { Academia } from '@/types/academia';
import type { LogadoRecord } from '@/types/logado';
import {
  normalizeBoolean,
  normalizeRecordId,
  readAcademiaId,
  readPersonName,
  readString,
  readUserId,
} from '@/utils/normalize-api-fields';

function readNestedAcademiaRecord(record: Record<string, unknown>): Record<string, unknown> | null {
  for (const key of ['_academias', 'academias']) {
    const value = record[key];

    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
  }

  return null;
}

function readNestedUserRecord(record: Record<string, unknown>): Record<string, unknown> | null {
  for (const key of ['_users', '_users', 'users']) {
    const value = record[key];

    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
  }

  return null;
}

export function normalizeLogadoFromApi(raw: unknown): LogadoRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = normalizeRecordId(record.id);

  if (id == null) {
    return null;
  }

  const usersId = readUserId(record) ?? 0;
  const academiasId = readAcademiaId(record) ?? 0;
  const nestedUser = readNestedUserRecord(record);
  const nestedAcademia = readNestedAcademiaRecord(record);
  const telefoneLimpo = readString(record, ['telefoneLimpo', 'telefoneConfirmado', 'telefoneCorrigido']);
  const localFromRelation = nestedAcademia ? readString(nestedAcademia, ['nome']) : '';

  return {
    id,
    created_at:
      typeof record.created_at === 'number' && Number.isFinite(record.created_at)
        ? record.created_at
        : null,
    users_id: usersId,
    nome: readPersonName(record) || readString(record, ['nome']),
    academias_id: academiasId,
    local: localFromRelation || readString(record, ['local']),
    aprovado: normalizeBoolean(record.aprovado),
    logadoXano: normalizeBoolean(record.logadoXano),
    email: readString(record, ['email']),
    gestor: normalizeBoolean(record.gestor),
    administrador: normalizeBoolean(record.administrador),
    bloqueado: normalizeBoolean(record.bloqueado),
    larguraPagina:
      typeof record.larguraPagina === 'number' && Number.isFinite(record.larguraPagina)
        ? record.larguraPagina
        : 0,
    telefoneLimpo: telefoneLimpo || readString(nestedUser ?? {}, ['telefoneLimpo', 'telefoneConfirmado']),
    plataforma: readString(record, ['plataforma', 'Plataforma', 'platform']),
    dispositivo: readString(record, ['dispositivo', 'Dispositivo', 'device']),
    cod: readString(record, ['cod']),
    logadoBubble: normalizeBoolean(record.logadoBubble),
    nomeBubble: readString(record, ['nomeBubble']),
    _users: nestedUser
      ? {
          nome: readPersonName(nestedUser),
          telefoneLimpo: readString(nestedUser, ['telefoneLimpo', 'telefoneConfirmado']),
        }
      : null,
    _academias: nestedAcademia
      ? {
          nome: readString(nestedAcademia, ['nome']),
        }
      : null,
  };
}

export function normalizeLogadosFromApi(raw: unknown): LogadoRecord[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => normalizeLogadoFromApi(item))
    .filter((item): item is LogadoRecord => item !== null);
}

export function enrichLogadosWithAcademiaNames(
  logados: LogadoRecord[],
  academias: Academia[],
): LogadoRecord[] {
  const academiasById = new Map(academias.map((academia) => [academia.id, academia.nome]));

  return logados.map((logado) => {
    if (!logado.academias_id) {
      return logado;
    }

    const academiaNome =
      academiasById.get(logado.academias_id) ??
      (logado.local || formatAssociacaoLocalFallback(logado.academias_id));

    return {
      ...logado,
      local: academiaNome,
    };
  });
}
