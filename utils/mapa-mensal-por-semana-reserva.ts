import type {
  MapaMensalPorSemanaReservaResumo,
  MapaDiarioFuturoItem,
} from '@/types/mapa-diario-futuro';
import type { ReservaUsuario } from '@/types/reserva-usuario';
import {
  normalizeRecordId,
  readCanceladoFlag,
  readPersonName,
  readPersonPhoto,
  readString,
  readTimestamp,
  readUserId,
} from '@/utils/normalize-api-fields';
import { formatFullDateLabel, formatGameTime } from '@/utils/jogos-time';
import { normalizePhotoUrl } from '@/utils/user-photo';
import { getMapaDiarioFuturoVagasLivres, resolveMapaDiarioCelulaConteudo } from '@/utils/mapa-diario-futuro';

export type MapaDiarioCelulaIndisponivelViewModel = {
  hasReserva: boolean;
  nome: string;
  foto: string | null;
  dataHoraReserva: string;
  dataReservada: string;
  fallbackMessage: string;
};

function readNestedRecord(
  record: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> | null {
  for (const key of keys) {
    const value = record[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }

  return null;
}

export function normalizeMapaMensalPorSemanaReservaResumoFromApi(
  raw: unknown,
): MapaMensalPorSemanaReservaResumo | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = normalizeRecordId(record.id);

  if (id == null) {
    return null;
  }

  const usersId = readUserId(record) ?? 0;
  const nestedUsers = readNestedRecord(record, ['_users', 'users', 'user']);
  const nome =
    readString(record, ['nome']).trim() ||
    readPersonName(record) ||
    (nestedUsers ? readPersonName(nestedUsers) : '');

  return {
    id,
    nome,
    users_id: usersId,
    foto: normalizePhotoUrl(nestedUsers ? readPersonPhoto(nestedUsers) : '') || null,
    dataAtividade: readTimestamp(record, ['dataAtividade', 'data_atividade']) ?? 0,
    created_at:
      readTimestamp(record, ['createdAt', 'created_at']) ??
      readTimestamp(record, ['created_at']) ??
      0,
    cancelado: readCanceladoFlag(record),
  };
}

export function toMapaMensalPorSemanaReservaResumo(
  reserva: ReservaUsuario,
): MapaMensalPorSemanaReservaResumo {
  return {
    id: reserva.id,
    nome: reserva.nome?.trim() || reserva.responsavel?.nome?.trim() || '',
    users_id: reserva.users_id,
    foto:
      normalizePhotoUrl(reserva.foto) ||
      normalizePhotoUrl(reserva.responsavel?.foto) ||
      null,
    dataAtividade: reserva.dataAtividade,
    created_at: reserva.created_at,
    cancelado: reserva.cancelado,
  };
}

export function resolveMapaMensalPorSemanaReservaNome(
  reserva: MapaMensalPorSemanaReservaResumo,
): string {
  if (reserva.nome.trim()) {
    return reserva.nome.trim();
  }

  if (reserva.users_id > 0) {
    return `Usuário #${reserva.users_id}`;
  }

  return 'Não informado';
}

export function enrichMapaMensalPorSemanaComReservas(
  items: MapaDiarioFuturoItem[],
  reservas: ReservaUsuario[],
): MapaDiarioFuturoItem[] {
  const byReservaId = new Map<number, MapaMensalPorSemanaReservaResumo>();
  const byMapaId = new Map<number, MapaMensalPorSemanaReservaResumo>();
  const cancelledReservaIds = new Set<number>();
  const cancelledMapaIds = new Set<number>();

  for (const reserva of reservas) {
    // Soft-delete: cancelado=true não deve ocupar célula do mapa nem a vaga da semana.
    if (reserva.cancelado) {
      if (reserva.id > 0) {
        cancelledReservaIds.add(reserva.id);
      }
      if (reserva.reservasdamha_id > 0) {
        cancelledReservaIds.add(reserva.reservasdamha_id);
      }
      if (reserva.mapadiariodamha_id > 0) {
        cancelledMapaIds.add(reserva.mapadiariodamha_id);
      }
      continue;
    }

    const resumo = toMapaMensalPorSemanaReservaResumo(reserva);

    byReservaId.set(reserva.id, resumo);

    if (reserva.mapadiariodamha_id > 0) {
      byMapaId.set(reserva.mapadiariodamha_id, resumo);
    }
  }

  return items.map((item) => {
    const linkedToCancelled =
      (item.reservasdamha_id > 0 && cancelledReservaIds.has(item.reservasdamha_id)) ||
      cancelledMapaIds.has(item.id) ||
      item.reservaMensalPorSemana?.cancelado === true;

    if (linkedToCancelled) {
      return {
        ...item,
        ocupacao: 0,
        reservasdamha_id: 0,
        reservaMensalPorSemana: null,
      };
    }

    if (item.reservaMensalPorSemana) {
      return item;
    }

    if (getMapaDiarioFuturoVagasLivres(item) > 0) {
      return item;
    }

    const reservaMensalPorSemana =
      (item.reservasdamha_id > 0 ? byReservaId.get(item.reservasdamha_id) : undefined) ??
      byMapaId.get(item.id) ??
      null;

    if (!reservaMensalPorSemana) {
      return item;
    }

    return {
      ...item,
      reservaMensalPorSemana,
    };
  });
}

function formatDataHoraReserva(timestamp: number): string {
  if (timestamp <= 0) {
    return 'Não informado';
  }

  const date = new Date(timestamp);

  return `${formatFullDateLabel(date)} - ${formatGameTime(timestamp)} hs`;
}

function formatDataReservada(timestamp: number): string {
  return formatDataHoraReserva(timestamp);
}

export function buildMapaDiarioCelulaIndisponivelViewModel(
  item: MapaDiarioFuturoItem,
): MapaDiarioCelulaIndisponivelViewModel {
  const reserva = item.reservaMensalPorSemana;
  const dataAtividade = reserva?.dataAtividade || item.dataAtividade;

  if (!reserva) {
    return {
      hasReserva: false,
      nome: 'Horário indisponível',
      foto: null,
      dataHoraReserva: formatDataHoraReserva(dataAtividade),
      dataReservada: 'Não informado',
      fallbackMessage: resolveMapaDiarioCelulaConteudo(item),
    };
  }

  return {
    hasReserva: true,
    nome: resolveMapaMensalPorSemanaReservaNome(reserva),
    foto: reserva.foto,
    dataHoraReserva: formatDataHoraReserva(dataAtividade),
    dataReservada: formatDataReservada(reserva.created_at),
    fallbackMessage: '',
  };
}

export function readMapaMensalPorSemanaReservaResumoFromMapRecord(
  record: Record<string, unknown>,
): MapaMensalPorSemanaReservaResumo | null {
  const nestedReserva = readNestedRecord(record, [
    '_reservasmensalporsemana',
    'reservasmensalporsemana',
    '_reservasMensalPorSemana',
    'reservasMensalPorSemana',
    '_reservasdamha',
    'reservasdamha',
    '_reservasDamha',
    'reservasDamha',
  ]);

  if (!nestedReserva) {
    return null;
  }

  const resumo = normalizeMapaMensalPorSemanaReservaResumoFromApi(nestedReserva);

  if (!resumo || resumo.cancelado) {
    return null;
  }

  return resumo;
}
