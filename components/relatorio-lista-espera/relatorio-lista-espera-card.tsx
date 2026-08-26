import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ListaEsperaRegistro } from '@/types/lista-espera';
import { ListaEsperaAvisoIndicator } from '@/components/relatorio-lista-espera/lista-espera-aviso-indicator';
import { formatarDataHoraMatchPlace } from '@/utils/programacao-atividades';

type RelatorioListaEsperaCardProps = {
  item: ListaEsperaRegistro;
  onDeletePress: () => void;
};

const COLORS = {
  navy: '#3A2154',
  border: '#E2E6EE',
  muted: '#5C6475',
  error: '#D64545',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function RelatorioListaEsperaCard({ item, onDeletePress }: RelatorioListaEsperaCardProps) {
  const showAviso = item.avisado || item.avisar;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.nome}</Text>
        <Pressable onPress={onDeletePress} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </Pressable>
      </View>

      <InfoRow label="Atividade:" value={item.atividade} />
      <InfoRow
        label="Data Atividade:"
        value={formatarDataHoraMatchPlace(item.dataAtividade, { includeYear: true })}
      />
      <InfoRow
        label="Data Criação:"
        value={formatarDataHoraMatchPlace(item.created_at, { includeYear: true })}
      />
      {showAviso ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Aviso:</Text>
          <ListaEsperaAvisoIndicator registro={item} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  infoRow: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.navy,
  },
});
