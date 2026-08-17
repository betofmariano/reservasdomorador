import { StyleSheet, Text, View } from 'react-native';

import { MapaFrequenciaCelula } from '@/components/mapa-frequencia/mapa-frequencia-celula';
import type { FrequenciaStatus } from '@/types/mapa-frequencia';

const COLORS = {
  navy: '#1B2B4B',
};

function LegendaItem({ status, label }: { status: FrequenciaStatus; label: string }) {
  return (
    <View style={styles.item}>
      <View style={styles.sampleCell}>
        <MapaFrequenciaCelula status={status} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function MapaFrequenciaLegenda() {
  return (
    <View style={styles.container}>
      <LegendaItem status={1} label="Reservou e compareceu" />
      <LegendaItem status={3} label="Reservou e não compareceu" />
      <LegendaItem status={null} label="Reserva Não Realizada" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sampleCell: {
    width: 52,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
});
