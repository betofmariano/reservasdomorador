import {
  buildReservasAtividadeHoraPath,
  buildReservasPresentePath,
} from '@/constants/api';
import { authGetRequest, authPatchRequest } from '@/services/api-client';
import { getAtividadesByAcademia, mapAtividadesToOptions } from '@/services/atividades-service';
import { cancelarReservaUsuario } from '@/services/reservas-service';
import type { ReservaResponsavelActor } from '@/types/reserva';
import {
  prepararFilaListaEsperaParaSlot,
  promoverListaEsperaAposCancelamento,
  type ListaEsperaPromocaoSlot,
} from '@/services/lista-espera-promocao-service';
import { getMapaDiarioAtividadeHorarios } from '@/services/mapa-diario-service';
import type { AtividadeOption } from '@/types/atividade';
import type {
  HorarioPresencaOption,
  ReservasAtividadeHoraResponse,
  TogglePresencaPayload,
  TogglePresencaResponse,
} from '@/types/presenca';
import {
  mapMapaDiarioFuturoToHorarioPresenca,
  normalizeReservasAtividadeHoraResponse,
} from '@/utils/normalize-presenca';
import { getPresencaDateWindow } from '@/utils/presenca-datetime';
import { sortMapaDiarioFuturoAsc } from '@/utils/mapa-diario-futuro';

export async function getAtividadesPresenca(
  academiasId: number,
  authToken: string,
): Promise<AtividadeOption[]> {
  const atividades = await getAtividadesByAcademia(academiasId, authToken);

  return mapAtividadesToOptions(atividades);
}

export async function getHorariosPresenca(
  academiasId: number,
  atividadeId: number,
  authToken: string,
  referenceDate: Date = new Date(),
): Promise<HorarioPresencaOption[]> {
  const items = await getMapaDiarioAtividadeHorarios(academiasId, authToken);
  const { inicio, fim } = getPresencaDateWindow(referenceDate);

  return sortMapaDiarioFuturoAsc(
    items.filter(
      (item) =>
        item.academias_id === academiasId &&
        item.atividades_id === atividadeId &&
        item.dataAtividade >= inicio &&
        item.dataAtividade <= fim,
    ),
  ).map((item) => mapMapaDiarioFuturoToHorarioPresenca(item));
}

export async function getReservasAtividadeHora(
  query: {
    academiasId: number;
    atividadesId: number;
    dataAtividade: number;
    mapadiarioId: number;
  },
  authToken: string,
): Promise<ReservasAtividadeHoraResponse> {
  const data = await authGetRequest<unknown>(
    buildReservasAtividadeHoraPath(query),
    authToken,
  );

  return normalizeReservasAtividadeHoraResponse(data);
}

export async function togglePresencaReserva(
  payload: TogglePresencaPayload,
  authToken: string,
): Promise<TogglePresencaResponse> {
  return authPatchRequest<TogglePresencaResponse>(
    buildReservasPresentePath(payload.reservaId),
    authToken,
    {
      presente: payload.presente,
    },
  );
}

export async function cancelarReservaPresenca(
  reservaId: number,
  reservaUsuarioId: number,
  gestorUserId: number,
  gestorNome: string,
  authToken: string,
  slot?: ListaEsperaPromocaoSlot,
  responsavelActor?: ReservaResponsavelActor,
): Promise<unknown> {
  const filaListaEspera = slot ? await prepararFilaListaEsperaParaSlot(slot, authToken) : [];

  const result = await cancelarReservaUsuario(
    {
      reservasId: reservaId,
      users_id: reservaUsuarioId,
      responsavel: gestorNome,
      responsavel_id: gestorUserId,
    },
    authToken,
  );

  if (slot && filaListaEspera.length > 0) {
    await promoverListaEsperaAposCancelamento(slot, authToken, {
      queue: filaListaEspera,
      responsavelActor:
        responsavelActor ??
        (gestorUserId > 0 && gestorNome.trim()
          ? { usersId: gestorUserId, nome: gestorNome.trim() }
          : undefined),
    });
  }

  return result;
}
