import type { ListaReservaItem } from '@/types/lista-reserva';
import type { ReservaUsuario } from '@/types/reserva-usuario';
import { normalizeCalendarDate } from '@/utils/jogos-time';
import { resolveReservaAtividadeNome } from '@/utils/reserva-atividade';
import type { Atividade, AtividadeOption } from '@/types/atividade';
import {
  resolveAtividadeIdByPriorityNome,
  sortAtividadesByNomePriority,
} from '@/utils/atividade-nome-priority';

export function sortListaReservasAtividadeOptions(
  options: AtividadeOption[],
): AtividadeOption[] {
  return sortAtividadesByNomePriority(options);
}

/** Atividade com mais reservas ativas entre as opções do seletor. */
export function resolveAtividadeIdMaisReservada(
  options: Array<{ id: number }>,
  reservas: Array<{ atividades_id: number; cancelado?: boolean }>,
): number | null {
  if (options.length === 0) {
    return null;
  }

  const optionIds = new Set(options.map((item) => item.id));
  const counts = new Map<number, number>();

  for (const reserva of reservas) {
    if (reserva.cancelado) {
      continue;
    }

    const atividadesId = reserva.atividades_id;

    if (atividadesId <= 0 || !optionIds.has(atividadesId)) {
      continue;
    }

    counts.set(atividadesId, (counts.get(atividadesId) ?? 0) + 1);
  }

  let bestId: number | null = null;
  let bestCount = 0;

  for (const [atividadesId, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestId = atividadesId;
    }
  }

  return bestId;
}

/**
 * Atividade inicial do filtro: a que a pessoa mais reserva no local;
 * fallback para prioridade de nome (ex.: Quadra de Tênis).
 */
export function resolveListaReservasAtividadeInicial(
  options: AtividadeOption[],
  reservas: Array<{ atividades_id: number; cancelado?: boolean }> = [],
): number | null {
  return (
    resolveAtividadeIdMaisReservada(options, reservas) ??
    resolveAtividadeIdByPriorityNome(options)
  );
}

export function buildDayStartTimestamp(date: Date): number {
  return normalizeCalendarDate(date).getTime();
}

export function buildDayEndTimestamp(date: Date): number {
  const end = normalizeCalendarDate(date);
  end.setHours(23, 59, 59, 999);

  return end.getTime();
}

export function filterListaReservasByPeriod(
  items: ListaReservaItem[],
  startDate: Date,
  endDate: Date,
): ListaReservaItem[] {
  const start = buildDayStartTimestamp(startDate);
  const end = buildDayEndTimestamp(endDate);

  return [...items]
    .filter((item) => !item.cancelado && item.dataAtividade >= start && item.dataAtividade <= end)
    .sort((a, b) => a.dataAtividade - b.dataAtividade);
}

export function filterListaReservasAtivas(items: ListaReservaItem[]): ListaReservaItem[] {
  return [...items]
    .filter((item) => !item.cancelado)
    .sort((a, b) => a.dataAtividade - b.dataAtividade);
}

function readUsuarioNomeFromReserva(reserva: ReservaUsuario): string {
  if (reserva.responsavel_id > 0 && reserva.responsavel_id !== reserva.users_id) {
    return reserva.nome?.trim() || '';
  }

  return reserva.nome?.trim() || reserva.responsavel?.nome?.trim() || '';
}

function readResponsavelNomeFromReserva(reserva: ReservaUsuario): string | null {
  if (reserva.responsavel_id <= 0 || reserva.responsavel_id === reserva.users_id) {
    return null;
  }

  return reserva.responsavel?.nome?.trim() || null;
}

export function filterListaReservasByAtividade(
  items: ListaReservaItem[],
  atividadesId: number,
): ListaReservaItem[] {
  if (atividadesId <= 0) {
    return items;
  }

  return items.filter((item) => item.atividades_id === atividadesId);
}

export function formatListaReservaMensalPorSemanaDataHora(timestamp: number): string {
  if (timestamp <= 0) {
    return 'Não informado';
  }

  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month} - ${hours}:${minutes}`;
}

export function mapReservasMensalPorSemanaToListaItems(
  reservas: ReservaUsuario[],
  localNome: string,
  atividadesById: Map<number, Atividade>,
  unidadesById?: Map<number, string>,
): ListaReservaItem[] {
  return reservas.map((reserva) => {
    const unidadeId =
      reserva.atividadeunidade_id != null && reserva.atividadeunidade_id > 0
        ? reserva.atividadeunidade_id
        : null;
    const unidadeNome =
      (unidadeId != null ? unidadesById?.get(unidadeId)?.trim() : null) ||
      reserva.unidadeNome?.trim() ||
      null;

    return {
      id: reserva.reservasdamha_id > 0 ? reserva.reservasdamha_id : reserva.id,
      users_id: reserva.users_id,
      dataAtividade: reserva.dataAtividade,
      academias_id: reserva.academias_id,
      atividades_id: reserva.atividades_id,
      localNome,
      atividade: resolveReservaAtividadeNome(reserva, atividadesById) ?? 'Não informada',
      usuarioNome: readUsuarioNomeFromReserva(reserva),
      responsavelNome: readResponsavelNomeFromReserva(reserva),
      atividadeunidade_id: unidadeId,
      unidadeNome,
      cancelado: reserva.cancelado,
      limiteCancelamento: reserva.limiteCancelamento,
      usaMensalPorSemana: true,
      mapadiariodamha_id: reserva.mapadiariodamha_id,
    };
  });
}

export function collectUsersIdsFromListaReservas(items: ListaReservaItem[]): number[] {
  return items.map((item) => item.users_id).filter((id) => id > 0);
}
