import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';

export const LISTA_RESERVA_TABLE_MIN_WIDTH = 980;
export const LISTA_RESERVA_MENSAL_TABLE_MIN_WIDTH = 490;
export const LISTA_RESERVA_MENSAL_TABLE_MIN_WIDTH_COM_UNIDADE = 590;
export const LISTA_RESERVA_LIST_HORIZONTAL_PADDING = 32;

export type ListaReservasTableVariant = 'default' | 'mensalPorSemana';

export type ListaReservasTableLayout = {
  tableWidth: number;
  isCompact: boolean;
  variant: ListaReservasTableVariant;
};

export function getListaReservasTableLayout(
  screenWidth: number,
  variant: ListaReservasTableVariant = 'default',
  _options?: { showUnidade?: boolean },
): ListaReservasTableLayout {
  const contentWidth =
    screenWidth <= WEB_MAX_CONTENT_WIDTH ? screenWidth : WEB_MAX_CONTENT_WIDTH;
  const availableWidth = Math.max(0, contentWidth - LISTA_RESERVA_LIST_HORIZONTAL_PADDING);

  // MensalPorSemana: preenche a largura da tela; o nome quebra linha (sem forçar scroll).
  if (variant === 'mensalPorSemana') {
    return {
      tableWidth: availableWidth,
      isCompact: false,
      variant,
    };
  }

  const isCompact = screenWidth <= WEB_MAX_CONTENT_WIDTH;
  const tableWidth = isCompact ? LISTA_RESERVA_TABLE_MIN_WIDTH : availableWidth;

  return { tableWidth, isCompact, variant };
}
