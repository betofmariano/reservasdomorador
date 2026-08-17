export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesSearchText(name: string, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  const normalizedName = normalizeSearchText(name);
  const words = normalizedQuery.split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    return normalizedName.includes(normalizedQuery);
  }

  return words.every((word) => normalizedName.includes(word));
}
