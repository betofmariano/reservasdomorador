import { StyleSheet, Text, View } from 'react-native';

import {
  LISTA_USUARIOS_SUSPENSOS_ACTIONS_COL_WIDTH,
  LISTA_USUARIOS_SUSPENSOS_ATIVIDADE_COL_WIDTH,
  LISTA_USUARIOS_SUSPENSOS_DATA_COL_WIDTH,
  LISTA_USUARIOS_SUSPENSOS_NOME_COL_WIDTH,
  LISTA_USUARIOS_SUSPENSOS_REPORT_WIDTH,
  LISTA_USUARIOS_SUSPENSOS_STATUS_COL_WIDTH,
  LISTA_USUARIOS_SUSPENSOS_TELEFONE_COL_WIDTH,
} from '@/constants/web-layout';

const COLORS = {
  navy: '#3A2154',
  border: '#E2E6EE',
  headerBackground: '#F4F6FA',
};

export const LISTA_USUARIOS_SUSPENSOS_TABLE_MIN_WIDTH = LISTA_USUARIOS_SUSPENSOS_REPORT_WIDTH;

export function ListaUsuariosSuspensosListHeader() {
  return (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.colNome, styles.headerCell]}>Nome</Text>
      <Text style={[styles.cell, styles.colTelefone, styles.headerCell]}>Telefone</Text>
      <Text style={[styles.cell, styles.colAtividade, styles.headerCell]}>Atividade</Text>
      <Text style={[styles.cell, styles.colData, styles.headerCell]}>Início</Text>
      <Text style={[styles.cell, styles.colData, styles.headerCell]}>Fim</Text>
      <Text style={[styles.cell, styles.colStatus, styles.headerCell]}>Situação</Text>
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
    width: LISTA_USUARIOS_SUSPENSOS_NOME_COL_WIDTH,
    flexShrink: 0,
  },
  colTelefone: {
    width: LISTA_USUARIOS_SUSPENSOS_TELEFONE_COL_WIDTH,
    flexShrink: 0,
  },
  colAtividade: {
    width: LISTA_USUARIOS_SUSPENSOS_ATIVIDADE_COL_WIDTH,
    flexShrink: 0,
  },
  colData: {
    width: LISTA_USUARIOS_SUSPENSOS_DATA_COL_WIDTH,
    flexShrink: 0,
    textAlign: 'center',
  },
  colStatus: {
    width: LISTA_USUARIOS_SUSPENSOS_STATUS_COL_WIDTH,
    flexShrink: 0,
    textAlign: 'center',
  },
  colActions: {
    width: LISTA_USUARIOS_SUSPENSOS_ACTIONS_COL_WIDTH,
    flexShrink: 0,
    textAlign: 'center',
  },
});
