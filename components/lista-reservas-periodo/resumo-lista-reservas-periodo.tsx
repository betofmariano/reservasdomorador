import { StyleSheet, Text, View } from 'react-native';

import type { ListaReservasPeriodoResumo } from '@/types/lista-reservas-periodo';

type ResumoListaReservasPeriodoProps = {
  resumo: ListaReservasPeriodoResumo;
};

const COLORS = {
  navy: '#3A2154',
  muted: '#5C6475',
  background: '#F4F6FA',
  border: '#E2E6EE',
};

export function ResumoListaReservasPeriodo({ resumo }: ResumoListaReservasPeriodoProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.line}>
        Atividades no período: <Text style={styles.strong}>{resumo.totalAtividades}</Text>
      </Text>
      <Text style={styles.detail}>
        Reservas: {resumo.totalReservas} · Presentes: {resumo.totalPresentes} · Ausentes:{' '}
        {resumo.totalAusentes}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  line: {
    fontSize: 15,
    color: COLORS.navy,
  },
  strong: {
    fontWeight: '700',
  },
  detail: {
    fontSize: 13,
    color: COLORS.muted,
  },
});
