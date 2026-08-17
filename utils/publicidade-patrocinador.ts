import type { Patrocinador } from '@/types/publicidade';
import { normalizeMediaUrl } from '@/utils/publicidade-links';

export function isPatrocinadorValido(value: unknown): value is Patrocinador {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Patrocinador;

  return typeof record.id === 'number' && record.id > 0 && record.ativa === true;
}

export function getPatrocinadorBannerImageUrl(patrocinador: Patrocinador): string | null {
  return (
    normalizeMediaUrl(patrocinador.bannerAtual) ??
    normalizeMediaUrl(patrocinador.banner?.url)
  );
}

export function getPatrocinadorLogoImageUrl(patrocinador: Patrocinador): string | null {
  return (
    normalizeMediaUrl(patrocinador.logoAtual) ??
    normalizeMediaUrl(patrocinador.logo?.url)
  );
}

export function selectPatrocinadoresFooter(
  patrocinadores: Patrocinador[],
  limit: number = 4,
): Patrocinador[] {
  return patrocinadores
    .filter(
      (patrocinador) =>
        patrocinador.ativa === true &&
        Boolean(getPatrocinadorLogoImageUrl(patrocinador)) &&
        Boolean(getPatrocinadorBannerImageUrl(patrocinador)),
    )
    .slice(0, limit);
}

export function getPatrocinadorPopupImageUrl(patrocinador: Patrocinador): string | null {
  return getPatrocinadorBannerImageUrl(patrocinador);
}

export function getPatrocinadorTitulo(patrocinador: Patrocinador): string | null {
  if (patrocinador.empresa?.trim()) {
    return patrocinador.empresa.trim();
  }

  return null;
}

export function getPatrocinadorSubtitulo(patrocinador: Patrocinador): string | null {
  if (patrocinador.slogan?.trim()) {
    return patrocinador.slogan.trim();
  }

  return null;
}
