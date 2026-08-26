import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useClubSelectionModalLayout } from '@/hooks/use-club-selection-modal-layout';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import type { ReservaPresenca } from '@/types/presenca';
import { LISTA_PRESENCA_MESSAGES } from '@/hooks/use-lista-presenca-screen';

type CancelarReservaPresencaModalProps = {
  visible: boolean;
  reserva: ReservaPresenca | null;
  atividadeNome: string;
  horarioDescricao: string;
  onClose: () => void;
  onConfirm: (reserva: ReservaPresenca) => Promise<void>;
};

const COLORS = {
  navy: '#3A2154',
  white: '#FFFFFF',
  error: '#D64545',
  muted: '#5C6475',
};

export function CancelarReservaPresencaModal({
  visible,
  reserva,
  atividadeNome,
  horarioDescricao,
  onClose,
  onConfirm,
}: CancelarReservaPresencaModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { overlayStyle, contentStyle } = useClubSelectionModalLayout({
    maxWidth: WEB_MAX_CONTENT_WIDTH,
  });

  useEffect(() => {
    if (!visible) {
      setErrorMessage(null);
      setIsDeleting(false);
    }
  }, [visible, reserva?.reservaId]);

  function handleClose() {
    if (isDeleting) {
      return;
    }

    setErrorMessage(null);
    onClose();
  }

  async function handleConfirmDelete() {
    if (isDeleting || !reserva) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await onConfirm(reserva);
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : getApiErrorMessage(error) || LISTA_PRESENCA_MESSAGES.cancelError;

      setErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!reserva) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.overlay, overlayStyle]}>
        <View style={[styles.card, contentStyle]}>
          <Text style={styles.title}>Cancelar reserva</Text>
          <Text style={styles.message}>
            Deseja cancelar a reserva de {reserva.nomeUsuario} para a aula de {atividadeNome} de{' '}
            {horarioDescricao.replace(' - ', ' às ')}?
          </Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.backButton, isDeleting && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={isDeleting}>
              <Text style={styles.backButtonText}>Voltar</Text>
            </Pressable>

            <Pressable
              style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
              onPress={() => void handleConfirmDelete()}
              disabled={isDeleting}>
              {isDeleting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.deleteButtonText}>Cancelando...</Text>
                </View>
              ) : (
                <Text style={styles.deleteButtonText}>Confirmar</Text>
              )}
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
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 20,
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
    marginBottom: 14,
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
    gap: 10,
    marginTop: 4,
  },
  backButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D5DAE3',
    backgroundColor: '#E8EBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
  },
  deleteButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
