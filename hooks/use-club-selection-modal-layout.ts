import { Platform, useWindowDimensions } from 'react-native';

import {
  CLUB_SELECTION_MODAL_LARGE_SCREEN_BREAKPOINT,
  CLUB_SELECTION_MODAL_MAX_WIDTH,
  WEB_MAX_CONTENT_WIDTH,
} from '@/constants/web-layout';
import { usePickerSheetLayout } from '@/hooks/use-picker-sheet-layout';

type UseClubSelectionModalLayoutOptions = {
  maxWidth?: number;
};

export function useClubSelectionModalLayout(options?: UseClubSelectionModalLayoutOptions) {
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(
    options?.maxWidth ?? CLUB_SELECTION_MODAL_MAX_WIDTH,
    WEB_MAX_CONTENT_WIDTH,
  );
  const pickerLayout = usePickerSheetLayout({ maxWidth });
  const isLargeScreen =
    Platform.OS === 'web' || width >= CLUB_SELECTION_MODAL_LARGE_SCREEN_BREAKPOINT;

  return {
    isLargeScreen,
    overlayStyle: isLargeScreen
      ? {
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          paddingHorizontal: 20,
        }
      : undefined,
    contentStyle: isLargeScreen
      ? {
          width: '100%' as const,
          maxWidth,
          alignSelf: 'center' as const,
        }
      : undefined,
    nestedOverlayStyle: pickerLayout.overlayStyle,
    nestedCardStyle: pickerLayout.cardStyle,
  };
}
