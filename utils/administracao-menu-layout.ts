import { HOME_MAX_BUTTON_WIDTH, WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { getWebConstrainedWidth } from '@/utils/web-layout';

export const ADMINISTRACAO_MENU_COLUMN_GAP = 20;

export function getAdministracaoMenuButtonWidth(screenWidth: number): number {
  const referenceWidth = Math.min(screenWidth, WEB_MAX_CONTENT_WIDTH);

  return Math.min(getWebConstrainedWidth(referenceWidth) * 0.8, HOME_MAX_BUTTON_WIDTH);
}

export function isAdministracaoWideLayout(screenWidth: number): boolean {
  return screenWidth > WEB_MAX_CONTENT_WIDTH;
}

export function getAdministracaoTwoColumnSectionWidth(screenWidth: number): number {
  const buttonWidth = getAdministracaoMenuButtonWidth(screenWidth);

  return buttonWidth * 2 + ADMINISTRACAO_MENU_COLUMN_GAP;
}

export function getAdministracaoScreenMaxWidth(
  screenWidth: number,
  options: { useGestaoTwoColumns?: boolean } = {},
): number {
  if (!isAdministracaoWideLayout(screenWidth)) {
    return WEB_MAX_CONTENT_WIDTH;
  }

  if (options.useGestaoTwoColumns) {
    return getAdministracaoTwoColumnSectionWidth(screenWidth);
  }

  return getAdministracaoMenuButtonWidth(screenWidth);
}
