import {
  API_ENDPOINTS,
  buildReservasMensalPorSemanaItemPath,
  buildReservasMensalPorSemanaListPath,
  buildReservasUsuarioMensalPorSemanaPath,
} from '@/constants/api';
import { authDeleteRequest, authGetRequest, authPostRequest } from '@/services/api-client';
import { notifyCriarReservaWhatsAppIfNeeded } from '@/services/reservas-service';
import type {
  CriarReservaMensalPorSemanaPayload,
  CriarReservaMensalPorSemanaResponse,
} from '@/types/reserva-mensal-por-semana';
import type { ReservasUsuarioResponse } from '@/types/reserva-usuario';
import {
  enrichReservasUsuarioOwner,
  normalizeReservasUsuarioListFromApi,
} from '@/utils/normalize-reserva-usuario';
import { unwrapReservaResponse } from '@/utils/reserva';

/**
 * Fluxo MensalPorSemana. Não usado pelo padrão Diária.
 */
export async function getReservasUsuarioMensalPorSemana(
  userId: number,
  authToken: string,
): Promise<ReservasUsuarioResponse> {
  const data = await authGetRequest<unknown>(
    buildReservasUsuarioMensalPorSemanaPath(userId),
    authToken,
  );

  return enrichReservasUsuarioOwner(normalizeReservasUsuarioListFromApi(data), userId);
}

/** Reservas válidas do usuário no local, incluindo passadas, para validar limite semanal. */
export async function getReservasMensalPorSemanaLimiteSemanalUsuario(
  userId: number,
  academiasId: number,
  authToken: string,
): Promise<ReservasUsuarioResponse> {
  if (userId <= 0 || academiasId <= 0) {
    return [];
  }

  const reservas = await getReservasMensalPorSemanaByAcademia(academiasId, authToken);

  // Inclui canceladas para o client liberar células/mapa; o limite semanal ignora cancelado.
  return reservas.filter(
    (reserva) => reserva.users_id === userId || reserva.responsavel_id === userId,
  );
}

export async function getReservasMensalPorSemanaByAcademia(
  academiasId: number,
  authToken: string,
): Promise<ReservasUsuarioResponse> {
  const data = await authGetRequest<unknown>(
    buildReservasMensalPorSemanaListPath(academiasId),
    authToken,
  );

  return normalizeReservasUsuarioListFromApi(data);
}

export async function excluirReservaMensalPorSemana(
  reservasMensalPorSemanaId: number,
  authToken: string,
): Promise<unknown> {
  return authDeleteRequest(buildReservasMensalPorSemanaItemPath(reservasMensalPorSemanaId), authToken);
}

export async function criarReservaMensalPorSemana(
  payload: CriarReservaMensalPorSemanaPayload,
  authToken: string,
  options?: { incluirBannerReserva?: boolean },
): Promise<CriarReservaMensalPorSemanaResponse> {
  console.log('Reserva MensalPorSemana iniciada');

  const data = unwrapReservaResponse(
    await authPostRequest<CriarReservaMensalPorSemanaResponse>(
      API_ENDPOINTS.criarReservaMensalPorSemana,
      authToken,
      {
        users_id: payload.users_id,
        mapamensalporsemana_id: payload.mapamensalporsemana_id,
        ...(payload.atividadeunidade_id != null && payload.atividadeunidade_id > 0
          ? { atividadeunidade_id: payload.atividadeunidade_id }
          : {}),
      },
    ),
  );

  console.log('Resposta de criarReservaMensalPorSemana recebida');

  await notifyCriarReservaWhatsAppIfNeeded(data, {
    incluirBannerReserva: options?.incluirBannerReserva ?? true,
    mensalSemana: true,
  });

  return data;
}
