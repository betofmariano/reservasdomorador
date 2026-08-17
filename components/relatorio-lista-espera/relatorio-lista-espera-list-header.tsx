import { StyleSheet, Text, View } from 'react-native';

import {
  RELATORIO_LISTA_ESPERA_ATIVIDADE_COL_WIDTH,
  RELATORIO_LISTA_ESPERA_AVISO_COL_WIDTH,
  RELATORIO_LISTA_ESPERA_DATA_COL_WIDTH,
  RELATORIO_LISTA_ESPERA_NOME_COL_WIDTH,
  RELATORIO_LISTA_ESPERA_REPORT_WIDTH,
} from '@/constants/web-layout';

const COLORS = {
  navy: '#1B2B4B',
  border: '#E2E6EE',
  headerBackground: '#F4F6FA',
};

export const RELATORIO_LISTA_ESPERA_TABLE_MIN_WIDTH = RELATORIO_LISTA_ESPERA_REPORT_WIDTH;

export function RelatorioListaEsperaListHeader() {
  return (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.colNome, styles.headerCell]}>Nome</Text>
      <Text style={[styles.cell, styles.colAtividade, styles.headerCell]}>Atividade</Text>
      <Text style={[styles.cell, styles.colData, styles.headerCell]}>Data Atividade</Text>
      <Text style={[styles.cell, styles.colData, styles.headerCell]}>Data Criação</Text>
      <Text style={[styles.cell, styles.colAviso, styles.headerCell]}>Aviso</Text>
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
  colNome: {
    width: RELATORIO_LISTA_ESPERA_NOME_COL_WIDTH,
    flexShrink: 0,
  },
  colAtividade: {
    width: RELATORIO_LISTA_ESPERA_ATIVIDADE_COL_WIDTH,
    flexShrink: 0,
  },
  colData: {
    width: RELATORIO_LISTA_ESPERA_DATA_COL_WIDTH,
    flexShrink: 0,
    textAlign: 'center',
  },
  colAviso: {
    width: RELATORIO_LISTA_ESPERA_AVISO_COL_WIDTH,
    flexShrink: 0,
    textAlign: 'center',
  },
  colActions: {
    width: 72,
    flexShrink: 0,
    textAlign: 'center',
  },
});
