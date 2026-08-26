import { StyleSheet, Text, View } from 'react-native';

import type { FrequenciaStatus } from '@/types/mapa-frequencia';
import { getFrequenciaStatusLabel } from '@/utils/mapa-frequencia';

const COLORS = {
  navy: '#3A2154',
  presente: '#22A06B',
  reservaNaoRealizada: '#FFFFFF',
  ausente: '#111111',
  border: '#C5C5C5',
};

type MapaFrequenciaStatusCelulaProps = {
  variant?: 'status';
  status: FrequenciaStatus;
};

type MapaFrequenciaDataCelulaProps = {
  variant: 'data';
  dataFormatada: string;
  horaFormatada: string;
};

export type MapaFrequenciaCelulaProps = MapaFrequenciaStatusCelulaProps | MapaFrequenciaDataCelulaProps;

function MapaFrequenciaStatusCelula({ status }: MapaFrequenciaStatusCelulaProps) {
  const label = getFrequenciaStatusLabel(status);

  return (
    <View
      style={[
        styles.box,
        status === 1 && styles.presente,
        status === 3 && styles.ausente,
        status == null && styles.reservaNaoRealizada,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}>
      <Text style={styles.srOnly}>{label}</Text>
    </View>
  );
}

function MapaFrequenciaDataCelula({ dataFormatada, horaFormatada }: MapaFrequenciaDataCelulaProps) {
  return (
    <View
      style={[styles.box, styles.dataBox]}
      accessibilityRole="text"
      accessibilityLabel={`${dataFormatada} ${horaFormatada}`}>
      <Text style={styles.dataText}>{dataFormatada}</Text>
      <Text style={styles.horaText}>{horaFormatada}</Text>
    </View>
  );
}

export function MapaFrequenciaCelula(props: MapaFrequenciaCelulaProps) {
  if (props.variant === 'data') {
    return (
      <MapaFrequenciaDataCelula
        variant="data"
        dataFormatada={props.dataFormatada}
        horaFormatada={props.horaFormatada}
      />
    );
  }

  return <MapaFrequenciaStatusCelula status={props.status} />;
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    maxWidth: '100%',
    minHeight: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataBox: {
    backgroundColor: COLORS.reservaNaoRealizada,
    minHeight: 36,
    height: undefined,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  dataText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  horaText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.navy,
    textAlign: 'center',
  },
  presente: {
    backgroundColor: COLORS.presente,
    borderColor: COLORS.presente,
    height: 28,
  },
  reservaNaoRealizada: {
    backgroundColor: COLORS.reservaNaoRealizada,
    height: 28,
  },
  ausente: {
    backgroundColor: COLORS.ausente,
    borderColor: COLORS.ausente,
    height: 28,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
