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
import { excluirReservaLista } from '@/services/lista-reservas-service';
import type { ListaReservaItem } from '@/types/lista-reserva';
import type { User } from '@/types/user';
import { formatFullDateLabel, formatGameTime } from '@/utils/jogos-time';
import { formatListaReservaMensalPorSemanaDataHora } from '@/utils/lista-reservas';
import { canCancelReservaWithinLimite } from '@/utils/reserva-adversario';

type ExcluirReservaGestorModalProps = {
  visible: boolean;
  reserva: ListaReservaItem | null;
  user: User | null;
  authToken: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  white: '#FFFFFF',
  error: '#D64545',
};

const DELETE_ERROR_MESSAGE = 'Não foi possível excluir esta reserva. Tente novamente.';
const DEADLINE_ERROR_MESSAGE = 'O prazo para cancelamento desta reserva já expirou.';

export function ExcluirReservaGestorModal({
  visible,
  reserva,
  user,
  authToken,
  onClose,
  onSuccess,
}: ExcluirReservaGestorModalProps) {
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
  }, [visible, reserva?.id]);

  function handleClose() {
    if (isDeleting) {
      return;
    }

    setErrorMessage(null);
    onClose();
  }

  async function handleConfirmDelete() {
    if (isDeleting || !reserva || !user?.id || !authToken) {
      return;
    }

    if (!canCancelReservaWithinLimite(reserva)) {
      setErrorMessage(DEADLINE_ERROR_MESSAGE);
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await excluirReservaLista(reserva, user.id, authToken);
      onClose();
      onSuccess();
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : getApiErrorMessage(error) || DELETE_ERROR_MESSAGE;

      setErrorMessage(message || DELETE_ERROR_MESSAGE);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!reserva) {
    return null;
  }

  const dataHoraLabel = reserva.usaMensalPorSemana
    ? formatListaReservaMensalPorSemanaDataHora(reserva.dataAtividade)
    : `${formatFullDateLabel(new Date(reserva.dataAtividade))} - ${formatGameTime(reserva.dataAtividade)}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.overlay, overlayStyle]}>
        <View style={[styles.card, contentStyle]}>
          <Text style={styles.title}>Excluir reserva</Text>
          <Text style={styles.message}>Deseja realmente excluir esta reserva?</Text>

          <View style={styles.detailsBox}>
            <Text style={styles.detailText}>
              {reserva.usaMensalPorSemana ? 'Data e horário' : 'Data'}: {dataHoraLabel}
            </Text>
            {!reserva.usaMensalPorSemana ? (
              <>
                <Text style={styles.detailText}>Atividade: {reserva.atividade}</Text>
              </>
            ) : null}
            <Text style={styles.detailText}>Usuário: {reserva.usuarioNome}</Text>
            {reserva.unidadeNome ? (
              <Text style={styles.detailText}>Unidade: {reserva.unidadeNome}</Text>
            ) : null}
            {reserva.responsavelNome ? (
              <Text style={styles.detailText}>Responsável: {reserva.responsavelNome}</Text>
            ) : null}
            <Text style={styles.detailText}>Local: {reserva.localNome}</Text>
          </View>

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
                  <Text style={styles.deleteButtonText}>Excluindo...</Text>
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
