import { API_ENDPOINTS } from '@/constants/api';
import { authPostRequest } from '@/services/api-client';
import {
  filterAcademiasByIds,
  getAcademiaById,
  getAcademias,
  getAcademiasForConfiguration,
  updateAcademia,
} from '@/services/academias-service';
import type { Academia } from '@/types/academia';

export {
  filterAcademiasByIds,
  getAcademiaById,
  getAcademias,
  getAcademiasForConfiguration,
  updateAcademia,
};

export function buildAcademiaPath(academiaId: number): string {
  return `${API_ENDPOINTS.academias}/${academiaId}`;
}

/** @deprecated Use getAcademiaById from academias-service */
export const getClubById = getAcademiaById;

/** @deprecated Use getAcademias from academias-service */
export async function getClubes(): Promise<Academia[]> {
  const { getAcademias } = await import('@/services/academias-service');
  return getAcademias();
}

/** @deprecated MatchPoint legacy */
export async function createClub(
  payload: Record<string, unknown>,
  authToken: string,
): Promise<Academia> {
  return authPostRequest<Academia>(API_ENDPOINTS.academias, authToken, payload);
}

/** @deprecated Use updateAcademia from academias-service */
export async function updateClub(
  academiaId: number,
  payload: Record<string, unknown>,
  authToken: string,
): Promise<Academia> {
  const { updateAcademia } = await import('@/services/academias-service');
  return updateAcademia(academiaId, payload as never, authToken);
}
