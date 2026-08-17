import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UsuarioAutocomplete } from '@/components/usuario-autocomplete';
import { createClubUsersCache } from '@/services/club-users-service';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { saveGamePlayers, notifyParceirosAdicionadosViaWhatsApp } from '@/services/game-players-service';
import type { ReservaSummary } from '@/types/home-summary';
import type { GamePlayersFormState, PlayerFieldKey, SelectedClubUser } from '@/types/game-players';
import type { User } from '@/types/user';
import { formatDateLabel, formatGameTime } from '@/utils/jogos-time';
import {
  canChangeJogoDuplasToggle,
  createInitialFormState,
  GAME_PLAYERS_DUPLICATE_MESSAGE,
  GAME_PLAYERS_RESERVATION_CONFLICT_MESSAGE,
  getExcludedIdsForField,
  isGamePlayersFormReadyToSave,
  resolveJogoDuplasForClub,
  validateGamePlayersForm,
} from '@/utils/game-players-validation';

type AdicionarJogadoresModalProps = {
  visible: boolean;
  reserva: ReservaSummary | null;
  user: User;
  authToken: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  gold: '#E8B830',
  white: '#FFFFFF',
  error: '#D64545',
  success: '#1F8A4C',
  neutralButton: '#1B1B1B',
  muted: '#5C6475',
};

const SAVE_ERROR_MESSAGE = 'Não foi possível adicionar os jogadores. Tente novamente.';
const SUCCESS_MESSAGE = 'Jogadores adicionados com sucesso.';

