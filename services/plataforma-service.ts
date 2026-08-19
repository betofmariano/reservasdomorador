import { API_ENDPOINTS } from '@/constants/api';
import { getRequest } from '@/services/api-client';
import type { PlataformaStats } from '@/types/plataforma';

export async function getPlataformaStats(): Promise<PlataformaStats> {
  const records = await getRequest<PlataformaStats[]>(API_ENDPOINTS.plataforma);
  const stats = records[0];

  if (!stats) {
    throw new Error('Não foi possível carregar os dados da plataforma.');
  }

  return stats;
}
