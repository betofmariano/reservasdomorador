import type { ListaEsperaRegistro } from '@/types/lista-espera';
import { isListaEsperaPendente } from '@/utils/lista-espera-visivel';

export type ListaEsperaPosicaoInfo = {
  posicao: number;
  totalNaLista: number;
};

export function getListaEsperaQueueKey(
  registro: Pick<ListaEsperaRegistro, 'academias_id' | 'atividades_id' | 'dataAtividade'>,
): string {
  return `${registro.academias_id}:${registro.atividades_id}:${registro.dataAtividade ?? 0}`;
}

function sortQueueEntries(entries: ListaEsperaRegistro[]): ListaEsperaRegistro[] {
  return [...entries].sort((left, right) => {
    if (left.created_at !== right.created_at) {
      return left.created_at - right.created_at;
    }

    return left.id - right.id;
  });
}

export function buildListaEsperaPosicaoMap(
  userEntries: ListaEsperaRegistro[],
  allEntries: ListaEsperaRegistro[],
  referenceDate: Date = new Date(),
): Map<number, ListaEsperaPosicaoInfo> {
  const posicaoById = new Map<number, ListaEsperaPosicaoInfo>();
  const queueByKey = new Map<string, ListaEsperaRegistro[]>();

  for (const entry of allEntries) {
    if (!isListaEsperaPendente(entry)) {
      continue;
    }

    if (!entry.dataAtividade || entry.dataAtividade < referenceDate.getTime()) {
      continue;
    }

    const key = getListaEsperaQueueKey(entry);
    const queue = queueByKey.get(key) ?? [];
    queue.push(entry);
    queueByKey.set(key, queue);
  }

  for (const userEntry of userEntries) {
    if (!userEntry.dataAtividade) {
      continue;
    }

    const key = getListaEsperaQueueKey(userEntry);
    const queue = sortQueueEntries(queueByKey.get(key) ?? []);
    const index = queue.findIndex((entry) => entry.id === userEntry.id);

    if (index >= 0) {
      posicaoById.set(userEntry.id, {
        posicao: index + 1,
        totalNaLista: queue.length,
      });
    }
  }

  return posicaoById;
}

export function getListaEsperaQueueForSlot(
  allEntries: ListaEsperaRegistro[],
  slot: Pick<ListaEsperaRegistro, 'academias_id' | 'atividades_id' | 'dataAtividade'>,
  referenceDate: Date = new Date(),
): ListaEsperaRegistro[] {
  const key = getListaEsperaQueueKey(slot);

  return sortQueueEntries(
    allEntries.filter((entry) => {
      if (!isListaEsperaPendente(entry)) {
        return false;
      }

      if (!entry.dataAtividade || entry.dataAtividade < referenceDate.getTime()) {
        return false;
      }

      return getListaEsperaQueueKey(entry) === key;
    }),
  );
}

export function formatListaEsperaPosicaoLabel(posicao: number, totalNaLista: number): string {
  return `${posicao}º de ${totalNaLista}`;
}
