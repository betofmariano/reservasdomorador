import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { PasswordTextField } from '@/components/password-text-field';
import { isValidNumericPassword } from '@/constants/auth';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAuth } from '@/contexts/auth-context';
import { getApiErrorMessage } from '@/services/api-client';
import { alterarSenhaAutenticada } from '@/services/auth-service';
import { MEUS_DADOS_MESSAGES } from '@/utils/meus-dados';

type AlterarSenhaModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

export function AlterarSenhaModal({ visible, onClose, onSuccess }: AlterarSenhaModalProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WEB_MAX_CONTENT_WIDTH;
  const { user, authToken } = useAuth();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const backdropPressStartedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setNovaSenha('');
      setConfirmSenha('');
      setErrorMessage(null);
      setIsSubmitting(false);
      backdropPressStartedRef.current = false;
    }
  }, [visible]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  function handleBackdropPressIn() {
    backdropPressStartedRef.current = true;
  }

  function handleBackdropPress() {
    const pressStartedOnBackdrop = backdropPressStartedRef.current;
    backdropPressStartedRef.current = false;

    if (!pressStartedOnBackdrop) {
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const selectedText = window.getSelection()?.toString().trim();
      if (selectedText) {
        return;
      }
    }

    handleClose();
  }

  async function handleConfirm() {
    if (isSubmitting) {
      return;
    }

    if (!user?.id || !authToken) {
      setErrorMessage('Não foi possível identificar o usuário.');
      return;
    }

    if (!isValidNumericPassword(novaSenha)) {
      setErrorMessage('A senha deve ter de 4 a 6 dígitos numéricos.');
      return;
    }

    if (novaSenha !== confirmSenha) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const message = await alterarSenhaAutenticada(user.id, novaSenha, authToken);
      onSuccess?.(message);
      handleClose();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setErrorMessage(
        message.includes('conectar') ? message : MEUS_DADOS_MESSAGES.passwordUpdateError,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canConfirm =
    novaSenha.trim().length > 0 && confirmSenha.trim().length > 0 && !isSubmitting;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable
          style={styles.backdrop}
          onPressIn={handleBackdropPressIn}
          onPress={handleBackdropPress}
          tabIndex={-1}
        />
        <View
          style={[styles.card, isWide && styles.cardWide]}
          onTouchStart={() => {
            backdropPressStartedRef.current = false;
          }}
          {...(Platform.OS === 'web'
            ? {
                onMouseDown: () => {
                  backdropPressStartedRef.current = false;
                },
              }
            : null)}>
          <Text style={styles.title}>Redefinir Senha</Text>
          <View style={styles.divider} />
          <Text style={styles.hint}>* de 4 a 6 dígitos NUMÉRICOS</Text>

          <PasswordTextField
            label="Sua nova senha"
            value={novaSenha}
            onChangeText={(value) => {
              setNovaSenha(value);
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
            placeholder="Digite sua nova senha"
            editable={!isSubmitting}
          />

          <PasswordTextField
            label="Confirme sua nova senha"
            value={confirmSenha}
            onChangeText={(value) => {
              setConfirmSenha(value);
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
            placeholder="Confirme sua nova senha"
            editable={!isSubmitting}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={MATCHPOINT_COLORS.blue} />
              <Text style={styles.loadingText}>Alterando senha...</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <AuthButton
              label="Confirmar"
              onPress={() => void handleConfirm()}
              disabled={!canConfirm || isSubmitting}
              style={styles.confirmButton}
              labelStyle={styles.confirmButtonLabel}
            />
            <AuthButton label="Voltar" variant="voltar" onPress={handleClose} disabled={isSubmitting} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: MATCHPOINT_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: MATCHPOINT_COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    zIndex: 2,
    ...Platform.select({
      web: {
        userSelect: 'text',
      },
    }),
  },
  cardWide: {
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 2,
    backgroundColor: MATCHPOINT_COLORS.accent,
    marginBottom: 12,
    borderRadius: 1,
  },
  hint: {
    fontSize: 13,
    fontWeight: '600',
    color: MATCHPOINT_COLORS.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: MATCHPOINT_COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: MATCHPOINT_COLORS.navy,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  confirmButton: {
    minHeight: 54,
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 6,
  },
  confirmButtonLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
});
