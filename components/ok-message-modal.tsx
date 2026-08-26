import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { APP_DISPLAY_NAME } from '@/constants/app-branding';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';

type OkMessageModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  white: '#FFFFFF',
};

export function OkMessageModal({ visible, title, message, onClose }: OkMessageModalProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WEB_MAX_CONTENT_WIDTH;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, isWide && styles.cardWide]}>
          <Text style={styles.appName}>{APP_DISPLAY_NAME}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable style={styles.okButton} onPress={onClose} accessibilityRole="button">
            <Text style={styles.okButtonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
  },
  cardWide: {
    alignSelf: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.blue,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: COLORS.navy,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  okButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
