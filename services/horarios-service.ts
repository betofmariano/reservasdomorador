import { buildHorarioItemPath, buildHorariosListPath, API_ENDPOINTS } from '@/constants/api';
import { authDeleteRequest, authGetRequest, authPostRequest } from '@/services/api-client';
import type { CreateHorarioPayload, Horario } from '@/types/horario';
import {
  filterHorariosByAcademiaAndAtividade,
  normalizeHorariosFromApi,
} from '@/utils/normalize-horario';

export async function getHorariosByAcademia(
  academiasId: number,
  authToken: string,
  atividadesId?: number | null,
): Promise<Horario[]> {
  const data = await authGetRequest<unknown>(
    buildHorariosListPath(academiasId, atividadesId ?? undefined),
    authToken,
  );
  const horarios = normalizeHorariosFromApi(data);
  return filterHorariosByAcademiaAndAtividade(horarios, academiasId, atividadesId);
}

export async function createHorario(payload: CreateHorarioPayload, authToken: string): Promise<Horario> {
  return authPostRequest<Horario>(API_ENDPOINTS.horarios, authToken, payload);
}

export async function deleteHorario(horariosId: number, authToken: string): Promise<unknown> {
  return authDeleteRequest(buildHorarioItemPath(horariosId), authToken);
}
