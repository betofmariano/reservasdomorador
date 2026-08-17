import { StyleSheet, Text, View } from 'react-native';

import type { ReservaPeriodoRelatorioItem } from '@/types/lista-reservas-periodo';

type ReservaPeriodoRelatorioItemRowProps = {
  item: ReservaPeriodoRelatorioItem;
};

const COLORS = {
  text: '#111111',
  separator: '#F9B233',
};

export function ReservaPeriodoRelatorioItemRow({ item }: ReservaPeriodoRelatorioItemRowProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.atividade} numberOfLines={2}>
        {item.atividadeNome}
      </Text>
      <Text style={styles.number}>{item.qtdeReservas}</Text>
      <Text style={styles.number}>{item.qtdePresente}</Text>
      <Text style={styles.number}>{item.qtdeAusente}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  atividade: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  number: {
    width: 72,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
});
