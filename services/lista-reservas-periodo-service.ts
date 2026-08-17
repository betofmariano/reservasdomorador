import { buildReservasPeriodoPath, buildSomarReservasPath } from '@/constants/api';
import { authGetRequest } from '@/services/api-client';
import type {
  ListaReservasPeriodoConsultaParams,
  ReservaPeriodoRelatorioItem,
} from '@/types/lista-reservas-periodo';
import { normalizeReservasPeriodoResponse } from '@/utils/normalize-lista-reservas-periodo';

function toIsoDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function consultarListaReservasPeriodoReport(
  academiasId: number,
  params: ListaReservasPeriodoConsultaParams,
  authToken: string,
): Promise<ReservaPeriodoRelatorioItem[]> {
  await authGetRequest<unknown>(
    buildSomarReservasPath({
      academias_id: academiasId,
      dataInicial: toIsoDate(params.dataHoraInicial),
      dataFinal: toIsoDate(params.dataHoraFinal),
    }),
    authToken,
  );

  const data = await authGetRequest<unknown>(
    buildReservasPeriodoPath({ academias_id: academiasId }),
    authToken,
  );

  return normalizeReservasPeriodoResponse(data).filter(
    (item) => item.academiasId === academiasId,
  );
}