export function AdicionarJogadoresModal({
  visible,
  reserva,
  user,
  authToken,
  onClose,
  onSuccess,
}: AdicionarJogadoresModalProps) {
  const isGestor = user.gestor === true;
  const cacheRef = useRef(createClubUsersCache());

  const [form, setForm] = useState<GamePlayersFormState>(() =>
    createInitialFormState(false, isGestor, {
      users_id: user.id,
      nome: user.nome,
    }),
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConflictModalVisible, setIsConflictModalVisible] = useState(false);

  const currentUserSelection = useMemo<SelectedClubUser>(
    () => ({
      users_id: user.id,
      nome: user.nome,
    }),
    [user.id, user.nome],
  );

  useEffect(() => {
    if (!visible || !reserva) {
      return;
    }

    cacheRef.current = createClubUsersCache();
    const initialJogoDuplas = resolveJogoDuplasForClub(
      reserva.jogoDuplas,
      reserva.clubeJogoSimples,
      reserva.clubeJogoDuplas,
    );
    setForm(createInitialFormState(initialJogoDuplas, isGestor, currentUserSelection));
    setValidationError(null);
    setDuplicateError(null);
    setSaveError(null);
    setIsSaving(false);
    setIsConflictModalVisible(false);
  }, [
    visible,
    reserva?.id,
    isGestor,
    currentUserSelection,
    reserva?.jogoDuplas,
    reserva?.clubeJogoSimples,
    reserva?.clubeJogoDuplas,
  ]);

  function handleClose() {
    if (isSaving) {
      return;
    }

    onClose();
  }

  function updateField(field: PlayerFieldKey, value: SelectedClubUser | null) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setValidationError(null);
    setDuplicateError(null);
    setSaveError(null);
  }

  function handleToggleDuplas() {
    if (!reserva || !canChangeJogoDuplasToggle(reserva.clubeJogoSimples, reserva.clubeJogoDuplas)) {
      return;
    }

    setForm((current) => ({
      ...current,
      jogoDuplas: !current.jogoDuplas,
      parceiro1: !current.jogoDuplas ? current.parceiro1 : null,
      parceiro2: !current.jogoDuplas ? current.parceiro2 : null,
    }));
    setValidationError(null);
    setDuplicateError(null);
  }

  function handleDuplicateAttempt() {
    setDuplicateError(GAME_PLAYERS_DUPLICATE_MESSAGE);
  }

  function clearConflictedPlayerInputs() {
    setForm((current) => ({
      ...current,
      adversario: null,
      parceiro1: null,
      parceiro2: null,
    }));
    setValidationError(null);
    setDuplicateError(null);
    setSaveError(null);
  }

  function handleConflictDismiss() {
    clearConflictedPlayerInputs();
    setIsConflictModalVisible(false);
  }

  async function handleSave() {
    if (isSaving || !reserva || !authToken) {
      return;
    }

    const validationMessage = validateGamePlayersForm(form, isGestor, user.id);

    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    const responsavelId = isGestor ? form.responsavel!.users_id : user.id;

    setIsSaving(true);
    setSaveError(null);
    setValidationError(null);

    try {
      let response;

      if (form.jogoDuplas) {
        response = await saveGamePlayers(
          {
            jogoDuplas: true,
            jogos_id: reserva.id,
            responsavel_id: responsavelId,
            adversario_id: form.adversario!.users_id,
            parceiro1_id: form.parceiro1!.users_id,
            parceiro2_id: form.parceiro2!.users_id,
          },
          authToken,
        );
      } else {
        response = await saveGamePlayers(
          {
            jogoDuplas: false,
            jogos_id: reserva.id,
            responsavel_id: responsavelId,
            adversario_id: form.adversario!.users_id,
          },
          authToken,
        );
      }

      if (response === false) {
        setIsConflictModalVisible(true);
        return;
      }

      await notifyParceirosAdicionadosViaWhatsApp(
        {
          jogos_id: reserva.id,
          academias_id: reserva.academias_id,
        },
        authToken,
      );

      onClose();
      onSuccess();
    } catch (error) {
      const message =
        error instanceof ApiError && error.message.includes('conectar')
          ? error.message
          : getApiErrorMessage(error) || SAVE_ERROR_MESSAGE;

      setSaveError(message.includes('conectar') ? message : SAVE_ERROR_MESSAGE);
    } finally {
      setIsSaving(false);
    }
  }

  if (!reserva || !authToken) {
    return null;
  }

  const dataLabel = formatDateLabel(new Date(reserva.dataAtividade));
  const horaLabel = formatGameTime(reserva.dataAtividade);
  const canSave = isGamePlayersFormReadyToSave(form, isGestor);
  const canToggleJogoDuplas = canChangeJogoDuplasToggle(
    reserva.clubeJogoSimples,
    reserva.clubeJogoDuplas,
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Adicionar jogadores</Text>

            <View style={styles.headerRow}>
              <View style={styles.headerColumn}>
                <Text style={styles.headerLabel}>Data</Text>
                <Text style={styles.headerValue}>
                  {dataLabel} - {horaLabel}
                </Text>
              </View>
              <View style={styles.headerColumn}>
                <Text style={styles.headerLabel}>Quadra</Text>
                <Text style={styles.headerValue}>{reserva.quadra}</Text>
              </View>
            </View>

            <Pressable
              style={[styles.duplasToggle, !canToggleJogoDuplas && styles.duplasToggleDisabled]}
              onPress={handleToggleDuplas}
              disabled={!canToggleJogoDuplas}>
              <Ionicons
                name={form.jogoDuplas ? 'checkbox' : 'square-outline'}
                size={22}
                color={canToggleJogoDuplas ? COLORS.blue : COLORS.muted}
              />
              <Text style={[styles.duplasLabel, !canToggleJogoDuplas && styles.duplasLabelDisabled]}>
                Jogo de Duplas?
              </Text>
            </Pressable>

            {isGestor ? (
              <UsuarioAutocomplete
                label="Responsável"
                academiasId={reserva.academias_id}
                authToken={authToken}
                selectedUser={form.responsavel}
                excludedUserIds={getExcludedIdsForField(form, 'responsavel', isGestor, user.id)}
                onSelect={(selected) => updateField('responsavel', selected)}
                onClear={() => updateField('responsavel', null)}
                onDuplicateAttempt={handleDuplicateAttempt}
                cache={cacheRef.current}
              />
            ) : null}

            <UsuarioAutocomplete
              label="Adversário"
              academiasId={reserva.academias_id}
              authToken={authToken}
              selectedUser={form.adversario}
              excludedUserIds={getExcludedIdsForField(form, 'adversario', isGestor, user.id)}
              onSelect={(selected) => updateField('adversario', selected)}
              onClear={() => updateField('adversario', null)}
              onDuplicateAttempt={handleDuplicateAttempt}
              cache={cacheRef.current}
            />

            {form.jogoDuplas ? (
              <>
                <UsuarioAutocomplete
                  label="Parceiro 1"
                  academiasId={reserva.academias_id}
                  authToken={authToken}
                  selectedUser={form.parceiro1}
                  excludedUserIds={getExcludedIdsForField(form, 'parceiro1', isGestor, user.id)}
                  onSelect={(selected) => updateField('parceiro1', selected)}
                  onClear={() => updateField('parceiro1', null)}
                  onDuplicateAttempt={handleDuplicateAttempt}
                  cache={cacheRef.current}
                />

                <UsuarioAutocomplete
                  label="Parceiro 2"
                  academiasId={reserva.academias_id}
                  authToken={authToken}
                  selectedUser={form.parceiro2}
                  excludedUserIds={getExcludedIdsForField(form, 'parceiro2', isGestor, user.id)}
                  onSelect={(selected) => updateField('parceiro2', selected)}
                  onClear={() => updateField('parceiro2', null)}
                  onDuplicateAttempt={handleDuplicateAttempt}
                  cache={cacheRef.current}
                />
              </>
            ) : null}

            {duplicateError ? <Text style={styles.errorText}>{duplicateError}</Text> : null}
            {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
            {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.cancelButton, isSaving && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={isSaving}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[styles.saveButton, (!canSave || isSaving) && styles.buttonDisabled]}
              onPress={() => void handleSave()}
              disabled={!canSave || isSaving}>
              {isSaving ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.saveButtonText}>Salvando...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Salvar</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {isConflictModalVisible ? (
          <View style={styles.conflictOverlay}>
            <View style={styles.conflictCard}>
              <Text style={styles.conflictMessage}>{GAME_PLAYERS_RESERVATION_CONFLICT_MESSAGE}</Text>
              <Pressable style={styles.conflictButton} onPress={handleConflictDismiss}>
                <Text style={styles.conflictButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

export const ADICIONAR_JOGADORES_SUCCESS_MESSAGE = SUCCESS_MESSAGE;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gold,
    textAlign: 'center',
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  headerColumn: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  headerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.navy,
  },
  duplasToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  duplasToggleDisabled: {
    opacity: 0.65,
  },
  duplasLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
  },
  duplasLabelDisabled: {
    color: COLORS.muted,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E6EE',
    backgroundColor: COLORS.white,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.neutralButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
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
  conflictOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 20,
  },
  conflictCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  conflictMessage: {
    fontSize: 15,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  conflictButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
