import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatFullDateLabel, formatGameTime } from '@/utils/jogos-time';
import type { ListaEsperaDisplay } from '@/types/lista-espera';

type ListaEsperaCardProps = {
  item: ListaEsperaDisplay;
  onDeletePress?: () => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  success: '#1F8A4C',
  pending: '#E8B830',
  error: '#D64545',
};

export function ListaEsperaCard({ item, onDeletePress }: ListaEsperaCardProps) {
  const { registro, localNome } = item;
  const dataLabel = registro.dataAtividade
    ? formatFullDateLabel(new Date(registro.dataAtividade))
    : '--/--/----';
  const horaLabel = formatGameTime(registro.dataAtividade);
  const statusLabel = registro.avisado ? 'Avisado' : 'Aguardando';

  return (
    <View style={styles.card}>
      <Text style={styles.clubName}>{localNome}</Text>
      {registro.atividade ? <Text style={styles.activityName}>{registro.atividade}</Text> : null}
      <Text style={styles.detailText}>Data: {dataLabel}</Text>
      <Text style={styles.detailText}>Horário: {horaLabel}</Text>
      <Text style={[styles.statusText, registro.avisado ? styles.statusAvisado : styles.statusPending]}>
        {statusLabel}
      </Text>

      {onDeletePress ? (
        <Pressable
          style={styles.trashButton}
          onPress={onDeletePress}
          accessibilityLabel="Remover da lista de espera">
          <Ionicons name="trash-outline" size={28} color={COLORS.error} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F4F6FA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E6EE',
    marginBottom: 12,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.blue,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.navy,
    marginTop: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  statusAvisado: {
    color: COLORS.success,
  },
  statusPending: {
    color: COLORS.pending,
  },
  trashButton: {
    alignSelf: 'center',
    marginTop: 12,
    padding: 6,
  },
});
