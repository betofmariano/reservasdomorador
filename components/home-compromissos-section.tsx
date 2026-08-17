import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CancelarListaEsperaModal } from '@/components/cancelar-lista-espera-modal';
import { CancelarReservaModal } from '@/components/cancelar-reserva-modal';
import { ReservaSummaryList } from '@/components/reserva-summary-list';
import type { ListaEsperaSummary, ReservaSummary } from '@/types/home-summary';
import type { User } from '@/types/user';
import { formatListaEsperaPosicaoLabel } from '@/utils/lista-espera-posicao';
import { formatGameTime, formatRelativeDateLabel } from '@/utils/jogos-time';
import { canCancelReservaUsuarioList } from '@/utils/reserva-adversario';

type HomeCompromissosSectionProps = {
  reservas: ReservaSummary[];
  proximaReserva: ReservaSummary | null;
  proximaListaEspera: ListaEsperaSummary | null;
  totalReservas: number;
  totalListasEspera: number;
  isLoading: boolean;
  reservasError: string | null;
  listaEsperaError: string | null;
  canAccessListaEspera: boolean;
  showLocalColumn?: boolean;
  user: User;
  authToken: string | null;
  onRetryReservas: () => void;
  onRetryListaEspera: () => void;
  onRefresh: () => void;
  onReservaRemoved?: (reservaId: number) => void;
  onCriticalModalVisibilityChange?: (visible: boolean) => void;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  gold: '#E8B830',
  error: '#D64545',
  muted: '#5C6475',
  cardBg: '#F4F6FA',
  border: '#E2E6EE',
};

