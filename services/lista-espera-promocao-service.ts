import { criarReservaMensalPorSemana } from '@/services/reservas-mensal-por-semana-service';
import {
  criarReserva,
  criarReservaReact,
  validarCondicoesCriarReserva,
} from '@/services/reservas-service';
import { resolveAcademiaForReserva } from '@/services/reserva-horario-flow-service';
import { getAtividadeById } from '@/services/atividades-service';
import { getMapaMensalPorSemana } from '@/services/mapa-mensal-por-semana-service';
import { getMapaDiarioFuturo } from '@/services/mapa-diario-futuro-service';
import { marcarListaEsperaComoAvisada, syncListaEsperaContatoFromUsuario } from '@/services/lista-espera-service';
import { getRelatorioListaEsperaByAcademia } from '@/services/relatorio-lista-espera-service';
import { getUserById } from '@/services/user-service';
import type { Academia } from '@/types/academia';
import type { Atividade } from '@/types/atividade';
import type { ListaEsperaRegistro } from '@/types/lista-espera';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import type { ReservaResponsavelActor } from '@/types/reserva';
import { academiaUsaCriarReservaReact } from '@/utils/academia-mensal-semana';
import { resolveUsaMensalPorSemana } from '@/utils/atividade-programacao';
import { isAcademiaSemPublicidade } from '@/utils/academia-publicidade';
import { getListaEsperaQueueForSlot } from '@/utils/lista-espera-posicao';
import { mapaDiarioFuturoTemCapacidadeDisponivel } from '@/utils/mapa-diario-futuro';
import { isReservaResponseSuccess } from '@/utils/reserva';

export type ListaEsperaPromocaoSlot = {
  academias_id: number;
  atividades_id: number;
  dataAtividade: number;
  mapadiario_id: number;
  mapadiariodamha_id?: number;
  semana?: number | null;
  atividade?: string | null;
  atividadeunidade_id?: number | null;
};

export type ListaEsperaPromocaoResult = {
  promoted: boolean;
  usersId?: number;
  listaEsperaId?: number;
};

function canPromoverListaEsperaParaSlot(
  slot: ListaEsperaPromocaoSlot,
  isMensalPorSemana: boolean,
): boolean {
  if (slot.academias_id <= 0 || slot.atividades_id <= 0 || slot.dataAtividade <= 0) {
    return false;
  }

  if (isMensalPorSemana) {
    return (slot.mapadiariodamha_id ?? 0) > 0 && (slot.semana ?? 0) > 0;
  }

  return slot.mapadiario_id > 0;
}

