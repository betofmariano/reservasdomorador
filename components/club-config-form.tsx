import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { AuthTextField } from '@/components/auth-text-field';
import { ClubFormSwitch } from '@/components/club-form-switch';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import type { ClubFormFieldErrors, ClubFormValues } from '@/types/club';

type ClubConfigFormProps = {
  values: ClubFormValues;
  errors: ClubFormFieldErrors;
  isSubmitting: boolean;
  disabled?: boolean;
  onChange: <K extends keyof ClubFormValues>(field: K, value: ClubFormValues[K]) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  error: '#D64545',
};

export function ClubConfigForm({
  values,
  errors,
  isSubmitting,
  disabled = false,
  onChange,
  onCancel,
  onSubmit,
}: ClubConfigFormProps) {
  const { width: screenWidth } = useWindowDimensions();
  const useTwoColumns = screenWidth >= WEB_MAX_CONTENT_WIDTH;
  const isDisabled = disabled || isSubmitting;

  return (
    <View style={styles.form}>
      <Text style={styles.pageTitle}>Configuração do Clube</Text>

      {errors.general ? <Text style={styles.generalError}>{errors.general}</Text> : null}

      <Text style={styles.sectionTitle}>Dados principais</Text>
      <AuthTextField
        label="Nome do clube"
        value={values.nome}
        onChangeText={(text) => onChange('nome', text)}
        autoCapitalize="words"
        editable={!isDisabled}
      />
      {errors.nome ? <Text style={styles.fieldError}>{errors.nome}</Text> : null}

      <AuthTextField
        label="Endereço"
        value={values.endereco}
        onChangeText={(text) => onChange('endereco', text)}
        autoCapitalize="sentences"
        editable={!isDisabled}
      />

      <View style={[styles.row, useTwoColumns && styles.rowWide]}>
        <View style={styles.rowItem}>
          <AuthTextField
            label="Cidade"
            value={values.cidade}
            onChangeText={(text) => onChange('cidade', text)}
            autoCapitalize="words"
            editable={!isDisabled}
          />
          {errors.cidade ? <Text style={styles.fieldError}>{errors.cidade}</Text> : null}
        </View>

        <View style={[styles.rowItem, useTwoColumns && styles.rowItemCompact]}>
          <AuthTextField
            label="Estado"
            value={values.estado}
            onChangeText={(text) => onChange('estado', text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={2}
            editable={!isDisabled}
          />
          {errors.estado ? <Text style={styles.fieldError}>{errors.estado}</Text> : null}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Parâmetros numéricos</Text>

      <View style={[styles.row, useTwoColumns && styles.rowWide]}>
        <View style={styles.rowItem}>
          <AuthTextField
            label="Quantidade de quadras"
            value={values.quadras}
            onChangeText={(text) => onChange('quadras', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isDisabled}
          />
          {errors.quadras ? <Text style={styles.fieldError}>{errors.quadras}</Text> : null}
        </View>

        <View style={styles.rowItem}>
          <AuthTextField
            label="Duração dos jogos (minutos)"
            value={values.minutosDuracao}
            onChangeText={(text) => onChange('minutosDuracao', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isDisabled}
          />
          {errors.minutosDuracao ? (
            <Text style={styles.fieldError}>{errors.minutosDuracao}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.row, useTwoColumns && styles.rowWide]}>
        <View style={styles.rowItem}>
          <AuthTextField
            label="Liberação para reserva (horas antes)"
            value={values.horasLiberacao}
            onChangeText={(text) => onChange('horasLiberacao', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isDisabled}
          />
          {errors.horasLiberacao ? (
            <Text style={styles.fieldError}>{errors.horasLiberacao}</Text>
          ) : null}
        </View>

        <View style={styles.rowItem}>
          <AuthTextField
            label="Intervalo entre reservas (horas)"
            value={values.intervaloJogos}
            onChangeText={(text) => onChange('intervaloJogos', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isDisabled}
          />
          {errors.intervaloJogos ? (
            <Text style={styles.fieldError}>{errors.intervaloJogos}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.row, useTwoColumns && styles.rowWide]}>
        <View style={styles.rowItem}>
          <AuthTextField
            label="Cancelamento automático sem parceiro (minutos)"
            value={values.minutosCancelamento}
            onChangeText={(text) => onChange('minutosCancelamento', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isDisabled}
          />
          {errors.minutosCancelamento ? (
            <Text style={styles.fieldError}>{errors.minutosCancelamento}</Text>
          ) : null}
        </View>

        <View style={styles.rowItem}>
          <AuthTextField
            label="Limite para cancelar reserva (minutos antes)"
            value={values.limiteCancelamento}
            onChangeText={(text) => onChange('limiteCancelamento', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isDisabled}
          />
          {errors.limiteCancelamento ? (
            <Text style={styles.fieldError}>{errors.limiteCancelamento}</Text>
          ) : null}
        </View>
      </View>

      <AuthTextField
        label="Limite para trocar parceiros (minutos antes)"
        value={values.limiteTrocaParceiros}
        onChangeText={(text) => onChange('limiteTrocaParceiros', text.replace(/[^\d]/g, ''))}
        keyboardType="number-pad"
        editable={!isDisabled}
      />
      {errors.limiteTrocaParceiros ? (
        <Text style={styles.fieldError}>{errors.limiteTrocaParceiros}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>Parâmetros booleanos</Text>

      <View style={[styles.switchGrid, useTwoColumns && styles.switchGridWide]}>
        <View style={styles.switchColumn}>
          <ClubFormSwitch
            label="Permite jogos de simples"
            value={values.jogoSimples}
            onValueChange={(value) => onChange('jogoSimples', value)}
            disabled={isDisabled}
          />
          <ClubFormSwitch
            label="Permite jogos de duplas"
            value={values.jogoDuplas}
            onValueChange={(value) => onChange('jogoDuplas', value)}
            disabled={isDisabled}
          />
          <ClubFormSwitch
            label="Apenas uma reserva no intervalo"
            value={values.reservaUnica}
            onValueChange={(value) => onChange('reservaUnica', value)}
            disabled={isDisabled}
          />
          <ClubFormSwitch
            label="Cancelamento automático sem adversários"
            value={values.cancelamentoAutomatico}
            onValueChange={(value) => onChange('cancelamentoAutomatico', value)}
            disabled={isDisabled}
          />
          <ClubFormSwitch
            label="Responsável/adversário sem repetir"
            value={values.respAdvUnicos}
            onValueChange={(value) => onChange('respAdvUnicos', value)}
            disabled={isDisabled}
          />
        </View>

        <View style={styles.switchColumn}>
          <ClubFormSwitch
            label="Exige matrícula para aprovação"
            value={values.exigeMatricula}
            onValueChange={(value) => onChange('exigeMatricula', value)}
            disabled={isDisabled}
          />
          <ClubFormSwitch
            label="Padrão diário"
            value={values.padraoDiario}
            onValueChange={(value) => onChange('padraoDiario', value)}
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
  row: {
    width: '100%',
    gap: 0,
  },
  rowWide: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  rowItemCompact: {
    maxWidth: 120,
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
  actions: {
    gap: 12,
    marginTop: 20,
  },
});
