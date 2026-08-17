import { buildAtividadeUnidadeListPath } from '@/constants/api';
import { authGetRequest } from '@/services/api-client';
import type { AtividadeUnidade } from '@/types/atividade-unidade';
import { normalizeAtividadeUnidadesFromApi } from '@/utils/normalize-atividade-unidade';

export async function getAtividadeUnidadesByAtividade(
  atividadesId: number,
  authToken: string,
): Promise<AtividadeUnidade[]> {
  const data = await authGetRequest<unknown>(
    buildAtividadeUnidadeListPath(atividadesId),
    authToken,
  );

  return normalizeAtividadeUnidadesFromApi(data).filter(
    (item) => item.atividades_id === atividadesId,
  );
}
