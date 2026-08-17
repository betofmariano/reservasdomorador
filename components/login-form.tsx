import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthButton } from '@/components/auth-button';
import { OkMessageModal } from '@/components/ok-message-modal';
import { PasswordTextField } from '@/components/password-text-field';
import { PhoneTextField } from '@/components/phone-text-field';
import { PendingRecoveryModal } from '@/components/pending-recovery-modal';
import { RecuperarMeusDadosModal } from '@/components/recuperar-meus-dados-modal';
import { RecuperarSenhaModal } from '@/components/recuperar-senha-modal';
import { WrongPasswordModal } from '@/components/wrong-password-modal';
import { stripNonNumeric } from '@/constants/auth';
import { useAuth } from '@/contexts/auth-context';
import {
  LOGIN_TOTAL_ENCONTRADO_TITLES,
  LOGIN_WRONG_PASSWORD_MESSAGE,
  LOGIN_WRONG_PASSWORD_TITLE,
} from '@/constants/login-messages';
import {
  confirmPhoneSubmitChecks,
  getLoginValidationError,
} from '@/utils/phone-validation';
import { navigateToHome } from '@/utils/auth-navigation';
import { BRAZILIAN_MOBILE_PHONE_DIGITS } from '@/utils/phone-mask';
import {
  clearPendingRecovery,
  getPendingRecovery,
  getResumablePendingRecovery,
  type PendingRecoveryState,
} from '@/utils/pending-recovery-storage';

type LoginFormProps = {
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
};

const LOGIN_ERROR_TITLES = {
  phone_not_found: LOGIN_TOTAL_ENCONTRADO_TITLES.phoneNotFound,
  wrong_password: LOGIN_WRONG_PASSWORD_TITLE,
  token_failed: 'Não foi possível entrar',
  blocked: 'Acesso bloqueado',
  not_approved: 'Cadastro pendente',
  duplicate_phone: LOGIN_TOTAL_ENCONTRADO_TITLES.duplicatePhones,
  generic: 'Erro no login',
} as const;

const LOGIN_ERROR_TITLE = LOGIN_ERROR_TITLES.generic;

type ErrorModalState = {
  title: string;
  message: string;
  kind?: 'wrong_password' | 'generic';
};

