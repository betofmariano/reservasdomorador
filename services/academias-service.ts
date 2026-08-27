import { API_ENDPOINTS } from '@/constants/api';
import { authGetRequest, authPatchRequest, getRequest } from '@/services/api-client';
import type { Academia, UpdateAcademiaPayload } from '@/types/academia';
import { sortByClubNome } from '@/utils/club-sort';
import {
  filterActiveAcademias,
  normalizeAcademiaFromApi,
  normalizeAcademiasFromApi,
} from '@/utils/normalize-academia';

function buildCondominioItemPath(condominioId: number): string {
  return `${API_ENDPOINTS.condominio}/${condominioId}`;
}

export async function getAcademias(): Promise<Academia[]> {
  const data = await getRequest<unknown>(API_ENDPOINTS.condominio);
  const academias = normalizeAcademiasFromApi(data);

  return filterActiveAcademias(academias);
}

export async function getAcademiasForConfiguration(authToken: string): Promise<Academia[]> {
  const data = await authGetRequest<unknown>(API_ENDPOINTS.condominio, authToken);
  return sortByClubNome(normalizeAcademiasFromApi(data));
}

export async function getAcademiaById(academiaId: number, authToken: string): Promise<Academia> {
  const data = await authGetRequest<unknown>(buildCondominioItemPath(academiaId), authToken);
  const academia = normalizeAcademiaFromApi(data);

  if (!academia) {
    throw new Error('Local não encontrado.');
  }

  return academia;
}

export async function updateAcademia(
  academiaId: number,
  payload: UpdateAcademiaPayload,
  authToken: string,
): Promise<Academia> {
  await authPatchRequest<unknown>(buildCondominioItemPath(academiaId), authToken, payload);

  return getAcademiaById(academiaId, authToken);
}

export function filterAcademiasByIds(
  academias: Academia[],
  academiasIds: number[],
): Academia[] {
  const ids = new Set(academiasIds);

  return sortByClubNome(academias.filter((academia) => ids.has(academia.id)));
}
