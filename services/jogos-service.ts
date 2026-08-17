import { API_ENDPOINTS } from '@/constants/api';
import { authGetRequest, postRequest } from '@/services/api-client';
import type {
  CancelarJogoPayload,
  CancelarJogoResponse,
  Jogo,
  JogosFilters,
  JogosResponse,
  SendWzapEsperaMatchPlacePayload,
  SendWzapEsperaPayload,
  SendWzapEsperaResponse,
  SendWzapAdicionarPayload,
  SendWzapAdicionarResponse,
  SendWzapReservaPayload,
  SendWzapReservaResponse,
} from '@/types/jogo';

function buildJogosPath(filters: JogosFilters): string {
  const params = new URLSearchParams({
    academias_id: String(filters.academias_id),
    dataCorte: String(filters.dataCorte),
  });

  return `${API_ENDPOINTS.jogos}?${params.toString()}`;
}

function buildCancelarJogoPath(payload: CancelarJogoPayload): string {
  const params = new URLSearchParams({
    jogos_id: String(payload.jogos_id),
    users_id: String(payload.users_id),
  });

  return `${API_ENDPOINTS.cancelarJogo}?${params.toString()}`;
}

function buildSendWzapEsperaPath(payload: SendWzapEsperaPayload): string {
  const params = new URLSearchParams({
    jogos_id: String(payload.jogos_id),
    academias_id: String(payload.academias_id),
  });

  return `${API_ENDPOINTS.sendWzapEspera}?${params.toString()}`;
}

function buildSendWzapAdicionarPath(payload: SendWzapAdicionarPayload): string {
  const params = new URLSearchParams({
    jogos_id: String(payload.jogos_id),
    academias_id: String(payload.academias_id),
    publicidade_id: String(payload.publicidade_id),
  });

  return `${API_ENDPOINTS.sendWzapAdicionar}?${params.toString()}`;
}

export async function sendWzapEsperaMatchPlace(
  payload: SendWzapEsperaMatchPlacePayload,
): Promise<SendWzapEsperaResponse> {
  return postRequest<SendWzapEsperaResponse>(API_ENDPOINTS.sendWzapEspera, payload);
}

export async function sendWzapEspera(
  payload: SendWzapEsperaPayload,
  authToken: string,
): Promise<SendWzapEsperaResponse> {
  return authGetRequest<SendWzapEsperaResponse>(buildSendWzapEsperaPath(payload), authToken);
}

export async function sendWzapAdicionar(
  payload: SendWzapAdicionarPayload,
  authToken: string,
): Promise<SendWzapAdicionarResponse> {
  return authGetRequest<SendWzapAdicionarResponse>(buildSendWzapAdicionarPath(payload), authToken);
}

export async function sendWzapReserva(
  payload: SendWzapReservaPayload,
): Promise<SendWzapReservaResponse> {
  return postRequest<SendWzapReservaResponse>(API_ENDPOINTS.sendWzapReserva, {
    reservas_id: payload.reservas_id,
  });
}

export async function sendWzapReservaReact(
  payload: SendWzapReservaPayload,
): Promise<SendWzapReservaResponse> {
  return postRequest<SendWzapReservaResponse>(API_ENDPOINTS.sendWzapReservaReact, {
    reservas_id: payload.reservas_id,
  });
}

export async function getJogos(filters: JogosFilters, authToken: string): Promise<JogosResponse> {
  const data = await authGetRequest<JogosResponse>(buildJogosPath(filters), authToken);

  return data.filter((jogo) => !jogo.cancelado);
}

export async function getJogoDetalhe(
  academiasId: number,
  jogosId: number,
  dataJogo: number,
  authToken: string,
): Promise<Jogo | null> {
  const jogos = await getJogos(
    {
      academias_id: academiasId,
      dataCorte: dataJogo,
    },
    authToken,
  );

  return jogos.find((jogo) => jogo.id === jogosId) ?? null;
}

export async function cancelarJogo(
  payload: CancelarJogoPayload,
  authToken: string,
): Promise<CancelarJogoResponse> {
  console.log('Cancelamento solicitado');
  console.log('Identificador do jogo disponível:', Boolean(payload.jogos_id));

  const data = await authGetRequest<CancelarJogoResponse>(
    buildCancelarJogoPath(payload),
    authToken,
  );

  console.log('Resposta do cancelamento recebida');

  try {
    await sendWzapEspera(
      {
        jogos_id: data.id,
        academias_id: data.academias_id,
      },
      authToken,
    );
  } catch {
    console.log('Não foi possível notificar a lista de espera via WhatsApp');
  }

  return data;
}

export type ApagarJogosCanceladosResponse = Record<string, unknown>;

export async function apagarJogosCancelados(
  authToken: string,
): Promise<ApagarJogosCanceladosResponse> {
  console.log('Exclusão de jogos cancelados solicitada');

  const data = await authGetRequest<ApagarJogosCanceladosResponse>(
    API_ENDPOINTS.apagarJogosCancelados,
    authToken,
  );

  console.log('Resposta da exclusão de jogos cancelados recebida');

  return data;
}
