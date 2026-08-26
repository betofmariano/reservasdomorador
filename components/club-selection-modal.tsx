import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useClubSelectionModalLayout } from '@/hooks/use-club-selection-modal-layout';

type ClubSelectionModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  scrollable?: boolean;
  maxHeight?: number | `${number}%`;
  contentStyle?: StyleProp<ViewStyle>;
};

const COLORS = {
  navy: '#3A2154',
};

export function ClubSelectionModal({
  visible,
  title,
  onClose,
  children,
  scrollable = true,
  maxHeight = 320,
  contentStyle,
}: ClubSelectionModalProps) {
  const { overlayStyle, contentStyle: largeScreenContentStyle } = useClubSelectionModalLayout();

  const body = scrollable ? <ScrollView>{children}</ScrollView> : children;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, overlayStyle]} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContent,
            largeScreenContentStyle,
            { maxHeight },
            contentStyle,
          ]}
          onPress={(event) => event.stopPropagation()}>
          <Text style={styles.modalTitle}>{title}</Text>
          {body}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
  },
});
