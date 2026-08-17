import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import type { ReservaUsuario } from '@/types/reserva-usuario';

/**
 * Completa atividadeunidade_id/unidadeNome a partir do mapa quando a reserva
 * ainda não traz o campo (legado). Reservas novas já vêm com atividadeunidade_id.
 */
export function enrichReservasUsuarioComUnidadeDoMapa(
  reservas: ReservaUsuario[],
  mapa: MapaDiarioFuturoItem[],
): ReservaUsuario[] {
  if (reservas.length === 0 || mapa.length === 0) {
    return reservas;
  }

  const unidadeByMapaId = new Map<number, { id: number; nome: string | null }>();

  for (const item of mapa) {
    const unidadeId = item.atividadeunidade_id;

    if (unidadeId == null || unidadeId <= 0 || item.id <= 0) {
      continue;
    }

    unidadeByMapaId.set(item.id, {
      id: unidadeId,
      nome: item.atividadeUnidadeNome,
    });
  }

  if (unidadeByMapaId.size === 0) {
    return reservas;
  }

  return reservas.map((reserva) => {
    if ((reserva.atividadeunidade_id ?? 0) > 0) {
      return reserva;
    }

    const mapaId = reserva.mapadiariodamha_id;

    if (mapaId <= 0) {
      return reserva;
    }

    const fromMapa = unidadeByMapaId.get(mapaId);

    if (!fromMapa) {
      return reserva;
    }

    return {
      ...reserva,
      atividadeunidade_id: fromMapa.id,
      unidadeNome: reserva.unidadeNome?.trim() || fromMapa.nome,
    };
  });
}

/** IDs de mapa das reservas que ainda não têm unidade preenchida. */
export function collectMapaIdsParaEnrichUnidade(reservas: ReservaUsuario[]): number[] {
  return [
    ...new Set(
      reservas
        .filter((reserva) => (reserva.atividadeunidade_id ?? 0) <= 0)
        .map((reserva) => reserva.mapadiariodamha_id)
        .filter((id) => id > 0),
    ),
  ];
}
