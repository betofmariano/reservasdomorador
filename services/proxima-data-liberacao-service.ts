import { buildPegarDataLiberacaoPath } from '@/constants/api';
import { authGetRequest } from '@/services/api-client';
import { readTimestamp } from '@/utils/normalize-api-fields';

/**
 * GET /pegarDataLiberacao?atividades_id=
 * Retorno esperado:
 * `{ "dataLiberacao": <timestamp ms> }` quando ainda há liberação futura;
 * `{ "dataLiberacao": null }` (ou omitido) quando já pode reservar / não há pendência.
 */
export function normalizePegarDataLiberacaoFromApi(raw: unknown): number | null {
  if (raw == null) {
    return null;
  }

  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return raw;
  }

  if (typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  return readTimestamp(record, [
    'dataLiberacao',
    'data_liberacao',
    'pegarDataLiberacao',
    'proximaDataLiberacao',
  ]);
}

export async function getProximaDataLiberacao(
  authToken: string,
  atividadesId: number,
): Promise<number | null> {
  const data = await authGetRequest<unknown>(
    buildPegarDataLiberacaoPath(atividadesId),
    authToken,
  );
  return normalizePegarDataLiberacaoFromApi(data);
}
