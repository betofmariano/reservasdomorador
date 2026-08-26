import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AtividadeProgramada } from '@/types/atividade-programada';
import {
  formatarDataHoraMatchPlace,
  formatAtividadeProgramadaVagas,
} from '@/utils/programacao-atividades';

type ProgramacaoAtividadesCardProps = {
  item: AtividadeProgramada;
  onEditPress: () => void;
  onDeletePress: () => void;
};

const COLORS = {
  navy: '#3A2154',
  border: '#F9B233',
  muted: '#5C6475',
  error: '#D64545',
  blue: '#0F7A6C',
};

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function ProgramacaoAtividadesCard({
  item,
  onEditPress,
  onDeletePress,
}: ProgramacaoAtividadesCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.atividadeNome}</Text>

      <InfoLine
        label="Data da atividade:"
        value={formatarDataHoraMatchPlace(item.dataAtividade, { includeYear: true })}
      />
      <InfoLine
        label="Liberação:"
        value={formatarDataHoraMatchPlace(item.dataLiberacao, { includeYear: true })}
      />
      <InfoLine
        label="Limite para reservar:"
        value={formatarDataHoraMatchPlace(item.limiteReserva, { includeYear: true })}
      />
      <InfoLine
        label="Limite para cancelar:"
        value={formatarDataHoraMatchPlace(item.limiteCancelamento, { includeYear: true })}
      />

      <View style={styles.inlineStats}>
        <Text style={styles.stat}>Vagas: {formatAtividadeProgramadaVagas(item.vagas)}</Text>
        <Text style={styles.stat}>Reservas: {item.reservas}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={onEditPress}>
          <Ionicons name="create-outline" size={18} color={COLORS.blue} />
          <Text style={styles.actionText}>Editar</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onDeletePress}>
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          <Text style={[styles.actionText, styles.deleteText]}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  infoLine: {
    gap: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  value: {
    fontSize: 14,
    color: COLORS.navy,
  },
  inlineStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  stat: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
  },
  deleteText: {
    color: COLORS.error,
  },
});
