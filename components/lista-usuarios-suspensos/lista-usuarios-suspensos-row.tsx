import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  LISTA_USUARIOS_SUSPENSOS_ACTIONS_COL_WIDTH,
  LISTA_USUARIOS_SUSPENSOS_ATIVIDADE_COL_WIDTH,
  LISTA_USUARIOS_SUSPENSOS_DATA_COL_WIDTH,
  LISTA_USUARIOS_SUSPENSOS_NOME_COL_WIDTH,
  LISTA_USUARIOS_SUSPENSOS_STATUS_COL_WIDTH,
  LISTA_USUARIOS_SUSPENSOS_TELEFONE_COL_WIDTH,
} from '@/constants/web-layout';
import type { UsersBloqueadoRegistro } from '@/types/users-bloqueados';
import { formatSuspensaoStatusLabel } from '@/utils/lista-usuarios-suspensos';
import { formatarDataHoraMatchPlace } from '@/utils/programacao-atividades';

type ListaUsuariosSuspensosRowProps = {
  item: UsersBloqueadoRegistro;
  includeYear?: boolean;
  onDeletePress: () => void;
};

const COLORS = {
  navy: '#3A2154',
  border: '#F9B233',
  active: '#1F8A4C',
  ended: '#5C6475',
  error: '#D64545',
};

export function ListaUsuariosSuspensosRow({
  item,
  includeYear = true,
  onDeletePress,
}: ListaUsuariosSuspensosRowProps) {
  const dateOptions = { includeYear };

  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.colNome]} numberOfLines={2}>
        {item.nome}
      </Text>
      <Text style={[styles.cell, styles.colTelefone]} numberOfLines={2}>
        {item.telefone || '—'}
      </Text>
      <Text style={[styles.cell, styles.colAtividade]} numberOfLines={2}>
        {item.atividade}
      </Text>
      <Text style={[styles.cell, styles.colData]}>
        {formatarDataHoraMatchPlace(item.dataInicio, dateOptions)}
      </Text>
      <Text style={[styles.cell, styles.colData]}>
        {formatarDataHoraMatchPlace(item.dataFinal, dateOptions)}
      </Text>
      <Text
        style={[
          styles.cell,
          styles.colStatus,
          item.encerrado ? styles.statusEnded : styles.statusActive,
        ]}>
        {formatSuspensaoStatusLabel(item.encerrado)}
      </Text>
      <View style={styles.colActions}>
        <Pressable onPress={onDeletePress} hitSlop={8} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  cell: {
    fontSize: 13,
    color: COLORS.navy,
  },
  colNome: {
    width: LISTA_USUARIOS_SUSPENSOS_NOME_COL_WIDTH,
    flexShrink: 0,
    fontWeight: '700',
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
    fontWeight: '700',
  },
  statusActive: {
    color: COLORS.active,
  },
  statusEnded: {
    color: COLORS.ended,
  },
  colActions: {
    width: LISTA_USUARIOS_SUSPENSOS_ACTIONS_COL_WIDTH,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    padding: 2,
  },
});
