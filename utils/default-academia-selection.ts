import type { Academia } from '@/types/academia';

/** Academia padrão inicial nas telas administrativas. */
export const PREFERRED_ACADEMIA_ID = 1;

export function resolveDefaultAcademiaId(
  academias: Academia[],
  preferredId: number = PREFERRED_ACADEMIA_ID,
): number | null {
  if (academias.length === 0) {
    return null;
  }

  const preferred = academias.find((academia) => academia.id === preferredId);

  return preferred?.id ?? academias[0].id;
}
