import { getAcademias } from '@/services/academias-service';
import { getAtividadeById, getAtividadesByAcademia } from '@/services/atividades-service';
import {
  criarReservaMensalPorSemana,
  excluirReservaMensalPorSemana,
  getReservasMensalPorSemanaByAcademia,
  getReservasUsuarioMensalPorSemana,
} from '@/services/reservas-mensal-por-semana-service';
import { getMapaMensalPorSemana } from '@/services/mapa-mensal-por-semana-service';
import { getMapaDiarioFuturo } from '@/services/mapa-diario-futuro-service';
import { cancelarReservaUsuario, criarReserva, criarReservaReact, getReservasUsuario } from '@/services/reservas-service';
import {
  prepararFilaListaEsperaParaSlot,
  promoverListaEsperaAposCancelamento,
  type ListaEsperaPromocaoSlot,
} from '@/services/lista-espera-promocao-service';
import type { ReservaSummary } from '@/types/home-summary';
import type { User } from '@/types/user';
import type { Academia } from '@/types/academia';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import type { CriarReservaResponse, ReservaResponsavelActor } from '@/types/reserva';
import type { ReservasUsuarioResponse } from '@/types/reserva-usuario';
import type { ListaEsperaRegistro } from '@/types/lista-espera';
import { findAcademiaById } from '@/utils/academia-publicidade';
import { academiaUsaCriarReservaReact } from '@/utils/academia-mensal-semana';
import {
  academiaOfereceMensalPorSemana,
  atividadeUsaMensalPorSemana,
} from '@/utils/atividade-programacao';
import { isAcademiaSemPublicidade } from '@/utils/academia-publicidade';
import { enrichMapaMensalPorSemanaComReservas } from '@/utils/mapa-mensal-por-semana-reserva';
import {
  assertMapaDiarioFuturoTemCapacidadeDisponivel,
  type MapaDiarioFuturoFilters,
} from '@/utils/mapa-diario-futuro';
import { isReservaQuadra } from '@/utils/reserva-adversario';

export async function resolveAcademiaForReserva(academiasId: number): Promise<Academia | null> {
  const academias = await getAcademias();

  return findAcademiaById(academias, academiasId);
}

export async function carregarMapaReservaHorario(
  authToken: string,
  filters: MapaDiarioFuturoFilters,
  academia: Academia | null,
  options?: { usaMensalPorSemana?: boolean },
): Promise<MapaDiarioFuturoItem[]> {
  const usaMensalPorSemana = options?.usaMensalPorSemana === true;

  if (usaMensalPorSemana) {
    const [mapa, reservas] = await Promise.all([
      getMapaMensalPorSemana(authToken, {
        academias_id: filters.academias_id,
        atividades_id: filters.atividades_id,
      }),
      getReservasMensalPorSemanaByAcademia(filters.academias_id, authToken),
    ]);

    return enrichMapaMensalPorSemanaComReservas(mapa, reservas);
  }

  return getMapaDiarioFuturo(authToken, {
    academias_id: filters.academias_id,
    atividades_id: filters.atividades_id,
  });
}

export async function confirmarReservaHorario(
  item: MapaDiarioFuturoItem,
  usersId: number,
  authToken: string,
  academia: Academia | null,
  responsavelActor: ReservaResponsavelActor,
  options?: { usaMensalPorSemana?: boolean },
): Promise<CriarReservaResponse> {
  assertMapaDiarioFuturoTemCapacidadeDisponivel(item);

  const responsavelId =
    responsavelActor.usersId > 0 ? responsavelActor.usersId : usersId;
  const responsavelNome = responsavelActor.nome.trim();

  const responsavelFields = {
    responsavel_id: responsavelId,
    responsavel: responsavelNome,
  };

  const usaMensalPorSemana = options?.usaMensalPorSemana === true;

  if (usaMensalPorSemana) {
    if (item.semana == null || item.semana <= 0) {
      throw new Error('Não foi possível identificar a semana do horário selecionado.');
    }

    return criarReservaMensalPorSemana(
      {
        mapamensalporsemana_id: item.id,
        users_id: usersId,
        semana: item.semana,
        atividadeunidade_id: item.atividadeunidade_id,
        ...responsavelFields,
      },
      authToken,
      { incluirBannerReserva: !isAcademiaSemPublicidade(academia) },
    );
  }

  const reservaPayload = {
    mapadiario_id: item.id,
    users_id: usersId,
    ...responsavelFields,
  };
  const reservaOptions = {
    incluirBannerReserva: !isAcademiaSemPublicidade(academia),
  };

  if (academiaUsaCriarReservaReact(academia)) {
    return criarReservaReact(reservaPayload, authToken, reservaOptions);
  }

  return criarReserva(reservaPayload, authToken, reservaOptions);
}

