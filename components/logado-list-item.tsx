import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LogadoBooleanCell } from '@/components/logado-boolean-cell';
import { LOGADOS_TABLE_MIN_WIDTH } from '@/constants/web-layout';
import type { LogadoRecord } from '@/types/logado';
import { formatLogadoCreatedAt, formatLogadoTelefone, getLogadoClubeNome } from '@/utils/logado-lista-format';

type LogadoListItemProps = {
  logado: LogadoRecord;
  layout: 'card' | 'table';
  onPress: () => void;
  onDeletePress: () => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  muted: '#5C6475',
  border: '#E2E6EE',
};

export function LogadoListItem({
  logado,
  layout,
  onPress,
  onDeletePress,
}: LogadoListItemProps) {
  const createdLabel = formatLogadoCreatedAt(logado.created_at);
  const clubeLabel = getLogadoClubeNome(logado);

  if (layout === 'table') {
    return (
      <Pressable style={styles.tableRow} onPress={onPress}>
        <Pressable style={styles.deleteButton} onPress={onDeletePress} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={COLORS.blue} />
        </Pressable>

        <Text style={[styles.tableCell, styles.colData]} numberOfLines={1}>
          {createdLabel}
        </Text>
        <Text style={[styles.tableCell, styles.colIdXano]} numberOfLines={1}>
          {logado.users_id}
        </Text>
        <Text style={[styles.tableCell, styles.colNome]} numberOfLines={1}>
          {logado.nome || '—'}
        </Text>

        <LogadoBooleanCell value={logado.aprovado} />
        <LogadoBooleanCell value={logado.gestor} />
        <LogadoBooleanCell value={logado.administrador} />
        <LogadoBooleanCell value={logado.bloqueado} />
        <LogadoBooleanCell value={logado.logadoXano} />
        <LogadoBooleanCell value={logado.logadoBubble === true} />

        <Text style={[styles.tableCell, styles.colWidth]} numberOfLines={1}>
          {logado.larguraPagina}
        </Text>
        <Text style={[styles.tableCell, styles.colClube]} numberOfLines={1}>
          {clubeLabel}
        </Text>
        <Text style={[styles.tableCell, styles.colTelefone]} numberOfLines={1}>
          {formatLogadoTelefone(logado)}
        </Text>
        <Text style={[styles.tableCell, styles.colPlataforma]} numberOfLines={1}>
          {logado.plataforma || '—'}
        </Text>
        <Text style={[styles.tableCell, styles.colDispositivo]} numberOfLines={1}>
          {logado.dispositivo || '—'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{createdLabel}</Text>
        <Pressable style={styles.deleteButton} onPress={onDeletePress} hitSlop={8}>
          <Ionicons name="trash-outline" size={22} color={COLORS.blue} />
        </Pressable>
      </View>

      <Text style={styles.cardNome} numberOfLines={1}>
        {logado.nome || '—'}
      </Text>
      <Text style={styles.cardMeta} numberOfLines={1}>
        ID: {logado.users_id}
      </Text>
      <Text style={styles.cardMeta} numberOfLines={1}>
        {clubeLabel}
      </Text>
      <Text style={styles.cardMeta} numberOfLines={1}>
        {formatLogadoTelefone(logado)}
      </Text>
      <Text style={styles.cardMeta} numberOfLines={1}>
        Plataforma: {logado.plataforma || '—'}
      </Text>
      <Text style={styles.cardMeta} numberOfLines={2}>
        Dispositivo: {logado.dispositivo || '—'}
      </Text>
      <Text style={styles.cardFlags} numberOfLines={2}>
        {[
          logado.aprovado ? 'Aprov' : null,
          logado.gestor ? 'Gestor' : null,
          logado.administrador ? 'Adm' : null,
          logado.bloqueado ? 'Bloq' : null,
        ]
          .filter(Boolean)
          .join(' · ') || '—'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minWidth: LOGADOS_TABLE_MIN_WIDTH,
  },
  tableCell: {
    fontSize: 13,
    color: COLORS.navy,
  },
  colData: {
    width: 110,
    flexShrink: 0,
  },
  colIdXano: {
    width: 72,
    flexShrink: 0,
  },
  colNome: {
    width: 300,
    flexShrink: 0,
  },
  colWidth: {
    width: 56,
    flexShrink: 0,
    textAlign: 'center',
  },
  colClube: {
    width: 150,
    flexShrink: 0,
  },
  colTelefone: {
    width: 130,
    flexShrink: 0,
  },
  colPlataforma: {
    width: 100,
    flexShrink: 0,
  },
  colDispositivo: {
    width: 300,
    flexShrink: 0,
  },
  deleteButton: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  card: {
    width: '100%',
    maxWidth: 960,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blue,
    flex: 1,
    marginRight: 8,
  },
  cardNome: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 3,
  },
  cardFlags: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
    marginTop: 4,
  },
});
