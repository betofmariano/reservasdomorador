import {
  buildAtividadesLocalPrioritarioPath,
  buildReservasAtividadePath,
} from '@/constants/api';
import { authGetRequest } from '@/services/api-client';
import {
  getAtividadesByAcademia,
  mapAtividadesToOptions,
} from '@/services/atividades-service';
import type { AtividadeOption } from '@/types/atividade';
import type {
  ListaReservasAtividadeConsultaParams,
  ReservaAtividadeRelatorioItem,
} from '@/types/lista-reservas-atividade';
import { normalizeReservasAtividadePeriodoResponse } from '@/utils/normalize-lista-reservas-atividade';
import { normalizeAtividadesFromApi } from '@/utils/normalize-atividade';

function toIsoDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function getAtividadesLocalPrioritarioReport(
  academiasId: number,
  authToken: string,
): Promise<AtividadeOption[]> {
  try {
    const data = await authGetRequest<unknown>(buildAtividadesLocalPrioritarioPath(), authToken);
    const rawList = Array.isArray(data)
      ? data
      : data && typeof data === 'object'
        ? ((data as Record<string, unknown>).atividades ?? (data as Record<string, unknown>).items)
        : null;
    const options = mapAtividadesToOptions(normalizeAtividadesFromApi(rawList ?? data));

    if (options.length > 0) {
      return options.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }
  } catch {
    // Fallback para endpoint legado enquanto o endpoint novo não estiver disponível.
  }

  const atividades = await getAtividadesByAcademia(academiasId, authToken);
  return mapAtividadesToOptions(atividades).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function getReservasAtividadePeriodoReport(
  _academiasId: number,
  params: ListaReservasAtividadeConsultaParams,
  authToken: string,
  atividadeNomeFallback: string,
): Promise<ReservaAtividadeRelatorioItem[]> {
  const data = await authGetRequest<unknown>(
    buildReservasAtividadePath({
      atividades_id: params.atividadesId,
      dataInicial: toIsoDate(params.dataHoraInicial),
      dataFinal: toIsoDate(params.dataHoraFinal),
    }),
    authToken,
  );

  const items = normalizeReservasAtividadePeriodoResponse(data, atividadeNomeFallback);

  return items.filter(
    (item) =>
      item.dataHora >= params.dataHoraInicial && item.dataHora <= params.dataHoraFinal,
  );
}