export async function getReservasUsuarioForUser(
  userId: number,
  authToken: string,
  academiasId: number,
  options?: { usaMensalPorSemana?: boolean },
): Promise<ReservasUsuarioResponse> {
  let usaMensalPorSemana = options?.usaMensalPorSemana;

  if (usaMensalPorSemana == null) {
    const atividades = await getAtividadesByAcademia(academiasId, authToken);
    usaMensalPorSemana = academiaOfereceMensalPorSemana({ atividades });
  }

  if (usaMensalPorSemana) {
    return getReservasUsuarioMensalPorSemana(userId, authToken);
  }

  return getReservasUsuario(userId, authToken);
}

export function resolveReservasMensalPorSemanaCancelId(
  reserva: Pick<ReservaSummary, 'id' | 'reservasdamha_id' | 'mapadiariodamha_id'>,
): number | null {
  if (reserva.reservasdamha_id > 0) {
    return reserva.reservasdamha_id;
  }

  if (reserva.mapadiariodamha_id > 0 && reserva.id > 0) {
    return reserva.id;
  }

  return null;
}

export function buildListaEsperaPromocaoSlotFromReserva(
  reserva: Pick<
    ReservaSummary,
    | 'academias_id'
    | 'atividades_id'
    | 'dataAtividade'
    | 'mapadiario_id'
    | 'mapadiariodamha_id'
    | 'semana'
    | 'atividade'
    | 'atividadeunidade_id'
  >,
): ListaEsperaPromocaoSlot {
  return {
    academias_id: reserva.academias_id,
    atividades_id: reserva.atividades_id,
    dataAtividade: reserva.dataAtividade,
    mapadiario_id: reserva.mapadiario_id,
    mapadiariodamha_id: reserva.mapadiariodamha_id,
    semana: reserva.semana,
    atividade: reserva.atividade,
    atividadeunidade_id: reserva.atividadeunidade_id,
  };
}

async function tryPromoverListaEsperaAposCancelamento(
  reserva: Pick<
    ReservaSummary,
    | 'academias_id'
    | 'atividades_id'
    | 'dataAtividade'
    | 'mapadiario_id'
    | 'mapadiariodamha_id'
    | 'semana'
    | 'atividade'
    | 'atividadeunidade_id'
  >,
  authToken: string,
  filaListaEspera?: ListaEsperaRegistro[],
): Promise<void> {
  if (isReservaQuadra(reserva) || reserva.atividades_id <= 0) {
    return;
  }

  if (filaListaEspera && filaListaEspera.length === 0) {
    return;
  }

  const slot = buildListaEsperaPromocaoSlotFromReserva(reserva);

  await promoverListaEsperaAposCancelamento(slot, authToken, {
    queue: filaListaEspera,
  });
}

async function resolveFilaListaEsperaBeforeCancel(
  reserva: Pick<
    ReservaSummary,
    | 'academias_id'
    | 'atividades_id'
    | 'dataAtividade'
    | 'mapadiario_id'
    | 'mapadiariodamha_id'
    | 'semana'
    | 'atividade'
    | 'atividadeunidade_id'
  >,
  authToken: string,
): Promise<ListaEsperaRegistro[] | undefined> {
  if (isReservaQuadra(reserva) || reserva.atividades_id <= 0) {
    return undefined;
  }

  return prepararFilaListaEsperaParaSlot(buildListaEsperaPromocaoSlotFromReserva(reserva), authToken);
}

export async function cancelarReservaForUser(
  reserva: Pick<
    ReservaSummary,
    | 'id'
    | 'academias_id'
    | 'reservasdamha_id'
    | 'mapadiariodamha_id'
    | 'atividades_id'
    | 'dataAtividade'
    | 'mapadiario_id'
    | 'semana'
    | 'atividade'
    | 'atividadeunidade_id'
  >,
  user: Pick<User, 'id' | 'nome'>,
  authToken: string,
): Promise<unknown> {
  const filaListaEspera = await resolveFilaListaEsperaBeforeCancel(reserva, authToken);
  const reservasMensalPorSemanaId = resolveReservasMensalPorSemanaCancelId(reserva);

  if (reservasMensalPorSemanaId != null) {
    const result = await excluirReservaMensalPorSemana(reservasMensalPorSemanaId, authToken);
    await tryPromoverListaEsperaAposCancelamento(reserva, authToken, filaListaEspera);
    return result;
  }

  if (reserva.atividades_id > 0) {
    try {
      const atividade = await getAtividadeById(reserva.atividades_id, authToken);

      if (atividadeUsaMensalPorSemana(atividade)) {
        const result = await excluirReservaMensalPorSemana(reserva.id, authToken);
        await tryPromoverListaEsperaAposCancelamento(reserva, authToken, filaListaEspera);
        return result;
      }
    } catch {
      // Segue para o cancelamento Diária.
    }
  }

  const result = await cancelarReservaUsuario(
    {
      reservasId: reserva.id,
      users_id: user.id,
      responsavel: user.nome,
      responsavel_id: user.id,
    },
    authToken,
  );

  await tryPromoverListaEsperaAposCancelamento(reserva, authToken, filaListaEspera);

  return result;
}
