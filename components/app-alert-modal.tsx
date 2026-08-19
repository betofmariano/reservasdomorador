import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { APP_DISPLAY_NAME } from '@/constants/app-branding';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';

type AppAlertModalProps = {
  visible: boolean;
  message: string;
  title?: string;
  okLabel?: string;
  onClose: () => void;
};

export function AppAlertModal({
  visible,
  message,
  title,
  okLabel = 'OK',
  onClose,
}: AppAlertModalProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WEB_MAX_CONTENT_WIDTH;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.card, isWide && styles.cardWide]}
          onPress={(event) => event.stopPropagation()}>
          <Text style={styles.appName}>{APP_DISPLAY_NAME}</Text>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <Text style={styles.message}>{message}</Text>

          <Pressable style={styles.okButton} onPress={onClose}>
            <Text style={styles.okButtonText}>{okLabel}</Text>
          </Pressable>
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
  okButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: MATCHPOINT_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.white,
  },
});
