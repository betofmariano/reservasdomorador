import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
  headerBg: '#E9EDF5',
  headerText: '#5C6475',
  separator: '#F9B233',
};

export function ListaReservasPeriodoListHeader() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.atividadeLabel}>Atividade</Text>
        <Text style={styles.numberLabel}>Reservas</Text>
        <Text style={styles.numberLabel}>Presentes</Text>
        <Text style={styles.numberLabel}>Ausentes</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.headerBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  atividadeLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.headerText,
  },
  numberLabel: {
    width: 72,
    textAlign: 'right',
    fontSize: 15,
    color: COLORS.headerText,
  },
});
