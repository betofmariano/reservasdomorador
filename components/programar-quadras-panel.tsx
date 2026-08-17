import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { InlineListSelectionSheet } from '@/components/inline-list-selection-sheet';
import { AuthButton } from '@/components/auth-button';
import { ClubSelector } from '@/components/club-selector';
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { TimePickerSheet } from '@/components/time-picker-sheet';
import { HOME_MAX_BUTTON_WIDTH } from '@/constants/web-layout';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import { useClubAdminSelection } from '@/hooks/use-club-admin-selection';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { programarQuadra } from '@/services/programar-quadras-service';
import { getQuadrasByAcademia } from '@/services/quadras-service';
import type { Quadra } from '@/types/quadra';
import type { User } from '@/types/user';
import { USO_QUADRA_PROGRAMAR_OPTIONS } from '@/types/programar-quadras';
import {
  buildProgramarQuadrasPayload,
  createInitialProgramarQuadrasFormValues,
  formatProgramarDateLabel,
  formatProgramarTimeLabel,
  PROGRAMAR_QUADRAS_HOUR_RANGE,
  PROGRAMAR_QUADRAS_MESSAGES,
  validateProgramarQuadrasForm,
  type ProgramarQuadrasFormValues,
} from '@/utils/programar-quadras';
import { normalizeCalendarDate } from '@/utils/jogos-time';

type ProgramarQuadrasPanelProps = {
  user: User;
  disabled?: boolean;
  onCancel: () => void;
};

type DateFieldTarget = 'startDate' | 'endDate' | null;
type TimeFieldTarget = 'startTime' | 'endTime' | null;

function sortQuadras(items: Quadra[]): Quadra[] {
  return [...items].sort((a, b) => a.quadra - b.quadra);
}

function buildDefaultQuadraSelection(quadras: Quadra[]): Pick<ProgramarQuadrasFormValues, 'quadra'> {
  if (quadras.length === 0) {
    return { quadra: '' };
  }

  return { quadra: String(quadras[0].quadra) };
}

