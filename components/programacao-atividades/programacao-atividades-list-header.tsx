import { StyleSheet, Text, View } from 'react-native';

import {
  PROGRAMACAO_ATIVIDADES_ATIVIDADE_COL_WIDTH,
  PROGRAMACAO_ATIVIDADES_REPORT_WIDTH,
} from '@/constants/web-layout';

const COLORS = {
  navy: '#1B2B4B',
  border: '#E2E6EE',
  headerBackground: '#F4F6FA',
};

export const PROGRAMACAO_ATIVIDADES_TABLE_MIN_WIDTH = PROGRAMACAO_ATIVIDADES_REPORT_WIDTH;

export function ProgramacaoAtividadesListHeader() {
  return (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.colAtividade, styles.headerCell]}>Atividade</Text>
      <Text style={[styles.cell, styles.colData, styles.headerCell]}>Data da atividade</Text>
      <Text style={[styles.cell, styles.colData, styles.headerCell]}>Data de liberação</Text>
      <Text style={[styles.cell, styles.colData, styles.headerCell]}>Limite para reservar</Text>
      <Text style={[styles.cell, styles.colData, styles.headerCell]}>Limite para cancelar</Text>
      <Text style={[styles.cell, styles.colNumber, styles.headerCell]}>Vagas</Text>
      <Text style={[styles.cell, styles.colNumber, styles.headerCell]}>Reservas</Text>
      <Text style={[styles.cell, styles.colActions, styles.headerCell]}>Ações</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    backgroundColor: COLORS.headerBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cell: {
    fontSize: 13,
    color: COLORS.navy,
  },
  headerCell: {
    fontWeight: '700',
  },
  colAtividade: {
    width: PROGRAMACAO_ATIVIDADES_ATIVIDADE_COL_WIDTH,
    flexShrink: 0,
  },
  colData: {
    width: 130,
    flexShrink: 0,
    textAlign: 'center',
  },
  colNumber: {
    width: 64,
    flexShrink: 0,
    textAlign: 'center',
  },
  colActions: {
    width: 72,
    flexShrink: 0,
    textAlign: 'center',
  },
});
