import { useEffect, useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { AuthTextField } from '@/components/auth-text-field';
import { ClubFormSwitch } from '@/components/club-form-switch';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import type { Atividade } from '@/types/atividade';
import type { AtividadeFormFieldErrors, AtividadeFormValues } from '@/utils/atividade-form';
import {
  buildUpdateAtividadePayload,
  createAtividadeFormValuesFromRecord,
  hasAtividadeFormChanges,
  validateAtividadeForm,
} from '@/utils/atividade-form';

type EditarAtividadeModalProps = {
  visible: boolean;
  atividade: Atividade | null;
  isSaving?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSave: (payload: ReturnType<typeof buildUpdateAtividadePayload>) => void | Promise<void>;
};

const COLORS = {
  navy: MATCHPOINT_COLORS.navy,
  blue: MATCHPOINT_COLORS.blue,
  white: MATCHPOINT_COLORS.white,
  error: MATCHPOINT_COLORS.error,
  muted: MATCHPOINT_COLORS.muted,
};

export function EditarAtividadeModal({
  visible,
  atividade,
  isSaving = false,
  errorMessage = null,
  onClose,
  onSave,
}: EditarAtividadeModalProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WEB_MAX_CONTENT_WIDTH;

  const [values, setValues] = useState<AtividadeFormValues | null>(null);
  const [initialValues, setInitialValues] = useState<AtividadeFormValues | null>(null);
  const [errors, setErrors] = useState<AtividadeFormFieldErrors>({});

  useEffect(() => {
    if (!visible || !atividade) {
      return;
    }

    const nextValues = createAtividadeFormValuesFromRecord(atividade);
    setValues(nextValues);
    setInitialValues(nextValues);
    setErrors({});
  }, [atividade, visible]);

  function handleClose() {
    if (isSaving) {
      return;
    }

    onClose();
  }

  function handleChange<K extends keyof AtividadeFormValues>(field: K, value: AtividadeFormValues[K]) {
    setValues((current) => (current ? { ...current, [field]: value } : current));

    if (errors[field] || errors.general) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        delete next.general;
        return next;
      });
    }
  }

  function handleNumericChange(field: keyof AtividadeFormValues, text: string) {
    const sanitized = text.replace(/[^\d-]/g, '');
    handleChange(field, sanitized as AtividadeFormValues[typeof field]);
  }

  async function handleSubmit() {
    if (!values || isSaving) {
      return;
    }

    const nextErrors = validateAtividadeForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSave(buildUpdateAtividadePayload(values));
  }

  const hasChanges =
    values != null && initialValues != null && hasAtividadeFormChanges(values, initialValues);
  const isDisabled = isSaving || !values;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}>
          <Pressable
            style={[styles.card, isWide && styles.cardWide]}
            onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>Editar Atividade</Text>
            {atividade ? <Text style={styles.subtitle}>{atividade.atividade}</Text> : null}

            {!values ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={COLORS.blue} />
              </View>
            ) : (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <AuthTextField
                  label="Atividade"
                  value={values.atividade}
                  onChangeText={(text) => handleChange('atividade', text)}
                  autoCapitalize="words"
                  editable={!isDisabled}
                />
                {errors.atividade ? <Text style={styles.fieldError}>{errors.atividade}</Text> : null}

                <AuthTextField
                  label="Capacidade"
                  value={values.capacidade}
                  onChangeText={(text) => handleNumericChange('capacidade', text)}
                  keyboardType="number-pad"
                  editable={!isDisabled}
                />
                {errors.capacidade ? (
                  <Text style={styles.fieldError}>{errors.capacidade}</Text>
                ) : null}

                <AuthTextField
                  label="Horas antes do agendamento"
                  value={values.horasAntes}
                  onChangeText={(text) => handleNumericChange('horasAntes', text)}
                  keyboardType="number-pad"
                  editable={!isDisabled}
                />
                {errors.horasAntes ? <Text style={styles.fieldError}>{errors.horasAntes}</Text> : null}

                <AuthTextField
                  label="Minutos de cancelamento"
                  value={values.minutosCancelamento}
                  onChangeText={(text) => handleNumericChange('minutosCancelamento', text)}
                  keyboardType="number-pad"
                  editable={!isDisabled}
                />
                {errors.minutosCancelamento ? (
                  <Text style={styles.fieldError}>{errors.minutosCancelamento}</Text>
                ) : null}

                <AuthTextField
                  label="Tolerância (minutos)"
                  value={values.tolerancia}
                  onChangeText={(text) => handleNumericChange('tolerancia', text)}
                  keyboardType="numbers-and-punctuation"
                  editable={!isDisabled}
                />
                {errors.tolerancia ? <Text style={styles.fieldError}>{errors.tolerancia}</Text> : null}

                <AuthTextField
                  label="Quantidade de horários"
                  value={values.qtdeHorarios}
                  onChangeText={(text) => handleNumericChange('qtdeHorarios', text)}
                  keyboardType="number-pad"
                  editable={!isDisabled}
                />
                {errors.qtdeHorarios ? (
                  <Text style={styles.fieldError}>{errors.qtdeHorarios}</Text>
                ) : null}

                <AuthTextField
                  label="Tipo de programação"
                  value={values.tipoProgramacao}
                  onChangeText={(text) => handleChange('tipoProgramacao', text)}
                  editable={!isDisabled}
                />

                <AuthTextField
                  label="Check-in antes (minutos)"
                  value={values.checkinAntes}
                  onChangeText={(text) => handleNumericChange('checkinAntes', text)}
                  keyboardType="number-pad"
                  editable={!isDisabled}
                />
                {errors.checkinAntes ? (
                  <Text style={styles.fieldError}>{errors.checkinAntes}</Text>
                ) : null}

                <AuthTextField
                  label="Check-in depois (minutos)"
                  value={values.checkinDepois}
                  onChangeText={(text) => handleNumericChange('checkinDepois', text)}
                  keyboardType="number-pad"
                  editable={!isDisabled}
                />
                {errors.checkinDepois ? (
                  <Text style={styles.fieldError}>{errors.checkinDepois}</Text>
                ) : null}

                <AuthTextField
                  label="Observação"
                  value={values.observacao}
                  onChangeText={(text) => handleChange('observacao', text)}
                  multiline
                  numberOfLines={4}
                  editable={!isDisabled}
                  style={styles.observacaoInput}
                />

                <ClubFormSwitch
                  label="Controle de presença"
                  value={values.controlePresenca}
                  onValueChange={(value) => handleChange('controlePresenca', value)}
                  disabled={isDisabled}
                />

                <ClubFormSwitch
                  label="Check-in seguro"
                  value={values.checkinSeguro}
                  onValueChange={(value) => handleChange('checkinSeguro', value)}
                  disabled={isDisabled}
                />
              </ScrollView>
            )}

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.actions}>
              <AuthButton label="Cancelar" variant="outline" onPress={handleClose} disabled={isSaving} />
              <AuthButton
                label={isSaving ? 'Salvando...' : 'Salvar'}
                onPress={() => void handleSubmit()}
                disabled={isDisabled || !hasChanges}
              />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  keyboardAvoiding: {
    width: '100%',
    maxWidth: 560,
  },
  card: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
  },
  cardWide: {
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  scroll: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  observacaoInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  fieldError: {
    marginTop: -6,
    marginBottom: 8,
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
});
