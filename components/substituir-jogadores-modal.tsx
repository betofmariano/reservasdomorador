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
import { clearGamePlayersSelection } from '@/services/game-players-service';
import type { ReservaSummary } from '@/types/home-summary';
import type { User } from '@/types/user';
import { formatFullDateLabel, formatGameTime } from '@/utils/jogos-time';
import { canManageReservaJogadores } from '@/utils/reserva-adversario';

type SubstituirJogadoresModalProps = {
  visible: boolean;
  reserva: ReservaSummary | null;
  user: User | null;
  authToken: string | null;
  onClose: () => void;
  onSuccess: (reserva: ReservaSummary) => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  white: '#FFFFFF',
  error: '#D64545',
};

const SUBSTITUIR_ERROR_MESSAGE =
  'Não foi possível preparar a substituição dos jogadores. Tente novamente.';
const PERMISSION_ERROR_MESSAGE =
  'Apenas o responsável da reserva pode substituir os jogadores.';

export function SubstituirJogadoresModal({
  visible,
  reserva,
  user,
  authToken,
  onClose,
  onSuccess,
}: SubstituirJogadoresModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { overlayStyle, contentStyle } = useClubSelectionModalLayout({
    maxWidth: WEB_MAX_CONTENT_WIDTH,
  });

  useEffect(() => {
    if (!visible) {
      setErrorMessage(null);
      setIsConfirming(false);
    }
  }, [visible, reserva?.id]);

  function handleClose() {
    if (isConfirming) {
      return;
    }

    setErrorMessage(null);
    onClose();
  }

  async function handleConfirm() {
    if (isConfirming || !reserva || !user || !authToken) {
      return;
    }

    if (!canManageReservaJogadores(user, reserva)) {
      setErrorMessage(PERMISSION_ERROR_MESSAGE);
      return;
    }

    setIsConfirming(true);
    setErrorMessage(null);

    try {
      await clearGamePlayersSelection({ jogos_id: reserva.id }, authToken);
      onSuccess(reserva);
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiError && error.message.includes('conectar')
          ? error.message
          : getApiErrorMessage(error) || SUBSTITUIR_ERROR_MESSAGE;

      setErrorMessage(message.includes('conectar') ? message : SUBSTITUIR_ERROR_MESSAGE);
    } finally {
      setIsConfirming(false);
    }
  }

  if (!reserva) {
    return null;
  }

  const dataLabel = formatFullDateLabel(new Date(reserva.dataAtividade));
  const horaLabel = formatGameTime(reserva.dataAtividade);
  const participantesLabel = reserva.jogoDuplas
    ? 'adversários e parceiros'
    : 'adversário';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.overlay, overlayStyle]}>
        <View style={[styles.card, contentStyle]}>
          <Text style={styles.title}>Substituir jogadores</Text>
          <Text style={styles.message}>
            {`Deseja substituir o ${participantesLabel} desta reserva? Os jogadores atuais serão removidos e você poderá selecionar novos.`}
          </Text>

          <View style={styles.detailsBox}>
            <Text style={styles.detailText}>Data: {dataLabel}</Text>
            <Text style={styles.detailText}>Horário: {horaLabel}</Text>
            <Text style={styles.detailText}>Quadra: {reserva.quadra}</Text>
            <Text style={styles.detailText}>Local: {reserva.localNome}</Text>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.backButton, isConfirming && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={isConfirming}>
              <Text style={styles.backButtonText}>Voltar</Text>
            </Pressable>

            <Pressable
              style={[styles.confirmButton, isConfirming && styles.buttonDisabled]}
              onPress={() => void handleConfirm()}
              disabled={isConfirming}>
              {isConfirming ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.confirmButtonText}>Confirmando...</Text>
                </View>
              ) : (
                <Text style={styles.confirmButtonText}>Confirmar</Text>
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
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
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
