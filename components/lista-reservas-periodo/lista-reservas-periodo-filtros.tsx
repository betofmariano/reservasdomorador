import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RelatorioPeriodoFields } from '@/components/relatorio-periodo-fields';

type ListaReservasPeriodoFiltrosProps = {
  startDate: Date;
  endDate: Date;
  onPressStartDate: () => void;
  onPressEndDate: () => void;
  validationError: string | null;
  isConsultando: boolean;
  onConsultar: () => void;
  onGerarPdf: () => void;
  pdfDisabled?: boolean;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  error: '#D64545',
};

export function ListaReservasPeriodoFiltros({
  startDate,
  endDate,
  onPressStartDate,
  onPressEndDate,
  validationError,
  isConsultando,
  onConsultar,
  onGerarPdf,
  pdfDisabled = false,
}: ListaReservasPeriodoFiltrosProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Período</Text>

      <RelatorioPeriodoFields
        startDate={startDate}
        endDate={endDate}
        onPressStartDate={onPressStartDate}
        onPressEndDate={onPressEndDate}
      />

      {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}

      <Pressable
        style={[styles.primaryButton, isConsultando && styles.primaryButtonDisabled]}
        onPress={onConsultar}
        disabled={isConsultando}>
        <Text style={styles.primaryButtonText}>
          {isConsultando ? 'Consultando...' : 'Consultar'}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.secondaryButton, pdfDisabled && styles.primaryButtonDisabled]}
        onPress={onGerarPdf}
        disabled={pdfDisabled}>
        <Ionicons name="document-text-outline" size={18} color={COLORS.blue} />
        <Text style={styles.secondaryButtonText}>PDF</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
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
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.blue,
    borderRadius: 10,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: COLORS.blue,
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
});
