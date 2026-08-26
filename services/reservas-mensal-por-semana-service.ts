import {
  API_ENDPOINTS,
  buildCancelarReservaMensalPorSemanaPath,
  buildReservasMensalPorSemanaListPath,
  buildReservasUsuarioMensalPorSemanaPath,
} from '@/constants/api';
import { authGetRequest, authPatchRequest, authPostRequest } from '@/services/api-client';
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

/** Reservas válidas do usuário no condomínio, incluindo passadas, para validar limite semanal. */
export async function getReservasMensalPorSemanaLimiteSemanalUsuario(
  userId: number,
  academiasId: number,
  authToken: string,
): Promise<ReservasUsuarioResponse> {
  if (userId <= 0) {
    return [];
  }

  const reservas = await getReservasUsuarioMensalPorSemana(userId, authToken);

  return reservas.filter((reserva) => {
    if (reserva.users_id !== userId && reserva.responsavel_id !== userId) {
      return false;
    }

    if (academiasId > 0 && reserva.academias_id > 0 && reserva.academias_id !== academiasId) {
      return false;
    }

    return true;
  });
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
  return authPatchRequest(
    buildCancelarReservaMensalPorSemanaPath(reservasMensalPorSemanaId),
    authToken,
    {},
  );
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
        mapamensalporsemana_id: payload.mapamensalporsemana_id,
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
