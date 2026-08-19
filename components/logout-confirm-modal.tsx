import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { APP_DISPLAY_NAME } from '@/constants/app-branding';

type LogoutConfirmModalProps = {
  visible: boolean;
  title?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  muted: '#5C6475',
  error: '#D64545',
  white: '#FFFFFF',
};

export function LogoutConfirmModal({
  visible,
  title = 'Sair da conta',
  message,
  onCancel,
  onConfirm,
}: LogoutConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.appName}>{APP_DISPLAY_NAME}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable
            style={styles.primaryButton}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Não">
            <Text style={styles.primaryButtonText}>Não</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="Sim">
            <Text style={styles.secondaryButtonText}>Sim</Text>
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
  primaryButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
  },
});