export function ProgramarQuadrasPanel({ user, disabled = false, onCancel }: ProgramarQuadrasPanelProps) {
  const { showToast } = useAppToast();
  const { authToken } = useAuth();

  const [values, setValues] = useState<ProgramarQuadrasFormValues>(() =>
    createInitialProgramarQuadrasFormValues(),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeDateField, setActiveDateField] = useState<DateFieldTarget>(null);
  const [activeTimeField, setActiveTimeField] = useState<TimeFieldTarget>(null);
  const [isQuadraModalVisible, setIsQuadraModalVisible] = useState(false);
  const [isUsoModalVisible, setIsUsoModalVisible] = useState(false);

  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [isLoadingQuadras, setIsLoadingQuadras] = useState(false);
  const [quadrasLoadError, setQuadrasLoadError] = useState<string | null>(null);
  const quadrasRequestIdRef = useRef(0);

  const handleUnauthorized = useCallback(async () => {
    onCancel();
  }, [onCancel]);

  const {
    availableClubs,
    selectedClubId,
    isLoadingClubs,
    clubsLoadError,
    canManageSelectedClub,
    showClubSelector,
    loadedClub,
    setSelectedClubId,
    fetchAvailableClubs,
  } = useClubAdminSelection({
    user,
    authToken,
    isAuthLoading: false,
    onUnauthorized: handleUnauthorized,
  });

  const registeredQuadras = quadras.map((item) => item.quadra);

  useEffect(() => {
    if (!authToken || !selectedClubId || !canManageSelectedClub) {
      setQuadras([]);
      setQuadrasLoadError(null);
      setValues((current) => ({ ...current, quadra: '' }));
      return;
    }

    const requestId = ++quadrasRequestIdRef.current;
    setIsLoadingQuadras(true);
    setQuadrasLoadError(null);
    setQuadras([]);

    void getQuadrasByAcademia(selectedClubId, authToken)
      .then((data) => {
        if (requestId !== quadrasRequestIdRef.current) {
          return;
        }

        const sorted = sortQuadras(data);
        setQuadras(sorted);
        setValues((current) => ({
          ...current,
          ...buildDefaultQuadraSelection(sorted),
        }));
      })
      .catch((error) => {
        if (requestId !== quadrasRequestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          void handleUnauthorized();
          return;
        }

        const message = getApiErrorMessage(error);
        setQuadrasLoadError(message.includes('conectar') ? message : PROGRAMAR_QUADRAS_MESSAGES.submitError);
      })
      .finally(() => {
        if (requestId === quadrasRequestIdRef.current) {
          setIsLoadingQuadras(false);
        }
      });
  }, [authToken, canManageSelectedClub, handleUnauthorized, selectedClubId]);

  function updateValues(patch: Partial<ProgramarQuadrasFormValues>) {
    setValues((current) => ({ ...current, ...patch }));

    if (errorMessage) {
      setErrorMessage(null);
    }
  }

  function openTimePicker(target: TimeFieldTarget) {
    if (disabled || isSubmitting || isLoadingQuadras) {
      return;
    }

    setActiveTimeField(target);
  }

  function openQuadraPicker() {
    if (disabled || isSubmitting || isLoadingQuadras || quadras.length === 0) {
      return;
    }

    setIsQuadraModalVisible(true);
  }

  async function handleConfirm() {
    if (disabled || isSubmitting) {
      return;
    }

    if (!authToken) {
      setErrorMessage(PROGRAMAR_QUADRAS_MESSAGES.submitError);
      return;
    }

    if (!selectedClubId) {
      setErrorMessage(PROGRAMAR_QUADRAS_MESSAGES.clubRequired);
      return;
    }

    if (!canManageSelectedClub) {
      setErrorMessage(PROGRAMAR_QUADRAS_MESSAGES.permission);
      return;
    }

    const validationError = validateProgramarQuadrasForm(values, { registeredQuadras });

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = buildProgramarQuadrasPayload(selectedClubId, values);
      await programarQuadra(payload, authToken);
      showToast(PROGRAMAR_QUADRAS_MESSAGES.submitSuccess, { variant: 'success' });
      onCancel();
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setErrorMessage(PROGRAMAR_QUADRAS_MESSAGES.permission);
      } else {
        const message = getApiErrorMessage(error);
        setErrorMessage(message.includes('conectar') ? message : PROGRAMAR_QUADRAS_MESSAGES.submitError);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isFormDisabled = disabled || isSubmitting || isLoadingClubs || isLoadingQuadras;
  const selectedQuadra = values.quadra || '—';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Programar Quadras</Text>
      <View style={styles.divider} />

      {showClubSelector ? (
        <View style={styles.fieldBlock}>
          <ClubSelector
            clubs={availableClubs}
            value={selectedClubId}
            onChange={setSelectedClubId}
            isLoading={isLoadingClubs}
            error={clubsLoadError}
            onRetry={() => void fetchAvailableClubs()}
            disabled={isFormDisabled}
            label="Clube"
            placeholder="Selecione um clube"
            modalTitle="Selecione o clube"
          />
        </View>
      ) : loadedClub ? (
        <View style={styles.fieldBlock}>
          <Text style={styles.localLabel}>Local</Text>
          <Text style={styles.localValue}>{loadedClub.nome}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Intervalo de Horas</Text>
      <View style={styles.intervalRow}>
        <Pressable
          style={styles.intervalBox}
          onPress={() => setActiveDateField('startDate')}
          disabled={isFormDisabled}>
          <Text style={styles.intervalBoxText} numberOfLines={1}>
            {formatProgramarDateLabel(values.startDate)}
          </Text>
        </Pressable>
        <Pressable
          style={styles.intervalBox}
          onPress={() => openTimePicker('startTime')}
          disabled={isFormDisabled}>
          <Text style={styles.intervalBoxText} numberOfLines={1}>
            {formatProgramarTimeLabel(values.startTime)}
          </Text>
        </Pressable>
        <Pressable
          style={styles.intervalBox}
          onPress={() => setActiveDateField('endDate')}
          disabled={isFormDisabled}>
          <Text style={styles.intervalBoxText} numberOfLines={1}>
            {formatProgramarDateLabel(values.endDate)}
          </Text>
        </Pressable>
        <Pressable
          style={styles.intervalBox}
          onPress={() => openTimePicker('endTime')}
          disabled={isFormDisabled}>
          <Text style={styles.intervalBoxText} numberOfLines={1}>
            {formatProgramarTimeLabel(values.endTime)}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Número da Quadra</Text>
      {isLoadingQuadras ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={MATCHPOINT_COLORS.blue} />
          <Text style={styles.loadingText}>Carregando quadras...</Text>
        </View>
      ) : (
        <Pressable
          style={[styles.selector, quadras.length === 0 && styles.selectorDisabled]}
          onPress={openQuadraPicker}
          disabled={isFormDisabled || quadras.length === 0}>
          <Text style={styles.selectorText} numberOfLines={1}>
            {selectedQuadra}
          </Text>
          <Ionicons name="chevron-down" size={18} color={MATCHPOINT_COLORS.navy} />
        </Pressable>
      )}

      {quadrasLoadError ? <Text style={styles.errorText}>{quadrasLoadError}</Text> : null}
      {!isLoadingQuadras && quadras.length === 0 && !quadrasLoadError ? (
        <Text style={styles.helperText}>{PROGRAMAR_QUADRAS_MESSAGES.quadrasEmpty}</Text>
      ) : null}

      <Text style={styles.sectionLabel}>Uso da Quadra</Text>
      <Pressable
        style={styles.selector}
        onPress={() => setIsUsoModalVisible(true)}
        disabled={isFormDisabled}>
        <Text style={styles.selectorText} numberOfLines={1}>
          {values.usoQuadra}
        </Text>
        <Ionicons name="chevron-down" size={20} color={MATCHPOINT_COLORS.navy} />
      </Pressable>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {isSubmitting ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={MATCHPOINT_COLORS.blue} />
          <Text style={styles.loadingText}>Programando...</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <AuthButton
          label="Cancelar"
          variant="outline"
          onPress={onCancel}
          disabled={isSubmitting}
          style={styles.actionButton}
        />
        <AuthButton
          label="Confirmar"
          onPress={() => void handleConfirm()}
          disabled={isFormDisabled || !canManageSelectedClub || quadras.length === 0}
          style={styles.actionButton}
        />
      </View>

      </ScrollView>

      <DatePickerSheet
        visible={activeDateField === 'startDate'}
        value={values.startDate}
        onConfirm={(date) => updateValues({ startDate: normalizeCalendarDate(date) })}
        onClose={() => setActiveDateField(null)}
        presentation="overlay"
        maxWidth={HOME_MAX_BUTTON_WIDTH}
      />
      <DatePickerSheet
        visible={activeDateField === 'endDate'}
        value={values.endDate}
        onConfirm={(date) => updateValues({ endDate: normalizeCalendarDate(date) })}
        onClose={() => setActiveDateField(null)}
        presentation="overlay"
        maxWidth={HOME_MAX_BUTTON_WIDTH}
      />

      <TimePickerSheet
        visible={activeTimeField === 'startTime'}
        value={values.startTime}
        minuteInterval={60}
        hourRange={PROGRAMAR_QUADRAS_HOUR_RANGE}
        onConfirm={(time) => updateValues({ startTime: time })}
        onClose={() => setActiveTimeField(null)}
        presentation="overlay"
        maxWidth={HOME_MAX_BUTTON_WIDTH}
      />
      <TimePickerSheet
        visible={activeTimeField === 'endTime'}
        value={values.endTime}
        minuteInterval={60}
        hourRange={PROGRAMAR_QUADRAS_HOUR_RANGE}
        onConfirm={(time) => updateValues({ endTime: time })}
        onClose={() => setActiveTimeField(null)}
        presentation="overlay"
        maxWidth={HOME_MAX_BUTTON_WIDTH}
      />

      <InlineListSelectionSheet
        visible={isQuadraModalVisible}
        title="Selecione a quadra"
        onClose={() => setIsQuadraModalVisible(false)}
        maxWidth={HOME_MAX_BUTTON_WIDTH}>
        {quadras.map((quadraItem) => {
          const quadraValue = String(quadraItem.quadra);
          const isSelected = values.quadra === quadraValue;

          return (
            <Pressable
              key={quadraItem.id}
              style={[styles.usoOption, isSelected && styles.usoOptionSelected]}
              onPress={() => {
                updateValues({ quadra: quadraValue });
                setIsQuadraModalVisible(false);
              }}>
              <Text style={[styles.usoOptionText, isSelected && styles.usoOptionTextSelected]}>
                Quadra {quadraItem.quadra}
              </Text>
            </Pressable>
          );
        })}
      </InlineListSelectionSheet>

      <InlineListSelectionSheet
        visible={isUsoModalVisible}
        title="Uso da Quadra"
        onClose={() => setIsUsoModalVisible(false)}
        maxWidth={HOME_MAX_BUTTON_WIDTH}>
        {USO_QUADRA_PROGRAMAR_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={[styles.usoOption, values.usoQuadra === option && styles.usoOptionSelected]}
            onPress={() => {
              updateValues({ usoQuadra: option });
              setIsUsoModalVisible(false);
            }}>
            <Text
              style={[
                styles.usoOptionText,
                values.usoQuadra === option && styles.usoOptionTextSelected,
              ]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </InlineListSelectionSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 360,
  },
  scrollContent: {
    width: '100%',
    alignItems: 'stretch',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  fieldBlock: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  localLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MATCHPOINT_COLORS.muted,
    marginBottom: 6,
  },
  localValue: {
    fontSize: 17,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.navy,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.error,
    textAlign: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: MATCHPOINT_COLORS.accent,
    borderRadius: 1,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.navy,
    textAlign: 'center',
  },
  intervalRow: {
    width: '100%',
    maxWidth: '100%',
    flexDirection: 'row',
    gap: 6,
  },
  intervalBox: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MATCHPOINT_COLORS.borderLight,
    backgroundColor: MATCHPOINT_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  intervalBoxText: {
    fontSize: 14,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.blue,
    textAlign: 'center',
  },
  selector: {
    width: '100%',
    maxWidth: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderColor: MATCHPOINT_COLORS.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MATCHPOINT_COLORS.white,
    gap: 8,
    overflow: 'hidden',
  },
  selectorDisabled: {
    opacity: 0.6,
  },
  selectorText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '600',
    color: MATCHPOINT_COLORS.navy,
  },
  helperText: {
    fontSize: 14,
    fontWeight: '600',
    color: MATCHPOINT_COLORS.muted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: MATCHPOINT_COLORS.error,
    textAlign: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: MATCHPOINT_COLORS.navy,
  },
  actions: {
    width: '100%',
    maxWidth: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
  },
  usoOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: MATCHPOINT_COLORS.borderSubtle,
    alignItems: 'center',
  },
  usoOptionSelected: {
    backgroundColor: '#EAF1FB',
  },
  usoOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: MATCHPOINT_COLORS.navy,
  },
  usoOptionTextSelected: {
    color: MATCHPOINT_COLORS.blue,
    fontWeight: '700',
  },
});
