import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';

type WebScreenContainerProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  maxWidth?: number;
};

export function WebScreenContainer({
  children,
  style,
  maxWidth = WEB_MAX_CONTENT_WIDTH,
}: WebScreenContainerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const shouldCenter = Platform.OS === 'web' || screenWidth >= maxWidth;

  if (!shouldCenter) {
    return <View style={[styles.nativeContainer, style]}>{children}</View>;
  }

  return (
    <View style={[styles.webOuter, style]}>
      <View style={[styles.webInner, { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
    width: '100%',
  },
  webOuter: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  webInner: {
    flex: 1,
    width: '100%',
  },
});
