import { API_ENDPOINTS } from '@/constants/api';
import { authPatchRequest } from '@/services/api-client';
import type { ProgramarQuadraPayload, ProgramarQuadraResponse } from '@/types/programar-quadras';

export async function programarQuadra(
  payload: ProgramarQuadraPayload,
  authToken: string,
): Promise<ProgramarQuadraResponse> {
  console.log('Programação de quadra solicitada');
  console.log('Clube identificado:', Boolean(payload.academias_id));

  const data = await authPatchRequest<ProgramarQuadraResponse>(
    API_ENDPOINTS.programarQuadra,
    authToken,
    payload,
  );

  console.log('Resposta da programação de quadra recebida');

  return data;
}
