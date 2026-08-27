import { API_ENDPOINTS, buildUsersLocalListPath } from '@/constants/api';
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
  academiasId: number | null;
  raw: unknown;
};

const usersLocalRawCache: UsersLocalRawCache = {
  authToken: null,
  academiasId: null,
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
  academiasId?: number,
  options?: { force?: boolean },
): Promise<unknown> {
  const scopedAcademiasId = academiasId != null && academiasId > 0 ? academiasId : null;
  const cacheHit =
    !options?.force &&
    usersLocalRawCache.authToken === authToken &&
    usersLocalRawCache.academiasId === scopedAcademiasId &&
    usersLocalRawCache.raw != null;

  if (cacheHit) {
    return usersLocalRawCache.raw;
  }

  const path =
    scopedAcademiasId != null
      ? buildUsersLocalListPath(scopedAcademiasId)
      : API_ENDPOINTS.userslocalSemFoto;
  const data = await authGetRequest<unknown>(path, authToken);

  usersLocalRawCache.authToken = authToken;
  usersLocalRawCache.academiasId = scopedAcademiasId;
  usersLocalRawCache.raw = data;

  return data;
}

export function invalidateUsuariosLocalCache(): void {
  usersLocalRawCache.authToken = null;
  usersLocalRawCache.academiasId = null;
  usersLocalRawCache.raw = null;
}

export async function getUsuariosLocal(
  authToken: string,
  academiasId: number,
  options?: { force?: boolean },
): Promise<UsersLocalRecords> {
  console.log('Carregando usuários da academia:', academiasId);

  const raw = await fetchUsersLocalRaw(authToken, academiasId, options);
  const items = Array.isArray(raw) ? raw : [];
  const filtered =
    items.length > 0 ? filterRawUsersLocalByAcademia(items, academiasId) : items;
  const records = normalizeUsersLocalApiRecords(filtered.length > 0 ? filtered : raw);

  console.log('Resposta da lista de usuários:', records.length);

  return records;
}

export async function getAllUsuariosLocal(
  authToken: string,
  options?: { force?: boolean },
): Promise<UsersLocalRecords> {
  const raw = await fetchUsersLocalRaw(authToken, undefined, options);

  return normalizeUsersLocalApiRecords(raw);
}

export function mapUsersLocalToClubList(
  records: UsersLocalRecords,
  academiasId: number,
): UsuarioListItem[] {
  return mapUsersLocalToAcademiaList(records, academiasId);
}
