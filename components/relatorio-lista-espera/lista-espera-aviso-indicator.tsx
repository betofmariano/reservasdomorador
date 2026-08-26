import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ListaEsperaRegistro } from '@/types/lista-espera';
import { formatListaEsperaAvisoLabel } from '@/utils/relatorio-lista-espera';

type ListaEsperaAvisoIndicatorProps = {
  registro: ListaEsperaRegistro;
  centered?: boolean;
};

const COLORS = {
  navy: '#3A2154',
  success: '#22A447',
};

const TICK_SIZE = 28;

export function ListaEsperaAvisoIndicator({
  registro,
  centered = false,
}: ListaEsperaAvisoIndicatorProps) {
  if (registro.avisado) {
    return (
      <View style={[styles.container, centered && styles.centered]}>
        <Ionicons name="checkmark" size={TICK_SIZE} color={COLORS.success} />
      </View>
    );
  }

  const label = formatListaEsperaAvisoLabel(registro);

  if (!label) {
    return null;
  }

  return (
    <Text style={[styles.label, centered && styles.centeredText]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 13,
    color: COLORS.navy,
  },
  centeredText: {
    textAlign: 'center',
    width: '100%',
  },
});
