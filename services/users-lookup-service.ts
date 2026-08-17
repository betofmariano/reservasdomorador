import { getUserById } from '@/services/user-service';
import { getUsuariosLocal } from '@/services/usuarios-service';
import type { UsersLocalApiRecord } from '@/types/usuario';
import { readPersonName } from '@/utils/normalize-api-fields';

const usersNomeCache = new Map<number, string>();

function readUsersTableNomeFromUsersLocalRecord(record: UsersLocalApiRecord): string {
  const nestedUsers = record._users as Record<string, unknown> | null | undefined;
  const nomeFromUsersTable =
    nestedUsers && typeof nestedUsers === 'object' ? readPersonName(nestedUsers) : '';

  if (nomeFromUsersTable) {
    return nomeFromUsersTable;
  }

  return record.nome.trim();
}

export function buildUsersNomesByIdsFromUsersLocal(
  records: UsersLocalApiRecord[],
): Map<number, string> {
  const result = new Map<number, string>();

  for (const record of records) {
    if (record.users_id <= 0) {
      continue;
    }

    const nome = readUsersTableNomeFromUsersLocalRecord(record);

    if (!nome) {
      continue;
    }

    const existing = result.get(record.users_id);
    const nestedUsers = record._users as Record<string, unknown> | null | undefined;
    const hasUsersTableNome =
      nestedUsers && typeof nestedUsers === 'object' ? readPersonName(nestedUsers) : '';

    if (!existing || hasUsersTableNome) {
      result.set(record.users_id, nome);
    }
  }

  return result;
}

export async function getUsersNomeById(
  usersId: number,
  authToken: string,
): Promise<string | null> {
  if (usersId <= 0) {
    return null;
  }

  const cached = usersNomeCache.get(usersId);

  if (cached) {
    return cached;
  }

  try {
    const user = await getUserById(usersId, authToken);
    const nome = user?.nome.trim() ?? '';

    if (!nome) {
      return null;
    }

    usersNomeCache.set(usersId, nome);

    return nome;
  } catch {
    return null;
  }
}

export async function buildUsersNomesByIdsMap(
  usersIds: number[],
  authToken: string,
  academiasId?: number,
): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(usersIds.filter((id) => id > 0))];
  const result = new Map<number, string>();

  if (academiasId != null && academiasId > 0) {
    try {
      const records = await getUsuariosLocal(authToken, academiasId);
      const fromUsersLocal = buildUsersNomesByIdsFromUsersLocal(records);

      for (const [usersId, nome] of fromUsersLocal) {
        result.set(usersId, nome);
      }
    } catch {
      // Segue para fallback individual.
    }
  }

  const missingIds = uniqueIds.filter((usersId) => !result.has(usersId));

  await Promise.all(
    missingIds.map(async (usersId) => {
      const cached = usersNomeCache.get(usersId);

      if (cached) {
        result.set(usersId, cached);
        return;
      }

      const nome = await getUsersNomeById(usersId, authToken);

      if (nome) {
        result.set(usersId, nome);
      }
    }),
  );

  return result;
}

export function resolveUsuarioNomeFromMap(
  usersId: number,
  usersNomesById: Map<number, string>,
): string {
  if (usersId <= 0) {
    return 'Não informado';
  }

  const nome = usersNomesById.get(usersId)?.trim();

  if (nome) {
    return nome;
  }

  const cached = usersNomeCache.get(usersId)?.trim();

  if (cached) {
    return cached;
  }

  return `Usuário #${usersId}`;
}

export function clearUsersNomeCache(): void {
  usersNomeCache.clear();
}