function ReservaSummaryCard({
  reserva,
  showLocal,
  canCancelReserva,
  onCancelPress,
}: {
  reserva: ReservaSummary;
  showLocal: boolean;
  canCancelReserva: boolean;
  onCancelPress: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Próxima reserva</Text>
        {canCancelReserva ? (
          <Pressable
            style={styles.trashHeaderButton}
            onPress={onCancelPress}
            accessibilityLabel="Cancelar reserva">
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.dateTimeLine}>
          {`${formatRelativeDateLabel(new Date(reserva.dataAtividade))}, ${formatGameTime(reserva.dataAtividade)}`}
        </Text>
        {showLocal ? <Text style={styles.detailLine}>{reserva.localNome}</Text> : null}
        <Text style={styles.detailLine}>
          {reserva.atividade?.trim() || 'Não informada'}
          {reserva.unidadeNome?.trim() ? ` · ${reserva.unidadeNome.trim()}` : ''}
        </Text>
      </View>
    </View>
  );
}

function ListaEsperaSummaryCard({
  registro,
  onCancelPress,
}: {
  registro: ListaEsperaSummary;
  onCancelPress: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Lista de espera</Text>
      <Text style={styles.dateTimeLine}>
        {`${formatRelativeDateLabel(new Date(registro.dataAtividade))}, ${formatGameTime(registro.dataAtividade)}`}
      </Text>
      <Text style={styles.detailLine}>{registro.atividade}</Text>
      <Text style={styles.detailLine}>{registro.localNome}</Text>
      {registro.posicao != null && registro.totalNaLista != null ? (
        <Text style={styles.posicaoLine}>
          Sua posição: {formatListaEsperaPosicaoLabel(registro.posicao, registro.totalNaLista)}
        </Text>
      ) : null}

      <Pressable
        style={styles.trashOnlyButton}
        onPress={onCancelPress}
        accessibilityLabel="Remover da lista de espera">
        <Ionicons name="trash-outline" size={28} color={COLORS.error} />
      </Pressable>
    </View>
  );
}

export function HomeCompromissosSection({
  reservas,
  proximaReserva,
  proximaListaEspera,
  totalReservas,
  totalListasEspera,
  isLoading,
  reservasError,
  listaEsperaError,
  canAccessListaEspera,
  showLocalColumn = false,
  user,
  authToken,
  onRetryReservas,
  onRetryListaEspera,
  onRefresh,
  onReservaRemoved,
  onCriticalModalVisibilityChange,
}: HomeCompromissosSectionProps) {
  const router = useRouter();
  const [reservaParaCancelar, setReservaParaCancelar] = useState<ReservaSummary | null>(null);
  const [listaParaCancelar, setListaParaCancelar] = useState<ListaEsperaSummary | null>(null);

  useEffect(() => {
    const hasCriticalModalOpen = reservaParaCancelar !== null || listaParaCancelar !== null;

    onCriticalModalVisibilityChange?.(hasCriticalModalOpen);
  }, [listaParaCancelar, onCriticalModalVisibilityChange, reservaParaCancelar]);

  const hasReserva = proximaReserva !== null;
  const hasListaEspera = canAccessListaEspera && proximaListaEspera !== null;
  const hasVisibleContent =
    Boolean(reservasError) ||
    (canAccessListaEspera && Boolean(listaEsperaError)) ||
    hasReserva ||
    hasListaEspera;
  const hasOpenModal = reservaParaCancelar !== null || listaParaCancelar !== null;

  if (!hasVisibleContent && !hasOpenModal) {
    return null;
  }

  return (
    <View style={styles.section}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.blue} />
        </View>
      ) : (
        <>
          {reservasError && !hasReserva ? (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>{reservasError}</Text>
              <Pressable onPress={onRetryReservas}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          {hasReserva ? (
            <View style={styles.cardGroup}>
              {totalReservas > 1 ? (
                <>
                  <Text style={styles.listSectionTitle}>Minhas Reservas</Text>
                  <ReservaSummaryList
                    reservas={reservas}
                    showLocal={showLocalColumn}
                    canCancelReserva={canCancelReservaUsuarioList}
                    onCancelPress={setReservaParaCancelar}
                  />
                </>
              ) : (
                <ReservaSummaryCard
                  reserva={proximaReserva}
                  showLocal={showLocalColumn}
                  canCancelReserva={canCancelReservaUsuarioList(proximaReserva)}
                  onCancelPress={() => setReservaParaCancelar(proximaReserva)}
                />
              )}
            </View>
          ) : null}

          {canAccessListaEspera && listaEsperaError && !hasListaEspera ? (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>{listaEsperaError}</Text>
              <Pressable onPress={onRetryListaEspera}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          {canAccessListaEspera && hasListaEspera ? (
            <View style={styles.cardGroup}>
              <ListaEsperaSummaryCard
                registro={proximaListaEspera}
                onCancelPress={() => setListaParaCancelar(proximaListaEspera)}
              />
              {totalListasEspera > 1 ? (
                <Pressable
                  style={styles.seeAllButton}
                  onPress={() => router.push('/lista-espera')}>
                  <Text style={styles.seeAllText}>Ver todas</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      <CancelarReservaModal
        visible={reservaParaCancelar !== null}
        reserva={reservaParaCancelar}
        user={user}
        authToken={authToken}
        onClose={() => setReservaParaCancelar(null)}
        onSuccess={(reservaId) => {
          onReservaRemoved?.(reservaId);
          onRefresh();
        }}
      />

      <CancelarListaEsperaModal
        visible={listaParaCancelar !== null}
        registro={listaParaCancelar}
        authToken={authToken}
        onClose={() => setListaParaCancelar(null)}
        onSuccess={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  cardGroup: {
    marginBottom: 12,
  },
  listSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trashHeaderButton: {
    padding: 4,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  dateTimeLine: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  detailLine: {
    fontSize: 15,
    color: COLORS.navy,
    lineHeight: 21,
  },
  posicaoLine: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gold,
    marginTop: 6,
  },
  trashOnlyButton: {
    alignSelf: 'center',
    marginTop: 12,
    padding: 6,
  },
  seeAllButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
  errorBlock: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
});
