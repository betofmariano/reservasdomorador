import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';

type ExcluirCadastroModalProps = {
  visible: boolean;
  title: string;
  message: string;
  isDeleting?: boolean;
  errorMessage?: string | null;
  confirmLabel?: string;
  confirmDestructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  white: '#FFFFFF',
  error: '#D64545',
};

export function ExcluirCadastroModal({
  visible,
  title,
  message,
  isDeleting = false,
  errorMessage = null,
  confirmLabel = 'Excluir',
  confirmDestructive = true,
  onClose,
  onConfirm,
}: ExcluirCadastroModalProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WEB_MAX_CONTENT_WIDTH;

  function handleClose() {
    if (isDeleting) {
      return;
    }

    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[styles.card, isWide && styles.cardWide]}
          onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isDeleting}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                confirmDestructive ? styles.deleteButton : styles.confirmButton,
                isDeleting && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={isDeleting}>
              {isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.deleteButtonText}>{confirmLabel}</Text>
              )}
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
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
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
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  confirmButton: {
    backgroundColor: COLORS.blue,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
