import { buildUsuariosLocalPath } from '@/constants/api';
import { authGetRequest } from '@/services/api-client';
import type { ClubUserOption } from '@/types/game-players';
import { matchesSearchText } from '@/utils/search-text';
import { normalizePhotoUrl } from '@/utils/user-photo';
import { normalizeRecordId, readString } from '@/utils/normalize-api-fields';

const MIN_SEARCH_LENGTH = 3;
const MAX_RESULTS = 15;

function normalizeClubUserFromApi(raw: unknown): ClubUserOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const usersId = normalizeRecordId(record.users_id ?? record.usersId);
  const nome = readString(record, ['nome']).trim();

  if (usersId == null || usersId <= 0 || !nome) {
    return null;
  }

  return {
    users_id: usersId,
    nome,
    foto: null,
  };
}

export type ClubUsersCache = {
  academiasId: number | null;
  users: ClubUserOption[];
};

export function createClubUsersCache(): ClubUsersCache {
  return {
    academiasId: null,
    users: [],
  };
}

export async function fetchClubUsers(
  academiasId: number,
  authToken: string,
  cache: ClubUsersCache,
): Promise<ClubUserOption[]> {
  if (cache.academiasId === academiasId && cache.users.length > 0) {
    return cache.users;
  }

  const data = await authGetRequest<unknown>(buildUsuariosLocalPath(academiasId), authToken);
  const items = Array.isArray(data) ? data : [];

  cache.academiasId = academiasId;
  cache.users = items
    .map((item) => normalizeClubUserFromApi(item))
    .filter((item): item is ClubUserOption => item !== null);

  return cache.users;
}

export async function searchClubUsers(
  academiasId: number,
  term: string,
  authToken: string,
  cache: ClubUsersCache,
): Promise<ClubUserOption[]> {
  const trimmedTerm = term.trim();

  if (trimmedTerm.length < MIN_SEARCH_LENGTH) {
    return [];
  }

  const clubUsers = await fetchClubUsers(academiasId, authToken, cache);

  return clubUsers
    .filter((user) => matchesSearchText(user.nome, trimmedTerm))
    .slice(0, MAX_RESULTS);
}

export function enrichClubUserPhoto(user: ClubUserOption, foto?: string | null): ClubUserOption {
  return {
    ...user,
    foto: normalizePhotoUrl(foto),
  };
}
