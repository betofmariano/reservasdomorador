import { API_ENDPOINTS } from '@/constants/api';
import { authPostRequest } from '@/services/api-client';
import type { Acesso } from '@/types/acesso';
import type { SolicitacaoAlteracaoPayload } from '@/types/solicitacao-alteracao';

export async function createSolicitacaoAlteracao(
  payload: SolicitacaoAlteracaoPayload,
  authToken: string,
): Promise<Acesso> {
  return authPostRequest<Acesso>(API_ENDPOINTS.acessos, authToken, payload);
}
