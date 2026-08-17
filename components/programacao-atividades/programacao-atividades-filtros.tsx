import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatFullDateLabel } from '@/utils/jogos-time';

type ProgramacaoAtividadesFiltrosProps = {
  value: string;
  onChange: (value: string) => void;
  startDate: Date;
  onPressStartDate: () => void;
  validationError: string | null;
  isConsultando: boolean;
  onConsultar: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  border: '#D5DAE3',
  text: '#1B2B4B',
  error: '#D64545',
  muted: '#5C6475',
  placeholder: '#5C6475',
};

export function ProgramacaoAtividadesFiltros({
  value,
  onChange,
  startDate,
  onPressStartDate,
  validationError,
  isConsultando,
  onConsultar,
}: ProgramacaoAtividadesFiltrosProps) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.dateButton} onPress={onPressStartDate}>
        <Text style={styles.dateHint}>A partir de</Text>
        <Text style={styles.dateValue}>{formatFullDateLabel(startDate)}</Text>
      </Pressable>

      {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}

      <Pressable
        style={[styles.primaryButton, isConsultando && styles.primaryButtonDisabled]}
        onPress={onConsultar}
        disabled={isConsultando}>
        <Text style={styles.primaryButtonText}>
          {isConsultando ? 'Consultando...' : 'Consultar'}
        </Text>
      </Pressable>

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Filtrar..."
        placeholderTextColor={COLORS.placeholder}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  dateHint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
  primaryButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
  },
});
