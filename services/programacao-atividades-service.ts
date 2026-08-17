import { getMapaDiarioFuturo } from '@/services/mapa-diario-futuro-service';
import { getMapaDiarioAtividadeHorarios } from '@/services/mapa-diario-service';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import type { AtividadeProgramada } from '@/types/atividade-programada';
import {
  filterAtividadesProgramadasByLocal,
  mapMapaDiarioFuturoToAtividadeProgramada,
  sortAtividadesProgramadas,
} from '@/utils/programacao-atividades';

function mergeMapaDiarioItems(items: MapaDiarioFuturoItem[]): MapaDiarioFuturoItem[] {
  const byId = new Map<number, MapaDiarioFuturoItem>();

  for (const item of items) {
    byId.set(item.id, item);
  }

  return Array.from(byId.values());
}

export async function getProgramacaoAtividades(
  authToken: string,
  academiasId: number,
): Promise<AtividadeProgramada[]> {
  const [historico, futuro] = await Promise.all([
    getMapaDiarioAtividadeHorarios(academiasId, authToken),
    getMapaDiarioFuturo(authToken, { academias_id: academiasId }),
  ]);

  const mapped = mergeMapaDiarioItems([...historico, ...futuro]).map(
    mapMapaDiarioFuturoToAtividadeProgramada,
  );
  const filtered = filterAtividadesProgramadasByLocal(mapped, academiasId);

  return sortAtividadesProgramadas(filtered);
}
