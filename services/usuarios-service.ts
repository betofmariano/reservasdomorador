import { API_ENDPOINTS } from '@/constants/api';
import { authGetRequest } from '@/services/api-client';
import type { UsuarioListItem } from '@/types/usuario';
import { readAcademiaId } from '@/utils/normalize-api-fields';
import {
  mapUsersLocalToAcademiaList,
  normalizeUsersLocalApiRecords,
} from '@/utils/normalize-usuario';

type UsersLocalRecords = ReturnType<typeof normalizeUsersLocalApiRecords>;

type UsersLocalRawCache = {
  authToken: string | null;
  raw: unknown;
};

const usersLocalRawCache: UsersLocalRawCache = {
  authToken: null,
  raw: null,
};

function filterRawUsersLocalByAcademia(raw: unknown, academiasId: number): unknown[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((item) => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    return readAcademiaId(item as Record<string, unknown>) === academiasId;
  });
}

async function fetchUsersLocalRaw(
  authToken: string,
  options?: { force?: boolean },
): Promise<unknown> {
  if (!options?.force && usersLocalRawCache.authToken === authToken && usersLocalRawCache.raw != null) {
    return usersLocalRawCache.raw;
  }

  const data = await authGetRequest<unknown>(API_ENDPOINTS.userslocalSemFoto, authToken);

  usersLocalRawCache.authToken = authToken;
  usersLocalRawCache.raw = data;

  return data;
}

export function invalidateUsuariosLocalCache(): void {
  usersLocalRawCache.authToken = null;
  usersLocalRawCache.raw = null;
}

export async function getUsuariosLocal(
  authToken: string,
  academiasId: number,
  options?: { force?: boolean },
): Promise<UsersLocalRecords> {
  console.log('Carregando usuários da academia:', academiasId);

  const raw = await fetchUsersLocalRaw(authToken, options);
  const filtered = filterRawUsersLocalByAcademia(raw, academiasId);
  const records = normalizeUsersLocalApiRecords(filtered);

  console.log('Resposta da lista de usuários:', records.length);

  return records;
}

export async function getAllUsuariosLocal(
  authToken: string,
  options?: { force?: boolean },
): Promise<UsersLocalRecords> {
  const raw = await fetchUsersLocalRaw(authToken, options);

  return normalizeUsersLocalApiRecords(raw);
}

export function mapUsersLocalToClubList(
  records: UsersLocalRecords,
  academiasId: number,
): UsuarioListItem[] {
  return mapUsersLocalToAcademiaList(records, academiasId);
}
