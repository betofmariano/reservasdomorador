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
import { cancelarReservaForUser } from '@/services/reserva-horario-flow-service';
import type { ReservaSummary } from '@/types/home-summary';
import type { User } from '@/types/user';
import { formatFullDateLabel, formatGameTime } from '@/utils/jogos-time';
import { canCancelReservaUsuarioList, isReservaQuadra } from '@/utils/reserva-adversario';

type CancelarReservaModalProps = {
  visible: boolean;
  reserva: ReservaSummary | null;
  user: User | null;
  authToken: string | null;
  onClose: () => void;
  onSuccess: (reservaId: number) => void;
};

const COLORS = {
  navy: '#1B2B4B',
  white: '#FFFFFF',
  error: '#D64545',
};

const CANCEL_ERROR_MESSAGE = 'Não foi possível cancelar esta reserva. Tente novamente.';
const DEADLINE_ERROR_MESSAGE = 'O prazo para cancelamento desta reserva já expirou.';

function isReservaJaCanceladaError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 404) {
    return true;
  }

  const message = getApiErrorMessage(error).toLowerCase();

  return (
    message.includes('unable to locate var') ||
    message.includes('reservaexcluir') ||
    message.includes('not found') ||
    message.includes('não encontrada') ||
    message.includes('nao encontrada')
  );
}

export function CancelarReservaModal({
  visible,
  reserva,
  user,
  authToken,
  onClose,
  onSuccess,
}: CancelarReservaModalProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { overlayStyle, contentStyle } = useClubSelectionModalLayout({
    maxWidth: WEB_MAX_CONTENT_WIDTH,
  });

  useEffect(() => {
    if (!visible) {
      setErrorMessage(null);
      setIsCancelling(false);
    }
  }, [visible, reserva?.id]);

  function handleClose() {
    if (isCancelling) {
      return;
    }

    setErrorMessage(null);
    onClose();
  }

  async function handleConfirmCancel() {
    if (isCancelling || !reserva || !user?.id || !authToken) {
      return;
    }

    if (!canCancelReservaUsuarioList(reserva)) {
      setErrorMessage(DEADLINE_ERROR_MESSAGE);
      return;
    }

    setIsCancelling(true);
    setErrorMessage(null);

    const reservaId = reserva.id;

    try {
      await cancelarReservaForUser(reserva, user, authToken);

      onClose();
      onSuccess(reservaId);
    } catch (error) {
      if (isReservaJaCanceladaError(error)) {
        onClose();
        onSuccess(reservaId);
        return;
      }

      const message =
        error instanceof ApiError && error.message
          ? error.message
          : getApiErrorMessage(error) || CANCEL_ERROR_MESSAGE;

      setErrorMessage(message || CANCEL_ERROR_MESSAGE);
    } finally {
      setIsCancelling(false);
    }
  }

  if (!reserva) {
    return null;
  }

  const dataLabel = formatFullDateLabel(new Date(reserva.dataAtividade));
  const horaLabel = formatGameTime(reserva.dataAtividade);
  const isQuadra = isReservaQuadra(reserva);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.overlay, overlayStyle]}>
        <View style={[styles.card, contentStyle]}>
          <Text style={styles.title}>Cancelar reserva</Text>
          <Text style={styles.message}>Deseja realmente cancelar esta reserva?</Text>

          <View style={styles.detailsBox}>
            <Text style={styles.detailText}>Data: {dataLabel}</Text>
            <Text style={styles.detailText}>Horário: {horaLabel}</Text>
            {isQuadra ? (
              <Text style={styles.detailText}>Quadra: {reserva.quadra}</Text>
            ) : (
              <Text style={styles.detailText}>Atividade: {reserva.atividade}</Text>
            )}
            {reserva.unidadeNome?.trim() ? (
              <Text style={styles.detailText}>Unidade: {reserva.unidadeNome.trim()}</Text>
            ) : null}
            <Text style={styles.detailText}>Local: {reserva.localNome}</Text>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.backButton, isCancelling && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={isCancelling}>
              <Text style={styles.backButtonText}>Voltar</Text>
            </Pressable>

            <Pressable
              style={[styles.cancelButton, isCancelling && styles.buttonDisabled]}
              onPress={() => void handleConfirmCancel()}
              disabled={isCancelling}>
              {isCancelling ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.cancelButtonText}>Cancelando...</Text>
                </View>
              ) : (
                <Text style={styles.cancelButtonText}>Confirmar</Text>
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
    color: '#5C6475',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 14,
  },
  detailsBox: {
    backgroundColor: '#F4F6FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.navy,
    lineHeight: 20,
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
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
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
