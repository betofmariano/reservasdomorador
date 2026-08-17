import { buildMapaDiarioFuturoPath } from '@/constants/api';
import { authGetRequest } from '@/services/api-client';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import { normalizeMapaDiarioFuturoListFromApi } from '@/utils/normalize-mapa-diario-futuro';

export type MapaDiarioFuturoQuery = {
  academias_id?: number;
  atividades_id?: number;
};

export async function getMapaDiarioFuturo(
  authToken: string,
  query?: MapaDiarioFuturoQuery,
): Promise<MapaDiarioFuturoItem[]> {
  const data = await authGetRequest<unknown>(buildMapaDiarioFuturoPath(query), authToken);

  return normalizeMapaDiarioFuturoListFromApi(data);
}
