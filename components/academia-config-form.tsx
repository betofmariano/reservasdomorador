import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { AuthTextField } from '@/components/auth-text-field';
import { ClubFormSwitch } from '@/components/club-form-switch';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import type { AcademiaFormFieldErrors, AcademiaFormValues } from '@/types/academia';

type AcademiaConfigFormProps = {
  values: AcademiaFormValues;
  errors: AcademiaFormFieldErrors;
  isSubmitting: boolean;
  disabled?: boolean;
  regulamentoUrl?: string | null;
  onChange: <K extends keyof AcademiaFormValues>(field: K, value: AcademiaFormValues[K]) => void;
  onViewRegulamento?: () => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const COLORS = {
  navy: MATCHPOINT_COLORS.navy,
  error: MATCHPOINT_COLORS.error,
};

export function AcademiaConfigForm({
  values,
  errors,
  isSubmitting,
  disabled = false,
  regulamentoUrl = null,
  onChange,
  onViewRegulamento,
  onCancel,
  onSubmit,
}: AcademiaConfigFormProps) {
  const { width: screenWidth } = useWindowDimensions();
  const useTwoColumns = screenWidth >= WEB_MAX_CONTENT_WIDTH;
  const isDisabled = disabled || isSubmitting;

  return (
    <View style={styles.form}>
      <Text style={styles.pageTitle}>Configuração do Local</Text>

      {errors.general ? <Text style={styles.generalError}>{errors.general}</Text> : null}

      <Text style={styles.sectionTitle}>Dados principais</Text>
      <AuthTextField
        label="Nome do local"
        value={values.nome}
        onChangeText={(text) => onChange('nome', text)}
        autoCapitalize="words"
        editable={!isDisabled}
      />
      {errors.nome ? <Text style={styles.fieldError}>{errors.nome}</Text> : null}

      <Text style={styles.sectionTitle}>Parâmetros</Text>

      <View style={[styles.switchGrid, useTwoColumns && styles.switchGridWide]}>
        <View style={styles.switchColumn}>
          <ClubFormSwitch
            label="Título de sócio"
            value={values.tituloSocio}
            onValueChange={(value) => onChange('tituloSocio', value)}
            disabled={isDisabled}
          />
          <ClubFormSwitch
            label="Associação exigida"
            value={values.associacaoExigida}
            onValueChange={(value) => onChange('associacaoExigida', value)}
            disabled={isDisabled}
          />
          <ClubFormSwitch
            label="Tem regulamento"
            value={values.temRegulamento}
            onValueChange={(value) => onChange('temRegulamento', value)}
            disabled={isDisabled}
          />
        </View>

        <View style={styles.switchColumn}>
          <ClubFormSwitch
            label="Complemento"
            value={values.complemento}
            onValueChange={(value) => onChange('complemento', value)}
            disabled={isDisabled}
          />
          <ClubFormSwitch
            label="Ativo"
            value={values.ativo}
            onValueChange={(value) => onChange('ativo', value)}
            disabled={isDisabled}
          />
        </View>
      </View>

      {regulamentoUrl ? (
        <AuthButton
          label="Ver regulamento"
          variant="outline"
          onPress={onViewRegulamento}
          disabled={isSubmitting}
          style={styles.regulamentoButton}
        />
      ) : null}

      <View style={styles.actions}>
        <AuthButton label="Cancelar" variant="outline" onPress={onCancel} disabled={isSubmitting} />
        <AuthButton
          label={isSubmitting ? 'Salvando...' : 'Confirmar'}
          onPress={onSubmit}
          disabled={isDisabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
    marginTop: 8,
  },
  generalError: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  fieldError: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: -10,
    marginBottom: 10,
  },
  switchGrid: {
    gap: 0,
  },
  switchGridWide: {
    flexDirection: 'row',
    gap: 12,
  },
  switchColumn: {
    flex: 1,
  },
  regulamentoButton: {
    marginTop: 16,
  },
  actions: {
    gap: 12,
    marginTop: 20,
  },
});
