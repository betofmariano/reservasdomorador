import {
  buildQuadraItemPath,
  buildQuadrasListPath,
  API_ENDPOINTS,
} from '@/constants/api';
import { authDeleteRequest, authGetRequest, authPostRequest } from '@/services/api-client';
import type { CreateQuadraPayload, Quadra } from '@/types/quadra';

export async function getQuadrasByAcademia(academiasId: number, authToken: string): Promise<Quadra[]> {
  return authGetRequest<Quadra[]>(buildQuadrasListPath(academiasId), authToken);
}

export async function createQuadra(payload: CreateQuadraPayload, authToken: string): Promise<Quadra> {
  return authPostRequest<Quadra>(API_ENDPOINTS.quadras, authToken, payload);
}

export async function deleteQuadra(quadrasId: number, authToken: string): Promise<unknown> {
  return authDeleteRequest(buildQuadraItemPath(quadrasId), authToken);
}
