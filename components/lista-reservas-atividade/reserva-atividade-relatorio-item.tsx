import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LISTA_RESERVAS_ATIVIDADE_CHECKBOX_COLUMN_WIDTH } from '@/components/lista-reservas-atividade/lista-reservas-atividade-list-header';
import type { ReservaAtividadeRelatorioItem } from '@/types/lista-reservas-atividade';
import { getPresencaRelatorioLabel } from '@/utils/lista-reservas-atividade';
import { formatPresencaDataHoraDescricao } from '@/utils/presenca-datetime';

type ReservaAtividadeRelatorioItemRowProps = {
  item: ReservaAtividadeRelatorioItem;
};

const COLORS = {
  text: '#111111',
  separator: '#F9B233',
};

export function ReservaAtividadeRelatorioItemRow({ item }: ReservaAtividadeRelatorioItemRowProps) {
  const isPresente = item.presencaStatus === 'presente';
  const statusLabel = getPresencaRelatorioLabel(item.presencaStatus);

  return (
    <View style={styles.container}>
      <View
        style={[styles.checkbox, isPresente && styles.checkboxChecked]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isPresente }}
        accessibilityLabel={`${item.nome}, ${statusLabel}`}>
        {isPresente ? <Ionicons name="checkmark" size={20} color="#FFFFFF" /> : null}
      </View>

      <Text style={styles.nome} numberOfLines={2}>
        {item.nome}
      </Text>

      <Text style={styles.data}>{formatPresencaDataHoraDescricao(item.dataHora)}</Text>
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
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: LISTA_RESERVAS_ATIVIDADE_CHECKBOX_COLUMN_WIDTH - 28,
  },
  checkboxChecked: {
    backgroundColor: COLORS.text,
  },
  nome: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  data: {
    minWidth: 108,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
});
