import { getAtividades } from '@/services/atividades-service';
import type { Atividade } from '@/types/atividade';
import type { ReservaUsuario } from '@/types/reserva-usuario';

export async function buildAtividadesByIdMapForReservas(
  reservas: Array<Pick<ReservaUsuario, 'academias_id'>>,
): Promise<Map<number, Atividade>> {
  const academiasIds = [
    ...new Set(reservas.map((reserva) => reserva.academias_id).filter((id) => id > 0)),
  ];
  const atividadesById = new Map<number, Atividade>();

  await Promise.all(
    academiasIds.map(async (academiasId) => {
      const atividades = await getAtividades(academiasId);

      for (const atividade of atividades) {
        atividadesById.set(atividade.id, atividade);
      }
    }),
  );

  return atividadesById;
}

export function resolveReservaAtividadeNome(
  reserva: Pick<ReservaUsuario, 'atividades_id' | 'atividade'>,
  atividadesById: Map<number, Atividade>,
): string | null {
  const fromReserva = reserva.atividade?.trim() || '';

  if (fromReserva) {
    return fromReserva;
  }

  if (reserva.atividades_id > 0) {
    const fromTable = atividadesById.get(reserva.atividades_id)?.atividade?.trim();

    if (fromTable) {
      return fromTable;
    }
  }

  return null;
}
