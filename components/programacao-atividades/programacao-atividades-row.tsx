import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PROGRAMACAO_ATIVIDADES_ATIVIDADE_COL_WIDTH } from '@/constants/web-layout';
import type { AtividadeProgramada } from '@/types/atividade-programada';
import {
  formatarDataHoraMatchPlace,
  formatAtividadeProgramadaVagas,
} from '@/utils/programacao-atividades';

type ProgramacaoAtividadesRowProps = {
  item: AtividadeProgramada;
  includeYear?: boolean;
  onEditPress: () => void;
  onDeletePress: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  border: '#F9B233',
  error: '#D64545',
  blue: '#2456A8',
};

export function ProgramacaoAtividadesRow({
  item,
  includeYear = true,
  onEditPress,
  onDeletePress,
}: ProgramacaoAtividadesRowProps) {
  const dateOptions = { includeYear };

  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.colAtividade]}>{item.atividadeNome}</Text>
      <Text style={[styles.cell, styles.colData]}>
        {formatarDataHoraMatchPlace(item.dataAtividade, dateOptions)}
      </Text>
      <Text style={[styles.cell, styles.colData]}>
        {formatarDataHoraMatchPlace(item.dataLiberacao, dateOptions)}
      </Text>
      <Text style={[styles.cell, styles.colData]}>
        {formatarDataHoraMatchPlace(item.limiteReserva, dateOptions)}
      </Text>
      <Text style={[styles.cell, styles.colData]}>
        {formatarDataHoraMatchPlace(item.limiteCancelamento, dateOptions)}
      </Text>
      <Text style={[styles.cell, styles.colNumber]}>{formatAtividadeProgramadaVagas(item.vagas)}</Text>
      <Text style={[styles.cell, styles.colNumber]}>{item.reservas}</Text>
      <View style={styles.colActions}>
        <Pressable onPress={onEditPress} hitSlop={8} style={styles.actionButton}>
          <Ionicons name="create-outline" size={20} color={COLORS.blue} />
        </Pressable>
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
  colAtividade: {
    width: PROGRAMACAO_ATIVIDADES_ATIVIDADE_COL_WIDTH,
    flexShrink: 0,
    fontWeight: '700',
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
    fontWeight: '600',
  },
  colActions: {
    width: 72,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 2,
  },
});
