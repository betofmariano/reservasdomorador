import { Modal, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import type { PendingRecoveryState } from '@/utils/pending-recovery-storage';
import { formatBrazilianMobilePhone } from '@/utils/phone-mask';

type PendingRecoveryModalProps = {
  visible: boolean;
  pendingRecovery: PendingRecoveryState | null;
  onContinue: () => void;
  onDiscard: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  muted: '#5C6475',
  white: '#FFFFFF',
};

export function PendingRecoveryModal({
  visible,
  pendingRecovery,
  onContinue,
  onDiscard,
}: PendingRecoveryModalProps) {
  if (!pendingRecovery) {
    return null;
  }

  const phoneLabel = formatBrazilianMobilePhone(pendingRecovery.telefoneLimpo);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Recuperação em andamento</Text>
          <Text style={styles.message}>
            Há um código de recuperação enviado para o WhatsApp {phoneLabel} que ainda não foi
            validado. O código vale por 1 hora.
          </Text>
          <Text style={styles.question}>Deseja continuar de onde parou ou descartar esse código?</Text>

          <AuthButton
            label="Continuar validação"
            onPress={onContinue}
            style={styles.primaryButton}
          />

          <AuthButton label="Descartar código" variant="outline" onPress={onDiscard} />
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
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 480,
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
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  primaryButton: {
    marginBottom: 12,
  },
});
