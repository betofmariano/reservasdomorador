import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { AuthTextField } from '@/components/auth-text-field';
import { PhoneTextField } from '@/components/phone-text-field';
import { ASSOCIACAO_LOCAL_LABELS } from '@/constants/associacao-local-labels';
import { stripNonNumeric } from '@/constants/auth';
import { useAppToast } from '@/contexts/app-toast-context';
import {
  consultarEsqueceuCadastro,
  esqueceuCadastro,
  getPasswordRecoveryErrorMessage,
} from '@/services/auth-service';
import type { EsqueceuCadastroUsuarioMatch } from '@/types/account-recovery';
import { BRAZILIAN_MOBILE_PHONE_DIGITS, formatBrazilianMobilePhone } from '@/utils/phone-mask';

type RecuperarMeusDadosModalProps = {
  visible: boolean;
  onClose: () => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  white: '#FFFFFF',
  error: '#D64545',
  muted: '#5C6475',
  border: '#EEF1F6',
};

const EMPTY_RESULTS_MESSAGE = 'Nenhum cadastro encontrado com estes dados.';
const SEARCH_ERROR_MESSAGE = 'Não foi possível consultar os cadastros. Tente novamente.';
const USER_FOUND_MESSAGE =
  'Se encontrou o seu cadastro acima, feche esta janela e clique em Esqueci minha senha na tela de login para redefinir sua senha.';
const SUPPORT_PROMPT_MESSAGE =
  'Não encontrou seu cadastro? Informe seu telefone completo para enviar uma solicitação de informações ao suporte.';
const SUPPORT_WAIT_MESSAGE = 'Solicitação enviada. Aguarde o retorno do nosso suporte.';
const SEARCH_DEBOUNCE_MS = 400;
const RESULTS_LIST_MAX_HEIGHT = 180;
const PHONE_LAST_DIGITS_LENGTH = 4;

