import { StyleSheet, Text, View } from 'react-native';

import { useMapaLiberacaoCountdown } from '@/hooks/use-mapa-liberacao-countdown';
import { MATCHPOINT_COLORS } from '@/constants/theme';

type MapaLiberacaoCountdownProps = {
  nextLiberacao: number | null;
  enabled?: boolean;
  onLiberacaoReached?: () => void;
};

const COLORS = {
  navy: MATCHPOINT_COLORS.navy,
  blue: MATCHPOINT_COLORS.blue,
  background: '#EEF3FB',
  border: '#D5DAE3',
};

export function MapaLiberacaoCountdown({
  nextLiberacao,
  enabled = true,
  onLiberacaoReached,
}: MapaLiberacaoCountdownProps) {
  const { visible, formattedTime } = useMapaLiberacaoCountdown({
    nextLiberacao,
    enabled,
    onLiberacaoReached,
  });

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Liberação em{'\n'}
        <Text style={styles.time}>{formattedTime}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.navy,
    textAlign: 'center',
  },
  time: {
    fontWeight: '800',
    fontSize: 18,
    color: COLORS.blue,
  },
});
