import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  GUIAS_INSTALACAO,
  type GuiaInstalacaoId,
} from '@/constants/guia-instalacao';

type GuiaInstalacaoSelecaoModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (guiaId: GuiaInstalacaoId) => void;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  white: '#FFFFFF',
  muted: '#5C6475',
  border: '#E2E6EE',
  cardBg: '#F4F6FA',
};

const MODAL_MAX_WIDTH = 400;

export function GuiaInstalacaoSelecaoModal({
  visible,
  onClose,
  onSelect,
}: GuiaInstalacaoSelecaoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Guia de instalação</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar guia de instalação"
              hitSlop={8}
              style={styles.closeButton}>
              <Ionicons name="close" size={22} color={COLORS.navy} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Escolha o guia do seu aparelho e navegador:</Text>

          <View style={styles.options}>
            {GUIAS_INSTALACAO.map((guia) => (
              <Pressable
                key={guia.id}
                style={styles.optionButton}
                onPress={() => onSelect(guia.id)}
                accessibilityRole="button"
                accessibilityLabel={guia.label}>
                <View style={styles.optionTextBlock}>
                  <Text style={styles.optionLabel}>{guia.label}</Text>
                  <Text style={styles.optionDescription}>{guia.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.blue} />
              </Pressable>
            ))}
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
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    width: '100%',
    maxWidth: MODAL_MAX_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 14,
    lineHeight: 20,
  },
  options: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  },
});
