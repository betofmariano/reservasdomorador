import { normalizeSearchText } from '@/utils/search-text';

/** Ordem preferencial nos seletores de atividade; demais ficam em ordem alfabética. */
const ATIVIDADE_NOME_PRIORITY = ['quadra de tenis', 'quadras de areia'] as const;

function getAtividadeNomePriority(nome: string): number {
  const key = normalizeSearchText(nome);
  const index = ATIVIDADE_NOME_PRIORITY.findIndex((item) => item === key);
  return index >= 0 ? index : ATIVIDADE_NOME_PRIORITY.length;
}

export function sortAtividadesByNomePriority<T extends { nome: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const priorityDiff = getAtividadeNomePriority(a.nome) - getAtividadeNomePriority(b.nome);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
  });
}

export function resolveAtividadeIdByPriorityNome(
  items: Array<{ id: number; nome: string }>,
): number | null {
  const tenis = items.find(
    (item) => normalizeSearchText(item.nome) === ATIVIDADE_NOME_PRIORITY[0],
  );

  return tenis?.id ?? items[0]?.id ?? null;
}
