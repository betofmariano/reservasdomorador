import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { APP_DISPLAY_NAME } from '@/constants/app-branding';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';

type AppConfirmModalProps = {
  visible: boolean;
  message: string;
  title?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function AppConfirmModal({
  visible,
  message,
  title,
  cancelLabel = 'Cancelar',
  confirmLabel = 'OK',
  destructive = false,
  onCancel,
  onConfirm,
}: AppConfirmModalProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WEB_MAX_CONTENT_WIDTH;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[styles.card, isWide && styles.cardWide]}
          onPress={(event) => event.stopPropagation()}>
          <Text style={styles.appName}>{APP_DISPLAY_NAME}</Text>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                destructive ? styles.destructiveButton : styles.confirmButton,
              ]}
              onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: MATCHPOINT_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: MATCHPOINT_COLORS.white,
    borderRadius: 14,
    padding: 20,
  },
  cardWide: {
    alignSelf: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.blue,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: MATCHPOINT_COLORS.navy,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#EEF1F6',
  },
  confirmButton: {
    backgroundColor: MATCHPOINT_COLORS.blue,
  },
  destructiveButton: {
    backgroundColor: MATCHPOINT_COLORS.error,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.navy,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.white,
  },
});
