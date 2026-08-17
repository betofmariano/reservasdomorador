import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  RELATORIO_LISTA_ESPERA_ATIVIDADE_COL_WIDTH,
  RELATORIO_LISTA_ESPERA_AVISO_COL_WIDTH,
  RELATORIO_LISTA_ESPERA_DATA_COL_WIDTH,
  RELATORIO_LISTA_ESPERA_NOME_COL_WIDTH,
} from '@/constants/web-layout';
import type { ListaEsperaRegistro } from '@/types/lista-espera';
import { ListaEsperaAvisoIndicator } from '@/components/relatorio-lista-espera/lista-espera-aviso-indicator';
import { formatarDataHoraMatchPlace } from '@/utils/programacao-atividades';

type RelatorioListaEsperaRowProps = {
  item: ListaEsperaRegistro;
  includeYear?: boolean;
  onDeletePress: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  border: '#F9B233',
  error: '#D64545',
};

export function RelatorioListaEsperaRow({
  item,
  includeYear = true,
  onDeletePress,
}: RelatorioListaEsperaRowProps) {
  const dateOptions = { includeYear };

  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.colNome]} numberOfLines={2}>
        {item.nome}
      </Text>
      <Text style={[styles.cell, styles.colAtividade]} numberOfLines={2}>
        {item.atividade}
      </Text>
      <Text style={[styles.cell, styles.colData]}>
        {formatarDataHoraMatchPlace(item.dataAtividade, dateOptions)}
      </Text>
      <Text style={[styles.cell, styles.colData]}>
        {formatarDataHoraMatchPlace(item.created_at, dateOptions)}
      </Text>
      <View style={styles.colAviso}>
        <ListaEsperaAvisoIndicator registro={item} centered />
      </View>
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
    width: RELATORIO_LISTA_ESPERA_NOME_COL_WIDTH,
    flexShrink: 0,
    fontWeight: '700',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  colActions: {
    width: 72,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    padding: 2,
  },
});
