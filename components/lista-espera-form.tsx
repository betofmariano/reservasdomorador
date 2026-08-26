import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { TimePickerSheet } from '@/components/time-picker-sheet';
import { HOME_MAX_BUTTON_WIDTH, WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import {
  useClubSelectionModalLayout,
} from '@/hooks/use-club-selection-modal-layout';

import { filterAtividadesByAcademia, getAtividades } from '@/services/atividades-service';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import {
  createWaitingListEntry,
  isDuplicateWaitingListError,
} from '@/services/lista-espera-service';
import type { AtividadeOption } from '@/types/atividade';
import type { AssociatedClubOption } from '@/types/lista-espera';
import type { User } from '@/types/user';
import { resolveTelefoneCadastroUsuario } from '@/utils/lista-espera-contato';
import { sortByClubNome } from '@/utils/club-sort';
import {
  buildDateTimeTimestamp,
  formatFullDateLabel,
  formatTimeLabel,
  getTodayDate,
  LISTA_ESPERA_SCHEDULE,
  roundToCurrentTimeSlot,
  snapTimeToSchedule,
} from '@/utils/jogos-time';

type ListaEsperaFormProps = {
  visible: boolean;
  user: User | null;
  authToken: string | null;
  clubs: AssociatedClubOption[];
  onClose: () => void;
  onSuccess: () => void;
};

type PickerMode = 'date' | 'time' | 'club' | 'activity' | null;

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  white: '#FFFFFF',
  error: '#D64545',
  border: '#D5DAE3',
};

const NO_USER_MESSAGE = 'Não foi possível identificar o usuário.';
const REQUIRED_FIELDS_MESSAGE = 'Preencha todos os campos obrigatórios.';
const CREATE_ERROR_MESSAGE = 'Não foi possível entrar na lista de espera. Tente novamente.';
const DUPLICATE_MESSAGE = 'Você já está nesta lista de espera.';
const LOAD_ACTIVITIES_ERROR = 'Não foi possível carregar as atividades deste local.';