async function resolveMensalPorSemanaForSlot(
  slot: ListaEsperaPromocaoSlot,
  authToken: string,
  academia?: Academia | null,
): Promise<{ academia: Academia | null; atividade: Atividade | null; usaMensalPorSemana: boolean }> {
  const [resolvedAcademia, resolvedAtividade] = await Promise.all([
    academia !== undefined ? Promise.resolve(academia) : resolveAcademiaForReserva(slot.academias_id),
    slot.atividades_id > 0
      ? getAtividadeById(slot.atividades_id, authToken).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    academia: resolvedAcademia,
    atividade: resolvedAtividade,
    usaMensalPorSemana: resolveUsaMensalPorSemana({
      atividade: resolvedAtividade,
    }),
  };
}

async function resolveMapaSlotAtual(
  slot: ListaEsperaPromocaoSlot,
  authToken: string,
  usaMensalPorSemana: boolean,
): Promise<MapaDiarioFuturoItem | null> {
  const query = {
    academias_id: slot.academias_id,
    atividades_id: slot.atividades_id,
  };

  if (usaMensalPorSemana) {
    const mapaId = slot.mapadiariodamha_id ?? 0;
    if (mapaId <= 0) {
      return null;
    }

    const mapa = await getMapaMensalPorSemana(authToken, query);
    return mapa.find((item) => item.id === mapaId) ?? null;
  }

  if (slot.mapadiario_id <= 0) {
    return null;
  }

  const mapa = await getMapaDiarioFuturo(authToken, query);
  return mapa.find((item) => item.id === slot.mapadiario_id) ?? null;
}

async function slotTemCapacidadeDisponivel(
  slot: ListaEsperaPromocaoSlot,
  authToken: string,
  usaMensalPorSemana: boolean,
): Promise<boolean> {
  try {
    const mapaItem = await resolveMapaSlotAtual(slot, authToken, usaMensalPorSemana);

    if (!mapaItem) {
      return false;
    }

    return mapaDiarioFuturoTemCapacidadeDisponivel(mapaItem);
  } catch {
    return false;
  }
}

export type ListaEsperaPromocaoOptions = {
  queue?: ListaEsperaRegistro[];
  responsavelActor?: ReservaResponsavelActor;
};

function resolveResponsavelActorForEntry(
  entry: ListaEsperaRegistro,
  responsavelActor?: ReservaResponsavelActor,
): ReservaResponsavelActor {
  if (responsavelActor && responsavelActor.usersId > 0 && responsavelActor.nome.trim()) {
    return {
      usersId: responsavelActor.usersId,
      nome: responsavelActor.nome.trim(),
    };
  }

  const nome = entry.nome.trim() || 'Usuário';

  return {
    usersId: entry.users_id,
    nome,
  };
}

function buildReservaFields(
  usersId: number,
  responsavelActor: ReservaResponsavelActor,
): { responsavel_id: number; responsavel: string } {
  const responsavelId =
    responsavelActor.usersId > 0 ? responsavelActor.usersId : usersId;

  return {
    responsavel_id: responsavelId,
    responsavel: responsavelActor.nome.trim(),
  };
}

export async function prepararFilaListaEsperaParaSlot(
  slot: ListaEsperaPromocaoSlot,
  authToken: string,
): Promise<ListaEsperaRegistro[]> {
  const { usaMensalPorSemana } = await resolveMensalPorSemanaForSlot(slot, authToken);

  if (!canPromoverListaEsperaParaSlot(slot, usaMensalPorSemana)) {
    return [];
  }

  const allEntries = await getRelatorioListaEsperaByAcademia(slot.academias_id, authToken);

  return getListaEsperaQueueForSlot(allEntries, slot);
}

async function criarReservaPromovidaDaListaEspera(
  slot: ListaEsperaPromocaoSlot,
  entry: ListaEsperaRegistro,
  authToken: string,
  responsavelActor: ReservaResponsavelActor,
  academia: Academia | null,
  usaMensalPorSemana: boolean,
) {
  const responsavelFields = buildReservaFields(entry.users_id, responsavelActor);
  const incluirBannerReserva = !isAcademiaSemPublicidade(academia);

  if (usaMensalPorSemana) {
    if (slot.semana == null || slot.semana <= 0) {
      throw new Error('Não foi possível identificar a semana do horário selecionado.');
    }

    let atividadeunidadeId = slot.atividadeunidade_id ?? null;

    if ((atividadeunidadeId ?? 0) <= 0) {
      const mapaItem = await resolveMapaSlotAtual(slot, authToken, true);
      atividadeunidadeId = mapaItem?.atividadeunidade_id ?? null;
    }

    return criarReservaMensalPorSemana(
      {
        mapamensalporsemana_id: slot.mapadiariodamha_id!,
        users_id: entry.users_id,
        semana: slot.semana,
        atividadeunidade_id: atividadeunidadeId,
        ...responsavelFields,
      },
      authToken,
      { incluirBannerReserva },
    );
  }

  const validation = await validarCondicoesCriarReserva(
    {
      mapadiario_id: slot.mapadiario_id,
      users_id: entry.users_id,
      listaespera_id: entry.id,
      ...responsavelFields,
    },
    authToken,
  );

  if (!isReservaResponseSuccess(validation)) {
    return validation;
  }

  const reservaPayload = {
    mapadiario_id: slot.mapadiario_id,
    users_id: entry.users_id,
    ...responsavelFields,
  };
  const reservaOptions = { incluirBannerReserva };

  if (academiaUsaCriarReservaReact(academia)) {
    return criarReservaReact(reservaPayload, authToken, reservaOptions);
  }

  return criarReserva(reservaPayload, authToken, reservaOptions);
}

export async function promoverProximoDaListaEspera(
  slot: ListaEsperaPromocaoSlot,
  authToken: string,
  options?: ListaEsperaPromocaoOptions,
): Promise<ListaEsperaPromocaoResult> {
  const { academia, usaMensalPorSemana } = await resolveMensalPorSemanaForSlot(slot, authToken);

  if (!canPromoverListaEsperaParaSlot(slot, usaMensalPorSemana)) {
    return { promoted: false };
  }

  const temVaga = await slotTemCapacidadeDisponivel(slot, authToken, usaMensalPorSemana);

  if (!temVaga) {
    return { promoted: false };
  }

  const queue =
    options?.queue ??
    getListaEsperaQueueForSlot(
      await getRelatorioListaEsperaByAcademia(slot.academias_id, authToken),
      slot,
    );

  if (queue.length === 0) {
    return { promoted: false };
  }

  for (const entry of queue) {
    if (entry.users_id <= 0) {
      continue;
    }

    const responsavelActor = resolveResponsavelActorForEntry(entry, options?.responsavelActor);

    try {
      const usuario = await getUserById(entry.users_id, authToken);

      if (usuario) {
        try {
          await syncListaEsperaContatoFromUsuario(entry.id, usuario, authToken);
        } catch {
          if (__DEV__) {
            console.warn('Não foi possível sincronizar o contato da lista de espera com o cadastro do usuário.');
          }
        }
      }

      const response = await criarReservaPromovidaDaListaEspera(
        slot,
        entry,
        authToken,
        responsavelActor,
        academia,
        usaMensalPorSemana,
      );

      if (!isReservaResponseSuccess(response)) {
        continue;
      }

      try {
        await marcarListaEsperaComoAvisada(entry.id, authToken);
      } catch {
        if (__DEV__) {
          console.warn('Reserva promovida, mas não foi possível marcar a lista de espera como avisada.');
        }
      }

      return {
        promoted: true,
        usersId: entry.users_id,
        listaEsperaId: entry.id,
      };
    } catch {
      continue;
    }
  }

  return { promoted: false };
}

export async function promoverListaEsperaAposCancelamento(
  slot: ListaEsperaPromocaoSlot,
  authToken: string,
  options?: ListaEsperaPromocaoOptions,
): Promise<ListaEsperaPromocaoResult> {
  try {
    return await promoverProximoDaListaEspera(slot, authToken, options);
  } catch {
    return { promoted: false };
  }
}