export function LoginForm({ onSubmittingChange }: LoginFormProps) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryVisible, setIsRecoveryVisible] = useState(false);
  const [recoveryResume, setRecoveryResume] = useState<PendingRecoveryState | null>(null);
  const [pendingRecovery, setPendingRecovery] = useState<PendingRecoveryState | null>(null);
  const [isPendingRecoveryPromptVisible, setIsPendingRecoveryPromptVisible] = useState(false);
  const [isAccountRecoveryVisible, setIsAccountRecoveryVisible] = useState(false);
  const [errorModal, setErrorModal] = useState<ErrorModalState | null>(null);
  const loginInFlightRef = useRef(false);

  const refreshPendingRecovery = useCallback(async () => {
    const localPending = await getPendingRecovery();

    if (!localPending) {
      setPendingRecovery(null);
      return null;
    }

    const pending = await getResumablePendingRecovery(localPending.telefoneLimpo);
    setPendingRecovery(pending);
    return pending;
  }, []);

  useEffect(() => {
    void refreshPendingRecovery().then((pending) => {
      if (pending) {
        setIsPendingRecoveryPromptVisible(true);
      }
    });
  }, [refreshPendingRecovery]);

  function showLoginError(
    message: string,
    title: string = LOGIN_ERROR_TITLE,
    kind: ErrorModalState['kind'] = 'generic',
  ) {
    setErrorModal({ title, message, kind });
  }

  function closeErrorModal() {
    setErrorModal(null);
  }

  async function handleLogin() {
    if (isSubmitting || loginInFlightRef.current) {
      return;
    }

    const validationError = getLoginValidationError(phone, password);

    if (validationError) {
      showLoginError(validationError);
      return;
    }

    loginInFlightRef.current = true;

    try {
      const phoneConfirmed = await confirmPhoneSubmitChecks(phone);

      if (!phoneConfirmed) {
        return;
      }

      setIsSubmitting(true);
      onSubmittingChange?.(true);

      const result = await signIn(phone, password, {
        larguraPagina: Math.round(screenWidth),
      });

      if (result.success) {
        navigateToHome(router);
        return;
      }

      if (result.errorCode === 'wrong_password') {
        showLoginError(
          LOGIN_WRONG_PASSWORD_MESSAGE,
          LOGIN_WRONG_PASSWORD_TITLE,
          'wrong_password',
        );
        return;
      }

      showLoginError(
        result.error ?? 'Não foi possível concluir o login. Tente novamente.',
        LOGIN_ERROR_TITLES[result.errorCode ?? 'generic'],
      );
    } finally {
      loginInFlightRef.current = false;
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  function handleForgotPassword() {
    if (isSubmitting) {
      return;
    }

    void (async () => {
      const localPending = await getPendingRecovery();
      const telefoneLimpo = localPending?.telefoneLimpo ?? stripNonNumeric(phone);

      if (telefoneLimpo.length === BRAZILIAN_MOBILE_PHONE_DIGITS) {
        const pending = await getResumablePendingRecovery(telefoneLimpo);
        setPendingRecovery(pending);

        if (pending) {
          setIsPendingRecoveryPromptVisible(true);
          return;
        }
      }

      setRecoveryResume(null);
      setIsRecoveryVisible(true);
    })();
  }

  function handleForgotPasswordFromModal() {
    closeErrorModal();
    handleForgotPassword();
  }

  function handleRecoveryClose() {
    setRecoveryResume(null);
    setIsRecoveryVisible(false);
    void refreshPendingRecovery();
  }

  async function handleContinuePendingRecovery() {
    const localPending = await getPendingRecovery();

    if (!localPending) {
      setIsPendingRecoveryPromptVisible(false);
      setPendingRecovery(null);
      return;
    }

    const pending = await getResumablePendingRecovery(localPending.telefoneLimpo);

    if (!pending) {
      setIsPendingRecoveryPromptVisible(false);
      setPendingRecovery(null);
      return;
    }

    setPendingRecovery(pending);
    setRecoveryResume(pending);
    setIsPendingRecoveryPromptVisible(false);
    setIsRecoveryVisible(true);
  }

  async function handleDiscardPendingRecovery() {
    await clearPendingRecovery();
    setPendingRecovery(null);
    setRecoveryResume(null);
    setIsPendingRecoveryPromptVisible(false);
  }

  function handleRecoveryAuthenticated() {
    navigateToHome(router);
  }

  function handleRecoverAccountData() {
    if (isSubmitting) {
      return;
    }

    setIsAccountRecoveryVisible(true);
  }

  function handleAccountRecoveryClose() {
    setIsAccountRecoveryVisible(false);
  }

  const isWrongPasswordModal = errorModal?.kind === 'wrong_password';

  return (
    <View style={styles.form}>
      <PhoneTextField
        label="Telefone/WhatsApp"
        value={phone}
        onChangeText={setPhone}
        autoCapitalize="none"
        editable={!isSubmitting}
      />

      <PasswordTextField
        label="Senha"
        labelHint="* de 4 a 6 dígitos NUMÉRICOS"
        value={password}
        onChangeText={setPassword}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="••••••"
        editable={!isSubmitting}
      />

      <AuthButton
        label="Esqueci minha senha"
        variant="actionLink"
        onPress={handleForgotPassword}
        disabled={isSubmitting}
        style={styles.forgotPasswordButton}
      />

      <AuthButton
        label={isSubmitting ? 'Entrando...' : 'Entrar'}
        onPress={handleLogin}
        disabled={isSubmitting}
        style={styles.submitButton}
      />

      <AuthButton
        label="Pesquisar Meus Dados"
        variant="actionLink"
        onPress={handleRecoverAccountData}
        disabled={isSubmitting}
        style={styles.lastRecoveryAction}
      />

      {isSubmitting ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.blue} />
          <Text style={styles.loadingText}>Entrando...</Text>
        </View>
      ) : null}

      <WrongPasswordModal
        visible={isWrongPasswordModal}
        title={errorModal?.title ?? LOGIN_WRONG_PASSWORD_TITLE}
        message={errorModal?.message ?? LOGIN_WRONG_PASSWORD_MESSAGE}
        onForgotPassword={handleForgotPasswordFromModal}
        onClose={closeErrorModal}
      />

      <OkMessageModal
        visible={errorModal != null && !isWrongPasswordModal}
        title={errorModal?.title ?? LOGIN_ERROR_TITLE}
        message={errorModal?.message ?? ''}
        onClose={closeErrorModal}
      />

      <PendingRecoveryModal
        visible={isPendingRecoveryPromptVisible}
        pendingRecovery={pendingRecovery}
        onContinue={() => void handleContinuePendingRecovery()}
        onDiscard={() => void handleDiscardPendingRecovery()}
      />

      <RecuperarSenhaModal
        visible={isRecoveryVisible}
        onClose={handleRecoveryClose}
        initialPhone={phone}
        resumeRecovery={recoveryResume}
        onAuthenticated={handleRecoveryAuthenticated}
        onPendingRecoveryChange={() => {
          void refreshPendingRecovery();
        }}
      />

      <RecuperarMeusDadosModal
        visible={isAccountRecoveryVisible}
        onClose={handleAccountRecoveryClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    alignItems: 'center',
  },
  forgotPasswordButton: {
    marginTop: -4,
    marginBottom: 12,
  },
  submitButton: {
    marginBottom: 16,
  },
  lastRecoveryAction: {
    marginBottom: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
});
