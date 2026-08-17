import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
  headerBg: '#E9EDF5',
  headerText: '#5C6475',
  separator: '#F9B233',
};

const CHECKBOX_COLUMN_WIDTH = 44;

export function ListaReservasAtividadeListHeader() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.checkboxSpacer} />
        <Text style={styles.nomeLabel}>Nome</Text>
        <Text style={styles.dataLabel}>Data</Text>
      </View>
    </View>
  );
}

export const LISTA_RESERVAS_ATIVIDADE_CHECKBOX_COLUMN_WIDTH = CHECKBOX_COLUMN_WIDTH;

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
  checkboxSpacer: {
    width: CHECKBOX_COLUMN_WIDTH,
  },
  nomeLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.headerText,
  },
  dataLabel: {
    minWidth: 108,
    textAlign: 'right',
    fontSize: 15,
    color: COLORS.headerText,
  },
});
