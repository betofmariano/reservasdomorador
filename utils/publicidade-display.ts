import type { PublicidadeLinkAction } from '@/types/publicidade';

export const PUBLICIDADE_DISPLAY_BANNER = 'Banner';
export const PUBLICIDADE_DISPLAY_BANNER_RODAPE = 'Banner Rodapé';
export const PUBLICIDADE_DISPLAY_INSTAGRAM_RODAPE = 'Instagram Rodapé';
export const PUBLICIDADE_DISPLAY_WHATSAPP_RODAPE = 'WhastApp Rodapé';
export const PUBLICIDADE_DISPLAY_SITE_DELIVERY_RODAPE = 'Site/Delivery Rodapé';

export type PublicidadeDisplayOrigem =
  | typeof PUBLICIDADE_DISPLAY_BANNER
  | typeof PUBLICIDADE_DISPLAY_BANNER_RODAPE
  | typeof PUBLICIDADE_DISPLAY_INSTAGRAM_RODAPE
  | typeof PUBLICIDADE_DISPLAY_WHATSAPP_RODAPE
  | typeof PUBLICIDADE_DISPLAY_SITE_DELIVERY_RODAPE;

export function getPublicidadeLinkClickDisplay(
  action: PublicidadeLinkAction,
): PublicidadeDisplayOrigem {
  if (action === 'instagram') {
    return PUBLICIDADE_DISPLAY_INSTAGRAM_RODAPE;
  }

  if (action === 'whatsapp') {
    return PUBLICIDADE_DISPLAY_WHATSAPP_RODAPE;
  }

  return PUBLICIDADE_DISPLAY_SITE_DELIVERY_RODAPE;
}
