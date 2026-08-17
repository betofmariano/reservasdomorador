import { formatAssociacaoLocalFallback } from '@/constants/associacao-local-labels';
import type { Academia } from '@/types/academia';
import type { Acesso } from '@/types/acesso';
import type { UsersLocalApiRecord } from '@/types/usuario';
import {
  readAcademiaId,
  readPersonName,
  readString,
  readUserId,
  normalizeRecordId,
} from '@/utils/normalize-api-fields';

type AcessoUserSummary = {
  nome: string;
  email: string;
};

function readNestedUserRecord(record: Record<string, unknown>): Record<string, unknown> | null {
  for (const key of ['_users', 'users']) {
    const value = record[key];

    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
  }

  return null;
}

export function normalizeAcessoFromApi(raw: unknown): Acesso | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = normalizeRecordId(record.id);

  if (id == null) {
    return null;
  }

  const academiasId = readAcademiaId(record) ?? 0;
  const usersId = readUserId(record) ?? 0;
  const nestedUser = readNestedUserRecord(record);
  const nomeFromUser = nestedUser ? readPersonName(nestedUser) : '';
  const emailFromUser = nestedUser ? readString(nestedUser, ['email']) : '';

  return {
    id,
    created_at:
      typeof record.created_at === 'number' && Number.isFinite(record.created_at)
        ? record.created_at
        : 0,
    dataJogo:
      typeof record.dataJogo === 'number' && Number.isFinite(record.dataJogo)
        ? record.dataJogo
        : null,
    academias_id: academiasId,
    rotina: readString(record, ['rotina']),
    nome: nomeFromUser || readString(record, ['nome']),
    email: emailFromUser || readString(record, ['email']),
    larguraPagina:
      typeof record.larguraPagina === 'number' && Number.isFinite(record.larguraPagina)
        ? record.larguraPagina
        : 0,
    pagina: readString(record, ['pagina']),
    local: readString(record, ['local']),
    users_id: usersId,
  };
}

export function normalizeAcessosFromApi(raw: unknown): Acesso[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => normalizeAcessoFromApi(item))
    .filter((item): item is Acesso => item !== null);
}

export function buildUsersByIdMap(records: UsersLocalApiRecord[]): Map<number, AcessoUserSummary> {
  const usersById = new Map<number, AcessoUserSummary>();

  for (const record of records) {
    if (!record.users_id) {
      continue;
    }

    const nome = record.nome.trim();
    const email = (record._users?.email ?? record._users?.email ?? '').trim();
    const existing = usersById.get(record.users_id);

    if (!existing) {
      usersById.set(record.users_id, { nome, email });
      continue;
    }

    usersById.set(record.users_id, {
      nome: existing.nome || nome,
      email: existing.email || email,
    });
  }

  return usersById;
}

export function enrichAcessosWithUserDetails(
  acessos: Acesso[],
  usersById: Map<number, AcessoUserSummary>,
): Acesso[] {
  return acessos.map((acesso) => {
    if (!acesso.users_id) {
      return acesso;
    }

    const user = usersById.get(acesso.users_id);

    if (!user) {
      return acesso;
    }

    return {
      ...acesso,
      nome: user.nome || acesso.nome,
      email: user.email || acesso.email,
    };
  });
}

export function enrichAcessosWithAcademiaNames(
  acessos: Acesso[],
  academias: Academia[],
): Acesso[] {
  const academiasById = new Map(academias.map((academia) => [academia.id, academia.nome]));

  return acessos.map((acesso) => {
    if (!acesso.academias_id) {
      return acesso;
    }

    const academiaNome =
      academiasById.get(acesso.academias_id) ??
      formatAssociacaoLocalFallback(acesso.academias_id);

    return {
      ...acesso,
      local: academiaNome,
    };
  });
}
