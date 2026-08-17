import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { UsersBloqueadoRegistro } from '@/types/users-bloqueados';
import { formatSuspensaoStatusLabel } from '@/utils/lista-usuarios-suspensos';
import { formatarDataHoraMatchPlace } from '@/utils/programacao-atividades';

type ListaUsuariosSuspensosCardProps = {
  item: UsersBloqueadoRegistro;
  onDeletePress: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  border: '#E2E6EE',
  active: '#1F8A4C',
  ended: '#5C6475',
  muted: '#5C6475',
  error: '#D64545',
};

export function ListaUsuariosSuspensosCard({
  item,
  onDeletePress,
}: ListaUsuariosSuspensosCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.nome}>{item.nome}</Text>
        <Pressable onPress={onDeletePress} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </Pressable>
      </View>
      <Text style={styles.meta}>{item.telefone || '—'}</Text>
      <Text style={styles.meta}>{item.atividade}</Text>
      <Text style={styles.meta}>
        Início: {formatarDataHoraMatchPlace(item.dataInicio, { includeYear: true })}
      </Text>
      <Text style={styles.meta}>
        Fim: {formatarDataHoraMatchPlace(item.dataFinal, { includeYear: true })}
      </Text>
      <Text style={[styles.status, item.encerrado ? styles.statusEnded : styles.statusActive]}>
        {formatSuspensaoStatusLabel(item.encerrado)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nome: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  meta: {
    fontSize: 14,
    color: COLORS.muted,
  },
  status: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
  },
  statusActive: {
    color: COLORS.active,
  },
  statusEnded: {
    color: COLORS.ended,
  },
});
