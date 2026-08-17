import { getWebConstrainedWidth } from '@/utils/web-layout';

export const FOOTER_ICON_GAP = 10;
export const FOOTER_HORIZONTAL_PADDING = 32;
export const FOOTER_ICON_SIZE_MAX = 87;
export const FOOTER_TOP_PADDING = 10;
export const FOOTER_BOTTOM_PADDING = 8;
export const FOOTER_VERTICAL_EXTRA = FOOTER_TOP_PADDING + FOOTER_BOTTOM_PADDING;

export function getHomePatrocinadoresFooterIconSize(
  windowWidth: number,
  iconCount: number,
): number {
  if (iconCount <= 0) {
    return FOOTER_ICON_SIZE_MAX;
  }

  const contentWidth = getWebConstrainedWidth(windowWidth);
  const availableWidth = contentWidth - FOOTER_HORIZONTAL_PADDING;
  const totalGap = FOOTER_ICON_GAP * Math.max(iconCount - 1, 0);
  const fitSize = Math.floor((availableWidth - totalGap) / iconCount);

  return Math.min(FOOTER_ICON_SIZE_MAX, Math.max(fitSize, 48));
}

export function getHomePatrocinadoresFooterHeight(
  windowWidth: number,
  iconCount: number,
): number {
  return getHomePatrocinadoresFooterIconSize(windowWidth, iconCount) + FOOTER_VERTICAL_EXTRA;
}
