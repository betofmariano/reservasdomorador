import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { WEB_MAX_WIDE_CONTENT_WIDTH } from '@/constants/web-layout';

type AdminTableScrollContainerProps = {
  minWidth: number;
  maxWidth?: number;
  centerWhenScreenWiderThan?: number;
  children: ReactNode;
};

/** Padding horizontal típico das listas admin (16 + 16). */
const LIST_HORIZONTAL_GUTTER = 32;

export function AdminTableScrollContainer({
  minWidth,
  maxWidth,
  centerWhenScreenWiderThan,
  children,
}: AdminTableScrollContainerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const tableMaxWidth = maxWidth ?? Math.max(minWidth, WEB_MAX_WIDE_CONTENT_WIDTH);
  const viewportWidth = Math.max(0, screenWidth - LIST_HORIZONTAL_GUTTER);
  const needsHorizontalScroll = minWidth > viewportWidth + 0.5;
  const shouldCenterTable =
    centerWhenScreenWiderThan != null &&
    screenWidth > centerWhenScreenWiderThan &&
    screenWidth >= minWidth;

  const tableContent = (
    <View
      style={[
        styles.tableWrapper,
        needsHorizontalScroll
          ? { width: minWidth, minWidth, maxWidth: tableMaxWidth }
          : { width: '100%', maxWidth: tableMaxWidth },
      ]}>
      {children}
    </View>
  );

  if (shouldCenterTable || !needsHorizontalScroll) {
    return (
      <View style={styles.tableScroll}>
        {shouldCenterTable ? (
          <View style={styles.tableCenteredOuter}>{tableContent}</View>
        ) : (
          tableContent
        )}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      style={styles.tableScroll}
      showsHorizontalScrollIndicator
      nestedScrollEnabled
      directionalLockEnabled
      contentContainerStyle={styles.tableScrollContent}>
      {tableContent}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tableScroll: {
    flex: 1,
    width: '100%',
  },
  tableScrollContent: {
    flexGrow: 1,
  },
  tableCenteredOuter: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  tableWrapper: {
    flex: 1,
  },
});
