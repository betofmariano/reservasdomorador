export function compareClubNames(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
}

export function sortByClubNome<T extends { nome: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareClubNames(a.nome, b.nome));
}
