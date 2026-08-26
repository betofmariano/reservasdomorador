import {
  buildMapaMensalPorSemanaItemPath,
  buildMapaMensalPorSemanaPath,
} from '@/constants/api';
import { authGetRequest } from '@/services/api-client';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import {
  normalizeMapaMensalPorSemanaFromApi,
  normalizeMapaMensalPorSemanaListFromApi,
} from '@/utils/normalize-mapa-mensal-por-semana';

export type MapaMensalPorSemanaQuery = {
  academias_id?: number;
  condominio_id?: number;
  atividades_id?: number;
};

function filterMapaMensalPorSemana(
  items: MapaDiarioFuturoItem[],
  query?: MapaMensalPorSemanaQuery,
): MapaDiarioFuturoItem[] {
  const condominioId = query?.condominio_id ?? query?.academias_id;
  const atividadesId = query?.atividades_id;

  return items.filter((item) => {
    if (condominioId != null && item.academias_id !== condominioId) {
      return false;
    }

    if (atividadesId != null && item.atividades_id !== atividadesId) {
      return false;
    }

    return true;
  });
}

/**
 * Mapa do fluxo MensalPorSemana. HTTP aponta para /mapamensalporsemana.
 */
export async function getMapaMensalPorSemana(
  authToken: string,
  query?: MapaMensalPorSemanaQuery,
): Promise<MapaDiarioFuturoItem[]> {
  const data = await authGetRequest<unknown>(buildMapaMensalPorSemanaPath(query), authToken);

  return filterMapaMensalPorSemana(normalizeMapaMensalPorSemanaListFromApi(data), query);
}

export async function getMapaMensalPorSemanaById(
  mapaId: number,
  authToken: string,
): Promise<MapaDiarioFuturoItem | null> {
  if (mapaId <= 0) {
    return null;
  }

  const data = await authGetRequest<unknown>(
    buildMapaMensalPorSemanaItemPath(mapaId),
    authToken,
  );

  return normalizeMapaMensalPorSemanaFromApi(data);
}
