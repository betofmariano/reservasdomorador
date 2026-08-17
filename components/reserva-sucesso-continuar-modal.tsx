import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { MATCHPOINT_COLORS } from '@/constants/theme';

type ReservaSucessoContinuarModalProps = {
  visible: boolean;
  onAvancar: () => void;
  onEncerrar: () => void;
};

const COLORS = {
  navy: MATCHPOINT_COLORS.navy,
  blue: MATCHPOINT_COLORS.blue,
  white: MATCHPOINT_COLORS.white,
  border: MATCHPOINT_COLORS.borderLight,
  voltarBackground: MATCHPOINT_COLORS.voltarButtonBackground,
};

export function ReservaSucessoContinuarModal({
  visible,
  onAvancar,
  onEncerrar,
}: ReservaSucessoContinuarModalProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WEB_MAX_CONTENT_WIDTH;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onEncerrar}>
      <View style={styles.overlay}>
        <View style={[styles.card, isWide && styles.cardWide]}>
          <Text style={styles.title}>Reserva realizada</Text>
          <Text style={styles.message}>Deseja fazer mais uma reserva?</Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.encerrarButton}
              onPress={onEncerrar}
              accessibilityRole="button"
              accessibilityLabel="Encerrar">
              <Text style={styles.encerrarButtonText}>Encerrar</Text>
            </Pressable>

            <Pressable
              style={styles.avancarButton}
              onPress={onAvancar}
              accessibilityRole="button"
              accessibilityLabel="Avançar">
              <Text style={styles.avancarButtonText}>Avançar</Text>
            </Pressable>
          </View>
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
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  encerrarButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.voltarBackground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  encerrarButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  avancarButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  avancarButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
