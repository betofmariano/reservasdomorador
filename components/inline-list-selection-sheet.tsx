import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MATCHPOINT_COLORS } from '@/constants/theme';
import { usePickerSheetLayout } from '@/hooks/use-picker-sheet-layout';

type InlineListSelectionSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
};

export function InlineListSelectionSheet({
  visible,
  title,
  onClose,
  children,
  maxWidth,
}: InlineListSelectionSheetProps) {
  const { overlayStyle, cardStyle } = usePickerSheetLayout({ maxWidth });

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.host}>
      <Pressable style={[styles.overlay, overlayStyle]} onPress={onClose}>
        <Pressable
          style={[styles.card, cardStyle]}
          onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  overlay: {
    flex: 1,
    backgroundColor: MATCHPOINT_COLORS.overlay,
  },
  card: {
    backgroundColor: MATCHPOINT_COLORS.white,
    padding: 16,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  list: {
    maxHeight: 320,
  },
});
