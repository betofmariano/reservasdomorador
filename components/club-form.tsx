import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { AuthTextField } from '@/components/auth-text-field';
import { ClubFormSwitch } from '@/components/club-form-switch';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import type { ClubFormFieldErrors, ClubFormValues } from '@/types/club';

type ClubFormProps = {
  values: ClubFormValues;
  errors: ClubFormFieldErrors;
  isSubmitting: boolean;
  onChange: <K extends keyof ClubFormValues>(field: K, value: ClubFormValues[K]) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const COLORS = {
  navy: '#3A2154',
  error: '#D64545',
  muted: '#5C6475',
};

export function ClubForm({
  values,
  errors,
  isSubmitting,
  onChange,
  onCancel,
  onSubmit,
}: ClubFormProps) {
  const { width: screenWidth } = useWindowDimensions();
  const useTwoColumns = screenWidth >= WEB_MAX_CONTENT_WIDTH;

  return (
    <View style={styles.form}>
      <Text style={styles.pageTitle}>Cadastro do Clube</Text>

      {errors.general ? <Text style={styles.generalError}>{errors.general}</Text> : null}

      <Text style={styles.sectionTitle}>Dados principais</Text>
      <AuthTextField
        label="Nome do clube"
        value={values.nome}
        onChangeText={(text) => onChange('nome', text)}
        autoCapitalize="words"
        editable={!isSubmitting}
      />
      {errors.nome ? <Text style={styles.fieldError}>{errors.nome}</Text> : null}

      <AuthTextField
        label="Endereço"
        value={values.endereco}
        onChangeText={(text) => onChange('endereco', text)}
        autoCapitalize="sentences"
        editable={!isSubmitting}
      />

      <View style={[styles.row, useTwoColumns && styles.rowWide]}>
        <View style={styles.rowItem}>
          <AuthTextField
            label="Cidade"
            value={values.cidade}
            onChangeText={(text) => onChange('cidade', text)}
            autoCapitalize="words"
            editable={!isSubmitting}
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
            editable={!isSubmitting}
          />
          {errors.estado ? <Text style={styles.fieldError}>{errors.estado}</Text> : null}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Configurações numéricas</Text>

      <View style={[styles.row, useTwoColumns && styles.rowWide]}>
        <View style={styles.rowItem}>
          <AuthTextField
            label="Quantidade de quadras"
            value={values.quadras}
            onChangeText={(text) => onChange('quadras', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isSubmitting}
          />
          {errors.quadras ? <Text style={styles.fieldError}>{errors.quadras}</Text> : null}
        </View>

        <View style={styles.rowItem}>
          <AuthTextField
            label="Horas para liberação da reserva"
            value={values.horasLiberacao}
            onChangeText={(text) => onChange('horasLiberacao', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isSubmitting}
          />
          {errors.horasLiberacao ? (
            <Text style={styles.fieldError}>{errors.horasLiberacao}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.row, useTwoColumns && styles.rowWide]}>
        <View style={styles.rowItem}>
          <AuthTextField
            label="Intervalo entre jogos"
            value={values.intervaloJogos}
            onChangeText={(text) => onChange('intervaloJogos', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isSubmitting}
          />
          {errors.intervaloJogos ? (
            <Text style={styles.fieldError}>{errors.intervaloJogos}</Text>
          ) : null}
        </View>

        <View style={styles.rowItem}>
          <AuthTextField
            label="Cancelamento automático em minutos"
            value={values.minutosCancelamento}
            onChangeText={(text) => onChange('minutosCancelamento', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isSubmitting}
          />
          {errors.minutosCancelamento ? (
            <Text style={styles.fieldError}>{errors.minutosCancelamento}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.row, useTwoColumns && styles.rowWide]}>
        <View style={styles.rowItem}>
          <AuthTextField
            label="Limite de minutos para cancelar"
            value={values.limiteCancelamento}
            onChangeText={(text) => onChange('limiteCancelamento', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isSubmitting}
          />
          {errors.limiteCancelamento ? (
            <Text style={styles.fieldError}>{errors.limiteCancelamento}</Text>
          ) : null}
        </View>

        <View style={styles.rowItem}>
          <AuthTextField
            label="Limite para troca de parceiros"
            value={values.limiteTrocaParceiros}
            onChangeText={(text) => onChange('limiteTrocaParceiros', text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            editable={!isSubmitting}
          />
          {errors.limiteTrocaParceiros ? (
            <Text style={styles.fieldError}>{errors.limiteTrocaParceiros}</Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Configurações booleanas</Text>

      <View style={[styles.switchGrid, useTwoColumns && styles.switchGridWide]}>
        <View style={styles.switchColumn}>
          <ClubFormSwitch
            label="Permite jogos de simples"
            value={values.jogoSimples}
            onValueChange={(value) => onChange('jogoSimples', value)}
            disabled={isSubmitting}
          />
          <ClubFormSwitch
            label="Permite jogos de duplas"
            value={values.jogoDuplas}
            onValueChange={(value) => onChange('jogoDuplas', value)}
            disabled={isSubmitting}
          />
          <ClubFormSwitch
            label="Apenas uma reserva"
            value={values.reservaUnica}
            onValueChange={(value) => onChange('reservaUnica', value)}
            disabled={isSubmitting}
          />
          <ClubFormSwitch
            label="Cancelamento automático sem adversários"
            value={values.cancelamentoAutomatico}
            onValueChange={(value) => onChange('cancelamentoAutomatico', value)}
            disabled={isSubmitting}
          />
          <ClubFormSwitch
            label="Responsável/Adversário sem repetir"
            value={values.respAdvUnicos}
            onValueChange={(value) => onChange('respAdvUnicos', value)}
            disabled={isSubmitting}
          />
        </View>

        <View style={styles.switchColumn}>
          <ClubFormSwitch
            label="Padrão diário"
            value={values.padraoDiario}
            onValueChange={(value) => onChange('padraoDiario', value)}
            disabled={isSubmitting}
          />
          <ClubFormSwitch
            label="Exige matrícula"
            value={values.exigeMatricula}
            onValueChange={(value) => onChange('exigeMatricula', value)}
            disabled={isSubmitting}
          />
          <ClubFormSwitch
            label="Ativo"
            value={values.ativo}
            onValueChange={(value) => onChange('ativo', value)}
            disabled={isSubmitting}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <AuthButton label="Cancelar" variant="outline" onPress={onCancel} disabled={isSubmitting} />
        <AuthButton
          label={isSubmitting ? 'Salvando...' : 'Confirmar'}
          onPress={onSubmit}
          disabled={isSubmitting}
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
