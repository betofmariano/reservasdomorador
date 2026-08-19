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
  return (
    normalizeMediaUrl(patrocinador.popupTelaAtual) ??
    normalizeMediaUrl(patrocinador.popupTela?.url) ??
    getPatrocinadorBannerImageUrl(patrocinador)
  );
}

export function getPatrocinadorWhatsAppImageUrl(patrocinador: Patrocinador): string | null {
  return (
    normalizeMediaUrl(patrocinador.wzQuadroAtual) ??
    normalizeMediaUrl(patrocinador.wzquadro?.url)
  );
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

export function isPatrocinadorDoUsuario(
  patrocinador: Patrocinador,
  userId: number | null | undefined,
): boolean {
  return Boolean(userId) && Number(patrocinador.users_id) === Number(userId);
}

export function selectPatrocinadoresDoUsuario(
  patrocinadores: Patrocinador[],
  userId: number | null | undefined,
): Patrocinador[] {
  if (!userId) {
    return [];
  }

  return patrocinadores.filter((patrocinador) => isPatrocinadorDoUsuario(patrocinador, userId));
}

function sortPatrocinadoresByEmpresa(patrocinadores: Patrocinador[]): Patrocinador[] {
  return [...patrocinadores].sort((left, right) =>
    (left.empresa || '').localeCompare(right.empresa || '', 'pt-BR', { sensitivity: 'base' }),
  );
}

export function selectPatrocinadoresGerenciaveis(
  patrocinadores: Patrocinador[],
  userId: number | null | undefined,
  canManageAll: boolean,
): Patrocinador[] {
  if (canManageAll) {
    return sortPatrocinadoresByEmpresa(patrocinadores);
  }

  return sortPatrocinadoresByEmpresa(selectPatrocinadoresDoUsuario(patrocinadores, userId));
}

function firstNonEmptyUrl(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const url = normalizeMediaUrl(value);

    if (url) {
      return url;
    }
  }

  return null;
}

export function getPatrocinadorLogoPreviewUrl(patrocinador: Patrocinador): string | null {
  return firstNonEmptyUrl(
    patrocinador.logoTrocar?.url,
    patrocinador.logoNovo,
    patrocinador.logoAtual,
    patrocinador.logo?.url,
  );
}

export function getPatrocinadorBannerPreviewUrl(patrocinador: Patrocinador): string | null {
  return firstNonEmptyUrl(
    patrocinador.bannerTrocar?.url,
    patrocinador.bannerNovo,
    patrocinador.bannerAtual,
    patrocinador.banner?.url,
  );
}

export function getPatrocinadorPopupPreviewUrl(patrocinador: Patrocinador): string | null {
  return firstNonEmptyUrl(
    patrocinador.popupTelaTrocar?.url,
    patrocinador.popupTelaNovo,
    patrocinador.popupTelaAtual,
    patrocinador.popupTela?.url,
  );
}

export function getPatrocinadorWhatsAppPreviewUrl(patrocinador: Patrocinador): string | null {
  return firstNonEmptyUrl(
    patrocinador.wzQuadroTrocar?.url,
    patrocinador.wzquadroNovo,
    patrocinador.wzQuadroAtual,
    patrocinador.wzquadro?.url,
  );
}