export function RecuperarMeusDadosModal({ visible, onClose }: RecuperarMeusDadosModalProps) {
  const { showToast } = useAppToast();
  const [name, setName] = useState('');
  const [phoneLastDigits, setPhoneLastDigits] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [matchedUsers, setMatchedUsers] = useState<EsqueceuCadastroUsuarioMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null);
  const [showSupportRequest, setShowSupportRequest] = useState(false);
  const [supportErrorMessage, setSupportErrorMessage] = useState<string | null>(null);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchRef = useRef<{ name: string; phoneLastDigits: string } | null>(null);

  const supportTelefoneLimpo = useMemo(() => stripNonNumeric(supportPhone), [supportPhone]);
  const isSupportPhoneValid = supportTelefoneLimpo.length === BRAZILIAN_MOBILE_PHONE_DIGITS;
  const isPhoneLastDigitsValid = phoneLastDigits.length === PHONE_LAST_DIGITS_LENGTH;
  const isSearchFormReady = name.trim().length > 0 && isPhoneLastDigitsValid;
  const isSupportFormReady = isSearchFormReady && isSupportPhoneValid;
  const isBusy = isSearching || isSubmittingSupport;

  const resetForm = useCallback(() => {
    setName('');
    setPhoneLastDigits('');
    setSupportPhone('');
    setMatchedUsers([]);
    setHasSearched(false);
    setSearchErrorMessage(null);
    setShowSupportRequest(false);
    setSupportErrorMessage(null);
    setIsSearching(false);
    setIsSubmittingSupport(false);
    lastSearchRef.current = null;
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    resetForm();
  }, [visible, resetForm]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const runSearch = useCallback(async (searchName: string, searchPhoneLastDigits: string) => {
    const trimmedName = searchName.trim();

    if (!trimmedName || searchPhoneLastDigits.length !== PHONE_LAST_DIGITS_LENGTH) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsSearching(true);
    setSearchErrorMessage(null);
    setShowSupportRequest(false);
    setSupportErrorMessage(null);

    try {
      const usuarios = await consultarEsqueceuCadastro(trimmedName, searchPhoneLastDigits);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setMatchedUsers(usuarios);
      setHasSearched(true);
      lastSearchRef.current = {
        name: trimmedName,
        phoneLastDigits: searchPhoneLastDigits,
      };
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setMatchedUsers([]);
      setHasSearched(true);
      setSearchErrorMessage(getPasswordRecoveryErrorMessage(error) || SEARCH_ERROR_MESSAGE);
      lastSearchRef.current = {
        name: trimmedName,
        phoneLastDigits: searchPhoneLastDigits,
      };
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasSearched) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName || !isPhoneLastDigitsValid) {
      setMatchedUsers([]);
      setHasSearched(false);
      setSearchErrorMessage(null);
      setShowSupportRequest(false);
      lastSearchRef.current = null;
      return;
    }

    if (
      lastSearchRef.current?.name === trimmedName &&
      lastSearchRef.current?.phoneLastDigits === phoneLastDigits
    ) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void runSearch(trimmedName, phoneLastDigits);
    }, SEARCH_DEBOUNCE_MS);
  }, [name, phoneLastDigits, hasSearched, isPhoneLastDigitsValid, runSearch]);

  async function handleSearch() {
    if (isBusy || !isSearchFormReady) {
      return;
    }

    Keyboard.dismiss();
    await runSearch(name, phoneLastDigits);
  }

  function handlePhoneLastDigitsChange(value: string) {
    setPhoneLastDigits(stripNonNumeric(value).slice(0, PHONE_LAST_DIGITS_LENGTH));
  }

  function handleOpenSupportRequest() {
    setShowSupportRequest(true);
    setSupportErrorMessage(null);
  }

  async function handleSubmitSupportRequest() {
    if (isBusy || !isSupportFormReady) {
      if (!isSupportPhoneValid) {
        setSupportErrorMessage('Informe um telefone válido com DDD.');
      }
      return;
    }

    setIsSubmittingSupport(true);
    setSupportErrorMessage(null);
    Keyboard.dismiss();

    try {
      await esqueceuCadastro(name, supportTelefoneLimpo);
      resetForm();
      onClose();
      showToast(SUPPORT_WAIT_MESSAGE, { variant: 'success', duration: 5000 });
    } catch (error) {
      setSupportErrorMessage(getPasswordRecoveryErrorMessage(error));
    } finally {
      setIsSubmittingSupport(false);
    }
  }

  function handleDismiss() {
    if (isBusy) {
      return;
    }

    Keyboard.dismiss();
    resetForm();
    onClose();
  }

  function resolveAssociacaoLabel(usuario: EsqueceuCadastroUsuarioMatch): string {
    if (usuario.associacaoNome?.trim()) {
      return usuario.associacaoNome.trim();
    }

    if (usuario.academiasId != null) {
      return `Local #${usuario.academiasId}`;
    }

    return ASSOCIACAO_LOCAL_LABELS.singular;
  }

  function resolveTelefoneLabel(usuario: EsqueceuCadastroUsuarioMatch): string | null {
    const digits = stripNonNumeric(usuario.telefoneLimpo ?? '');

    return digits ? formatBrazilianMobilePhone(digits) : null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={handleDismiss} disabled={isBusy} />

        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Pesquisar Meus Dados</Text>

            <AuthTextField
              label="Nome"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!isBusy}
            />

            <AuthTextField
              label="Últimos 4 dígitos do telefone"
              value={phoneLastDigits}
              onChangeText={handlePhoneLastDigitsChange}
              keyboardType="number-pad"
              maxLength={PHONE_LAST_DIGITS_LENGTH}
              placeholder="0000"
              editable={!isBusy}
            />

            {hasSearched ? (
              <View style={styles.resultsSection}>
                <Text style={styles.resultsTitle}>Cadastros encontrados</Text>

                {searchErrorMessage ? (
                  <Text style={styles.searchErrorText}>{searchErrorMessage}</Text>
                ) : matchedUsers.length === 0 ? (
                  <Text style={styles.emptyResultsText}>{EMPTY_RESULTS_MESSAGE}</Text>
                ) : (
                  <>
                    <View style={styles.resultsList}>
                      <ScrollView
                        style={styles.resultsScroll}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator>
                        {matchedUsers.map((usuario, index) => {
                          const telefoneLabel = resolveTelefoneLabel(usuario);

                          return (
                            <View
                              key={`${usuario.usersId ?? 'user'}-${usuario.nome}-${index}`}
                              style={styles.resultItem}>
                              <Text style={styles.resultName}>{usuario.nome}</Text>
                              <Text style={styles.resultMeta}>
                                {resolveAssociacaoLabel(usuario)}
                              </Text>
                              {telefoneLabel ? (
                                <Text style={styles.resultMeta}>Telefone: {telefoneLabel}</Text>
                              ) : null}
                            </View>
                          );
                        })}
                      </ScrollView>
                    </View>
                    <Text style={styles.userFoundText}>{USER_FOUND_MESSAGE}</Text>
                  </>
                )}
              </View>
            ) : null}

            {hasSearched && !searchErrorMessage && !showSupportRequest ? (
              <AuthButton
                label={
                  matchedUsers.length === 0
                    ? 'Solicitar informações ao suporte'
                    : 'Não encontrei meu cadastro'
                }
                variant="actionLink"
                onPress={handleOpenSupportRequest}
                disabled={isBusy}
                style={styles.supportLinkButton}
              />
            ) : null}

            {showSupportRequest ? (
              <View style={styles.supportSection}>
                <Text style={styles.supportPromptText}>{SUPPORT_PROMPT_MESSAGE}</Text>
                <PhoneTextField
                  label="Telefone"
                  value={supportPhone}
                  onChangeText={setSupportPhone}
                  autoCapitalize="none"
                  editable={!isBusy}
                />
                {supportErrorMessage ? (
                  <Text style={styles.searchErrorText}>{supportErrorMessage}</Text>
                ) : null}
                <AuthButton
                  label={isSubmittingSupport ? 'Enviando...' : 'Enviar solicitação'}
                  onPress={() => void handleSubmitSupportRequest()}
                  disabled={!isSupportFormReady || isBusy}
                  style={styles.primaryButton}
                />
              </View>
            ) : null}

            {!showSupportRequest ? (
              <AuthButton
                label={isSearching ? 'Pesquisando...' : 'Pesquisar'}
                onPress={() => void handleSearch()}
                disabled={!isSearchFormReady || isBusy}
                style={styles.primaryButton}
              />
            ) : null}

            <AuthButton
              label="Cancelar"
              variant="link"
              onPress={handleDismiss}
              disabled={isBusy}
            />

            {isBusy ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={COLORS.blue} />
                <Text style={styles.loadingText}>Aguarde...</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    zIndex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  resultsSection: {
    width: '100%',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
  resultsList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: RESULTS_LIST_MAX_HEIGHT,
  },
  resultsScroll: {
    maxHeight: RESULTS_LIST_MAX_HEIGHT,
  },
  resultItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FAFBFD',
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  },
  emptyResultsText: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  userFoundText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '600',
    lineHeight: 21,
  },
  supportSection: {
    width: '100%',
    marginBottom: 8,
  },
  supportPromptText: {
    width: '100%',
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
  supportLinkButton: {
    marginTop: 8,
    marginBottom: 4,
  },
  searchErrorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 8,
  },
  primaryButton: {
    marginBottom: 12,
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
