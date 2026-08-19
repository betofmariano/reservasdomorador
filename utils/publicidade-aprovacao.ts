import type { Patrocinador, PublicidadeImage } from '@/types/publicidade';
import { normalizeMediaUrl } from '@/utils/publicidade-links';

export type PublicidadeTextoPendente = {
  key: 'telefone' | 'slogan' | 'instagram' | 'website' | 'direcionamento';
  label: string;
  atual: string;
  novo: string;
};

export type PublicidadeImagemPendente = {
  key: 'logo' | 'banner' | 'popup' | 'whatsapp';
  label: string;
  atualUrl: string | null;
  novoUrl: string | null;
  novoImage: PublicidadeImage | null;
};

export type PublicidadePendencias = {
  textos: PublicidadeTextoPendente[];
  imagens: PublicidadeImagemPendente[];
};

function textValue(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function hasTextChange(novo: string | null | undefined, atual: string | null | undefined): boolean {
  const next = textValue(novo);
  return Boolean(next) && next !== textValue(atual);
}

function hasUrlChange(novo: string | null | undefined, atual: string | null | undefined): boolean {
  const next = normalizeMediaUrl(novo);
  const current = normalizeMediaUrl(atual);

  if (!next) {
    return false;
  }

  return next !== current;
}

function websiteNovoOf(patrocinador: Patrocinador): string {
  return textValue(patrocinador.webSiteNovo) || textValue(patrocinador.websiteNovo);
}

function imageNovoUrl(
  trocar: PublicidadeImage | null | undefined,
  novoUrl: string | null | undefined,
): string | null {
  return normalizeMediaUrl(trocar?.url) ?? normalizeMediaUrl(novoUrl);
}

export function getPublicidadePendencias(patrocinador: Patrocinador): PublicidadePendencias {
  const textos: PublicidadeTextoPendente[] = [];
  const imagens: PublicidadeImagemPendente[] = [];

  if (hasTextChange(patrocinador.telefoneNovo, patrocinador.telefone)) {
    textos.push({
      key: 'telefone',
      label: 'WhatsApp',
      atual: textValue(patrocinador.telefone),
      novo: textValue(patrocinador.telefoneNovo),
    });
  }

  if (hasTextChange(patrocinador.sloganNovo, patrocinador.slogan)) {
    textos.push({
      key: 'slogan',
      label: 'Slogan',
      atual: textValue(patrocinador.slogan),
      novo: textValue(patrocinador.sloganNovo),
    });
  }

  if (hasTextChange(patrocinador.instagramNovo, patrocinador.instagram)) {
    textos.push({
      key: 'instagram',
      label: 'Instagram',
      atual: textValue(patrocinador.instagram),
      novo: textValue(patrocinador.instagramNovo),
    });
  }

  if (hasTextChange(websiteNovoOf(patrocinador), patrocinador.website)) {
    textos.push({
      key: 'website',
      label: 'website',
      atual: textValue(patrocinador.website),
      novo: websiteNovoOf(patrocinador),
    });
  }

  if (hasTextChange(patrocinador.direcionamentoNovo, patrocinador.direcionamento)) {
    textos.push({
      key: 'direcionamento',
      label: 'redirecionamento',
      atual: textValue(patrocinador.direcionamento),
      novo: textValue(patrocinador.direcionamentoNovo),
    });
  }

  const logoNovoUrl = imageNovoUrl(patrocinador.logoTrocar, patrocinador.logoNovo);
  const logoAtualUrl = normalizeMediaUrl(patrocinador.logoAtual) ?? normalizeMediaUrl(patrocinador.logo?.url);
  if (patrocinador.logoTrocar || hasUrlChange(logoNovoUrl, logoAtualUrl)) {
    imagens.push({
      key: 'logo',
      label: 'Logotipo',
      atualUrl: logoAtualUrl,
      novoUrl: logoNovoUrl,
      novoImage: patrocinador.logoTrocar ?? null,
    });
  }

  const bannerNovoUrl = imageNovoUrl(patrocinador.bannerTrocar, patrocinador.bannerNovo);
  const bannerAtualUrl =
    normalizeMediaUrl(patrocinador.bannerAtual) ?? normalizeMediaUrl(patrocinador.banner?.url);
  if (patrocinador.bannerTrocar || hasUrlChange(bannerNovoUrl, bannerAtualUrl)) {
    imagens.push({
      key: 'banner',
      label: 'Banner Principal',
      atualUrl: bannerAtualUrl,
      novoUrl: bannerNovoUrl,
      novoImage: patrocinador.bannerTrocar ?? null,
    });
  }

  const popupNovoUrl = imageNovoUrl(patrocinador.popupTelaTrocar, patrocinador.popupTelaNovo);
  const popupAtualUrl =
    normalizeMediaUrl(patrocinador.popupTelaAtual) ?? normalizeMediaUrl(patrocinador.popupTela?.url);
  if (patrocinador.popupTelaTrocar || hasUrlChange(popupNovoUrl, popupAtualUrl)) {
    imagens.push({
      key: 'popup',
      label: 'Popup Tela',
      atualUrl: popupAtualUrl,
      novoUrl: popupNovoUrl,
      novoImage: patrocinador.popupTelaTrocar ?? null,
    });
  }

  const whatsappNovoUrl = imageNovoUrl(patrocinador.wzQuadroTrocar, patrocinador.wzquadroNovo);
  const whatsappAtualUrl =
    normalizeMediaUrl(patrocinador.wzQuadroAtual) ?? normalizeMediaUrl(patrocinador.wzquadro?.url);
  if (patrocinador.wzQuadroTrocar || hasUrlChange(whatsappNovoUrl, whatsappAtualUrl)) {
    imagens.push({
      key: 'whatsapp',
      label: 'WhatsApp',
      atualUrl: whatsappAtualUrl,
      novoUrl: whatsappNovoUrl,
      novoImage: patrocinador.wzQuadroTrocar ?? null,
    });
  }

  return { textos, imagens };
}

export function hasPublicidadePendencias(patrocinador: Patrocinador): boolean {
  const pendencias = getPublicidadePendencias(patrocinador);
  return pendencias.textos.length > 0 || pendencias.imagens.length > 0;
}

export function buildPatrocinadorAprovacaoPayload(
  patrocinador: Patrocinador,
): Record<string, unknown> | null {
  const pendencias = getPublicidadePendencias(patrocinador);

  if (pendencias.textos.length === 0 && pendencias.imagens.length === 0) {
    return null;
  }

  const data: Record<string, unknown> = {};

  for (const texto of pendencias.textos) {
    if (texto.key === 'telefone') {
      data.telefone = texto.novo;
      data.telefoneNovo = '';
    }

    if (texto.key === 'slogan') {
      data.slogan = texto.novo;
      data.sloganNovo = '';
    }

    if (texto.key === 'instagram') {
      data.instagram = texto.novo;
      data.instagramNovo = '';
    }

    if (texto.key === 'website') {
      data.website = texto.novo;
      data.webSiteNovo = '';
      data.websiteNovo = '';
    }

    if (texto.key === 'direcionamento') {
      data.direcionamento = texto.novo;
      data.direcionamentoNovo = '';
    }
  }

  for (const imagem of pendencias.imagens) {
    if (imagem.key === 'logo') {
      if (imagem.novoImage) {
        data.logo = imagem.novoImage;
        data.logoTrocar = null;
      }

      if (imagem.novoUrl) {
        data.logoAtual = imagem.novoUrl;
        data.logoNovo = '';
      }
    }

    if (imagem.key === 'banner') {
      if (imagem.novoImage) {
        data.banner = imagem.novoImage;
        data.bannerTrocar = null;
      }

      if (imagem.novoUrl) {
        data.bannerAtual = imagem.novoUrl;
        data.bannerNovo = '';
      }
    }

    if (imagem.key === 'popup') {
      if (imagem.novoImage) {
        data.popupTela = imagem.novoImage;
        data.popupTelaTrocar = null;
      }

      if (imagem.novoUrl) {
        data.popupTelaAtual = imagem.novoUrl;
        data.popupTelaNovo = '';
      }
    }

    if (imagem.key === 'whatsapp') {
      if (imagem.novoImage) {
        data.wzquadro = imagem.novoImage;
        data.wzQuadroTrocar = null;
      }

      if (imagem.novoUrl) {
        data.wzQuadroAtual = imagem.novoUrl;
        data.wzquadroNovo = '';
      }
    }
  }

  return Object.keys(data).length > 0 ? data : null;
}
