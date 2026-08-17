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
import { deleteListaEsperaEntry } from '@/services/lista-espera-service';
import type { ListaEsperaSummary } from '@/types/home-summary';
import { formatFullDateLabel, formatGameTime } from '@/utils/jogos-time';

type CancelarListaEsperaModalProps = {
  visible: boolean;
  registro: ListaEsperaSummary | null;
  authToken: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  white: '#FFFFFF',
  error: '#D64545',
};

const CANCEL_ERROR_MESSAGE = 'Não foi possível remover este registro. Tente novamente.';

export function CancelarListaEsperaModal({
  visible,
  registro,
  authToken,
  onClose,
  onSuccess,
}: CancelarListaEsperaModalProps) {
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
  }, [visible, registro?.id]);

  function handleClose() {
    if (isDeleting) {
      return;
    }

    setErrorMessage(null);
    onClose();
  }

  async function handleConfirmDelete() {
    if (isDeleting || !registro?.id || !authToken) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteListaEsperaEntry(registro.id, authToken);
      onClose();
      onSuccess();
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : getApiErrorMessage(error) || CANCEL_ERROR_MESSAGE;

      setErrorMessage(message.includes('conectar') ? message : CANCEL_ERROR_MESSAGE);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!registro) {
    return null;
  }

  const dataLabel = formatFullDateLabel(new Date(registro.dataAtividade));
  const horaLabel = formatGameTime(registro.dataAtividade);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.overlay, overlayStyle]}>
        <View style={[styles.card, contentStyle]}>
          <Text style={styles.title}>Remover da lista</Text>
          <Text style={styles.message}>Deseja realmente sair desta lista de espera?</Text>

          <View style={styles.detailsBox}>
            <Text style={styles.detailText}>Local: {registro.localNome}</Text>
            <Text style={styles.detailText}>Atividade: {registro.atividade}</Text>
            <Text style={styles.detailText}>Data: {dataLabel}</Text>
            <Text style={styles.detailText}>Horário: {horaLabel}</Text>
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
              style={[styles.cancelButton, isDeleting && styles.buttonDisabled]}
              onPress={() => void handleConfirmDelete()}
              disabled={isDeleting}>
              {isDeleting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.cancelButtonText}>Removendo...</Text>
                </View>
              ) : (
                <Text style={styles.cancelButtonText}>Remover</Text>
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