export function ListaEsperaForm({
  visible,
  user,
  authToken,
  clubs,
  onClose,
  onSuccess,
}: ListaEsperaFormProps) {
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [activities, setActivities] = useState<AtividadeOption[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [selectedTime, setSelectedTime] = useState(() =>
    roundToCurrentTimeSlot(new Date(), LISTA_ESPERA_SCHEDULE),
  );
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const minimumDate = useMemo(() => getTodayDate(), []);
  const sortedClubs = useMemo(() => sortByClubNome(clubs), [clubs]);
  const { isLargeScreen, overlayStyle, contentStyle, nestedOverlayStyle, nestedCardStyle } =
    useClubSelectionModalLayout({ maxWidth: WEB_MAX_CONTENT_WIDTH });

  const selectedClub = sortedClubs.find((club) => club.id === selectedClubId);
  const selectedActivity = activities.find((activity) => activity.id === selectedActivityId);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const now = new Date();
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    setSelectedDate(date);
    setSelectedTime(roundToCurrentTimeSlot(now, LISTA_ESPERA_SCHEDULE));
    setErrorMessage(null);
    setPickerMode(null);
    setActivities([]);
    setSelectedActivityId(null);

    if (sortedClubs.length === 1) {
      setSelectedClubId(sortedClubs[0].id);
      return;
    }

    setSelectedClubId(null);
  }, [visible, sortedClubs]);

  useEffect(() => {
    if (!visible || !selectedClubId) {
      setActivities([]);
      setSelectedActivityId(null);
      return;
    }

    let cancelled = false;

    async function loadActivities() {
      setIsLoadingActivities(true);
      setErrorMessage(null);

      try {
        const allActivities = await getAtividades();
        const filtered = filterAtividadesByAcademia(allActivities, selectedClubId!);
        const options = filtered.map((item) => ({
          id: item.id,
          nome: item.atividade,
        }));

        if (cancelled) {
          return;
        }

        setActivities(options);
        setSelectedActivityId(options.length === 1 ? options[0].id : null);
      } catch {
        if (!cancelled) {
          setActivities([]);
          setSelectedActivityId(null);
          setErrorMessage(LOAD_ACTIVITIES_ERROR);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingActivities(false);
        }
      }
    }

    void loadActivities();

    return () => {
      cancelled = true;
    };
  }, [selectedClubId, visible]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setPickerMode(null);
    onClose();
  }

  function closePickers() {
    setPickerMode(null);
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    if (!user?.id || !authToken) {
      setErrorMessage(NO_USER_MESSAGE);
      return;
    }

    if (!selectedClubId || !selectedActivityId || !selectedActivity) {
      setErrorMessage(REQUIRED_FIELDS_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createWaitingListEntry(
        {
          academias_id: selectedClubId,
          atividades_id: selectedActivityId,
          atividade: selectedActivity.nome,
          users_id: user.id,
          nome: user.nome,
          telefone: resolveTelefoneCadastroUsuario(user),
          email: user.email ?? '',
          dataAtividade: buildDateTimeTimestamp(selectedDate, selectedTime),
        },
        authToken,
      );

      onClose();
      onSuccess();
    } catch (error) {
      if (isDuplicateWaitingListError(error)) {
        setErrorMessage(DUPLICATE_MESSAGE);
        return;
      }

      const message =
        error instanceof ApiError && error.message
          ? error.message
          : getApiErrorMessage(error) || CREATE_ERROR_MESSAGE;

      setErrorMessage(message.includes('conectar') ? message : CREATE_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
        <View style={[styles.overlay, overlayStyle]}>
          <View style={[styles.panelHost, contentStyle]}>
            <View style={[styles.card, isLargeScreen && styles.cardLargeScreen]}>
              <View style={styles.header}>
                <Text style={styles.title}>Entrar em uma lista de espera</Text>
                <Pressable onPress={handleClose} disabled={isSubmitting} hitSlop={8}>
                  <Ionicons name="close" size={28} color={COLORS.navy} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Local</Text>
                <Pressable
                  style={[styles.selector, sortedClubs.length <= 1 && styles.selectorDisabled]}
                  onPress={() => sortedClubs.length > 1 && setPickerMode('club')}
                  disabled={isSubmitting || sortedClubs.length <= 1}>
                  <Text style={styles.selectorText}>
                    {selectedClub ? selectedClub.nome : 'Selecione o local'}
                  </Text>
                  {sortedClubs.length > 1 ? (
                    <Ionicons name="chevron-down" size={20} color={COLORS.navy} />
                  ) : null}
                </Pressable>

                <Text style={styles.label}>Atividade</Text>
                <Pressable
                  style={[
                    styles.selector,
                    (!selectedClubId || isLoadingActivities || activities.length <= 1) &&
                      styles.selectorDisabled,
                  ]}
                  onPress={() =>
                    selectedClubId &&
                    !isLoadingActivities &&
                    activities.length > 1 &&
                    setPickerMode('activity')
                  }
                  disabled={
                    isSubmitting ||
                    !selectedClubId ||
                    isLoadingActivities ||
                    activities.length <= 1
                  }>
                  {isLoadingActivities ? (
                    <ActivityIndicator size="small" color={COLORS.blue} />
                  ) : (
                    <Text style={styles.selectorText}>
                      {selectedActivity?.nome ??
                        (selectedClubId ? 'Selecione a atividade' : 'Selecione o local primeiro')}
                    </Text>
                  )}
                  {activities.length > 1 && !isLoadingActivities ? (
                    <Ionicons name="chevron-down" size={20} color={COLORS.navy} />
                  ) : null}
                </Pressable>

                <Text style={styles.label}>Data</Text>
                <Pressable
                  style={styles.selector}
                  onPress={() => setPickerMode('date')}
                  disabled={isSubmitting}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.blue} />
                  <Text style={styles.selectorText}>{formatFullDateLabel(selectedDate)}</Text>
                </Pressable>

                <Text style={styles.label}>Horário</Text>
                <Pressable
                  style={styles.selector}
                  onPress={() => setPickerMode('time')}
                  disabled={isSubmitting}>
                  <Ionicons name="time-outline" size={18} color={COLORS.blue} />
                  <Text style={styles.selectorText}>{formatTimeLabel(selectedTime)}</Text>
                </Pressable>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <Pressable
                  style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                  onPress={() => void handleSubmit()}
                  disabled={isSubmitting || isLoadingActivities}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.submitButtonText}>Confirmar entrada</Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>

            {pickerMode === 'club' ? (
              <Pressable
                style={[styles.pickerOverlayAbsolute, nestedOverlayStyle]}
                onPress={() => setPickerMode(null)}>
                <Pressable
                  style={[styles.pickerCard, nestedCardStyle]}
                  onPress={(event) => event.stopPropagation()}>
                  <Text style={styles.pickerTitle}>Selecione o local</Text>
                  <ScrollView style={styles.optionList}>
                    {sortedClubs.map((club) => (
                      <Pressable
                        key={club.id}
                        style={styles.optionRow}
                        onPress={() => {
                          setSelectedClubId(club.id);
                          setPickerMode(null);
                        }}>
                        <Text style={styles.optionText}>{club.nome}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </Pressable>
              </Pressable>
            ) : null}

            {pickerMode === 'activity' ? (
              <Pressable
                style={[styles.pickerOverlayAbsolute, nestedOverlayStyle]}
                onPress={() => setPickerMode(null)}>
                <Pressable
                  style={[styles.pickerCard, nestedCardStyle]}
                  onPress={(event) => event.stopPropagation()}>
                  <Text style={styles.pickerTitle}>Selecione a atividade</Text>
                  <ScrollView style={styles.optionList}>
                    {activities.map((activity) => (
                      <Pressable
                        key={activity.id}
                        style={styles.optionRow}
                        onPress={() => {
                          setSelectedActivityId(activity.id);
                          setPickerMode(null);
                        }}>
                        <Text style={styles.optionText}>{activity.nome}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </Pressable>
              </Pressable>
            ) : null}

            <DatePickerSheet
              visible={pickerMode === 'date'}
              value={selectedDate}
              minimumDate={minimumDate}
              onConfirm={setSelectedDate}
              onClose={closePickers}
              presentation="overlay"
              maxWidth={HOME_MAX_BUTTON_WIDTH}
            />

            <TimePickerSheet
              visible={pickerMode === 'time'}
              value={selectedTime}
              minuteInterval={15}
              onConfirm={(time) => setSelectedTime(snapTimeToSchedule(time))}
              onClose={closePickers}
              presentation="overlay"
              maxWidth={HOME_MAX_BUTTON_WIDTH}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  panelHost: {
    position: 'relative',
    width: '100%',
    minHeight: 280,
  },
  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  cardLargeScreen: {
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 8,
    marginTop: 8,
  },
  selector: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: COLORS.white,
  },
  selectorDisabled: {
    opacity: 0.85,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.navy,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  submitButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  pickerOverlayAbsolute: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 20,
  },
  pickerCard: {
    backgroundColor: COLORS.white,
    paddingBottom: 20,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    paddingVertical: 14,
  },
  optionList: {
    maxHeight: 280,
    paddingHorizontal: 16,
  },
  optionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  optionText: {
    fontSize: 15,
    color: COLORS.blue,
    fontWeight: '600',
  },
});
