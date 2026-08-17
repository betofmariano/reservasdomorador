import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { UserAvatar } from '@/components/user-avatar';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import { buildMapaDiarioCelulaIndisponivelViewModel } from '@/utils/mapa-mensal-por-semana-reserva';
import { getPortraitPhotoDimensions } from '@/utils/user-photo';

type MapaDiarioCelulaIndisponivelModalProps = {
  visible: boolean;
  item: MapaDiarioFuturoItem | null;
  onClose: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  white: '#FFFFFF',
  muted: '#5C6475',
  border: '#E2E6EE',
};

const PORTRAIT_PHOTO_BASE_SIZE = 80;

export function MapaDiarioCelulaIndisponivelModal({
  visible,
  item,
  onClose,
}: MapaDiarioCelulaIndisponivelModalProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WEB_MAX_CONTENT_WIDTH;

  if (!item) {
    return null;
  }

  const viewModel = buildMapaDiarioCelulaIndisponivelViewModel(item);
  const title = viewModel.hasReserva ? 'Reserva existente' : 'Horário indisponível';
  const portraitPhoto = getPortraitPhotoDimensions(PORTRAIT_PHOTO_BASE_SIZE);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, isWide && styles.cardWide]}>
          <Text style={styles.title}>{title}</Text>

          {viewModel.hasReserva ? (
            <View style={styles.profileSection}>
              <UserAvatar
                name={viewModel.nome}
                photoUrl={viewModel.foto}
                size={portraitPhoto.width}
                shape="rounded-rect"
              />
              <Text style={styles.profileName}>{viewModel.nome}</Text>
            </View>
          ) : null}

          <View style={styles.detailsSection}>
            {viewModel.hasReserva ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data e hora da reserva</Text>
                  <Text style={styles.detailValue}>{viewModel.dataHoraReserva}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reservado em</Text>
                  <Text style={styles.detailValue}>{viewModel.dataReservada}</Text>
                </View>
              </>
            ) : (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Informação</Text>
                <Text style={styles.detailValue}>{viewModel.fallbackMessage}</Text>
              </View>
            )}
          </View>

          <Pressable style={styles.okButton} onPress={onClose} accessibilityRole="button">
            <Text style={styles.okButtonText}>Fechar</Text>
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
    maxWidth: 420,
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
    marginBottom: 16,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  detailsSection: {
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    backgroundColor: '#F4F6FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.navy,
    lineHeight: 22,
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
