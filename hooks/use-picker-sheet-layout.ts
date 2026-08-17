import { Platform, useWindowDimensions } from 'react-native';

import {
  CLUB_SELECTION_MODAL_LARGE_SCREEN_BREAKPOINT,
  CLUB_SELECTION_MODAL_MAX_WIDTH,
  WEB_MAX_CONTENT_WIDTH,
} from '@/constants/web-layout';

type UsePickerSheetLayoutOptions = {
  maxWidth?: number;
};

export function usePickerSheetLayout(options?: UsePickerSheetLayoutOptions) {
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(
    options?.maxWidth ?? CLUB_SELECTION_MODAL_MAX_WIDTH,
    WEB_MAX_CONTENT_WIDTH,
  );
  const isLargeScreen =
    Platform.OS === 'web' || width >= CLUB_SELECTION_MODAL_LARGE_SCREEN_BREAKPOINT;

  return {
    isLargeScreen,
    overlayStyle: isLargeScreen
      ? {
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
          paddingHorizontal: 16,
        }
      : {
          justifyContent: 'flex-end' as const,
        },
    cardStyle: isLargeScreen
      ? {
          width: '100%' as const,
          maxWidth,
          alignSelf: 'center' as const,
          borderRadius: 12,
        }
      : {
          width: '100%' as const,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
  };
}
