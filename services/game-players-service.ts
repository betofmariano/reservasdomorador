import { API_ENDPOINTS } from '@/constants/api';
import { getAcademias } from '@/services/academias-service';
import { authGetRequest, authPatchRequest } from '@/services/api-client';
import { sendWzapAdicionar } from '@/services/jogos-service';
import { getPublicidadeBanner } from '@/services/publicidade-service';
import type {
  ClearGamePlayersSelectionPayload,
  SaveGamePlayersPayload,
  SaveGamePlayersResponse,
} from '@/types/game-players';
import type { Jogo } from '@/types/jogo';
import { findAcademiaById, isAcademiaSemPublicidade } from '@/utils/academia-publicidade';

function buildLimparSelecaoJogoPath(jogosId: number): string {
  const params = new URLSearchParams({
    jogos_id: String(jogosId),
  });

  return `${API_ENDPOINTS.limparSelecaoJogo}?${params.toString()}`;
}

export async function clearGamePlayersSelection(
  payload: ClearGamePlayersSelectionPayload,
  authToken: string,
): Promise<Jogo> {
  return authGetRequest<Jogo>(buildLimparSelecaoJogoPath(payload.jogos_id), authToken);
}

export async function saveGamePlayers(
  payload: SaveGamePlayersPayload,
  authToken: string,
): Promise<SaveGamePlayersResponse> {
  if (payload.jogoDuplas) {
    return authPatchRequest<SaveGamePlayersResponse>(
      API_ENDPOINTS.adicionarJogadoresDuplas,
      authToken,
      {
        jogos_id: payload.jogos_id,
        responsavel_id: payload.responsavel_id,
        adversario_id: payload.adversario_id,
        parceiro1_id: payload.parceiro1_id,
        parceiro2_id: payload.parceiro2_id,
      },
    );
  }

  return authPatchRequest<SaveGamePlayersResponse>(
    API_ENDPOINTS.adicionarJogadoresSimples,
    authToken,
    {
      jogos_id: payload.jogos_id,
      responsavel_id: payload.responsavel_id,
      adversario_id: payload.adversario_id,
    },
  );
}

export type NotifyParceirosAdicionadosPayload = {
  jogos_id: number;
  academias_id: number;
};

export async function notifyParceirosAdicionadosViaWhatsApp(
  payload: NotifyParceirosAdicionadosPayload,
  authToken: string,
): Promise<void> {
  try {
    const academias = await getAcademias();
    const academia = findAcademiaById(academias, payload.academias_id);

    if (isAcademiaSemPublicidade(academia)) {
      if (__DEV__) {
        console.log('Banner de reserva omitido: academia sem publicidade');
      }

      return;
    }

    const banner = await getPublicidadeBanner();

    await sendWzapAdicionar(
      {
        jogos_id: payload.jogos_id,
        academias_id: payload.academias_id,
        publicidade_id: banner.id,
      },
      authToken,
    );
  } catch {
    console.log('Não foi possível enviar WhatsApp após adicionar parceiros');
  }
}
