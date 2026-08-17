import { Platform } from 'react-native';

import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';

export function getWebConstrainedWidth(windowWidth: number): number {
  if (Platform.OS !== 'web') {
    return windowWidth;
  }

  return Math.min(windowWidth, WEB_MAX_CONTENT_WIDTH);
}
