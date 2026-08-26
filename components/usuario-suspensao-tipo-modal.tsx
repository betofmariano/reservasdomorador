import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type UsuarioSuspensaoTipoModalProps = {
  visible: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSelectTotal: () => void;
  onSelectAtividade: () => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  white: '#FFFFFF',
};

export function UsuarioSuspensaoTipoModal({
  visible,
  isSubmitting = false,
  onClose,
  onSelectTotal,
  onSelectAtividade,
}: UsuarioSuspensaoTipoModalProps) {
  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>Escolha o tipo de suspensão</Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.optionButton, isSubmitting && styles.buttonDisabled]}
              onPress={onSelectTotal}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.optionButtonText}>Total</Text>
                  <Ionicons name="checkmark" size={18} color={COLORS.white} />
                </>
              )}
            </Pressable>

            <Pressable
              style={[styles.optionButton, isSubmitting && styles.buttonDisabled]}
              onPress={onSelectAtividade}
              disabled={isSubmitting}>
              <Text style={styles.optionButtonText}>Atividade</Text>
              <Ionicons name="checkmark" size={18} color={COLORS.white} />
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
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
