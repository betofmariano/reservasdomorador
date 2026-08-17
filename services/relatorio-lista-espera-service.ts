import { buildListaEsperaListPath } from '@/constants/api';
import { authGetRequest } from '@/services/api-client';
import type { ListaEsperaRegistro } from '@/types/lista-espera';
import { normalizeListaEsperaListFromApi } from '@/utils/normalize-lista-espera';
import { filterListaEsperaPendentes } from '@/utils/lista-espera-visivel';

export type GetRelatorioListaEsperaOptions = {
  incluirAvisados?: boolean;
};

export async function getRelatorioListaEsperaByAcademia(
  academiasId: number,
  authToken: string,
  options?: GetRelatorioListaEsperaOptions,
): Promise<ListaEsperaRegistro[]> {
  const data = await authGetRequest<unknown>(
    buildListaEsperaListPath({ academias_id: academiasId }),
    authToken,
  );

  const registros = normalizeListaEsperaListFromApi(data);

  if (options?.incluirAvisados) {
    return registros;
  }

  return filterListaEsperaPendentes(registros);
}
