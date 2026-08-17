import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { CancelarReservaPresencaModal } from '@/components/lista-presenca/cancelar-reserva-presenca-modal';
import { FiltrosListaPresenca } from '@/components/lista-presenca/filtros-lista-presenca';
import { ReservaPresencaItem } from '@/components/lista-presenca/reserva-presenca-item';
import { ResumoPresenca } from '@/components/lista-presenca/resumo-presenca';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { useAuth } from '@/contexts/auth-context';
import {
  LISTA_PRESENCA_MESSAGES,
  useListaPresencaScreen,
} from '@/hooks/use-lista-presenca-screen';
import type { ReservaPresenca } from '@/types/presenca';

const COLORS = {
  background: '#FFFFFF',
  navy: '#1B2B4B',
  blue: '#2456A8',
  error: '#D64545',
  muted: '#5C6475',
};

export default function ListaPresencaScreen() {
  const router = useRouter();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();
  const [reservaParaCancelar, setReservaParaCancelar] = useState<ReservaPresenca | null>(null);

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const {
    academias,
    selectedAcademiasId,
    selectedAcademia,
    selectedAtividadesId,
    selectedAtividade,
    selectedHorario,
    atividades,
    horarios,
    reservas,
    resumo,
    sortMode,
    presencaError,
    isLoadingClubs,
    isLoadingAtividades,
    isLoadingHorarios,
    isLoadingReservas,
    isRefreshing,
    clubsError,
    atividadesError,
    horariosError,
    reservasError,
    showClubSelector,
    localNome,
    showAtividadeSelector,
    showHorarioSelector,
    canAccessSelectedAcademia,
    canCancelReservas,
    updatingReservaIds,
    setSelectedAtividadesId,
    setSelectedHorario,
    setSortMode,
    handleTogglePresenca,
    handleCancelReserva,
    loadClubs,
    loadAtividades,
    loadHorarios,
    loadReservas,
    setSelectedAcademiaId,
    refreshAll,
  } = useListaPresencaScreen({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  const pdfInput = useMemo(() => {
    if (!selectedAcademia || !selectedAtividade || !selectedHorario || reservas.length === 0) {
      return null;
    }

    return {
      localNome: selectedAcademia.nome,
      atividadeNome: selectedAtividade.nome,
      horario: selectedHorario,
      reservas,
      professorNome: user?.nome,
    };
  }, [reservas, selectedAcademia, selectedAtividade, selectedHorario, user?.nome]);

  const showReservasSection = !!selectedHorario;
  const showEmptyReservas =
    showReservasSection && !isLoadingReservas && !reservasError && reservas.length === 0;
  const showReservasList =
    showReservasSection && !isLoadingReservas && !reservasError && reservas.length > 0;

  if (isAuthLoading || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <WebScreenContainer>
        <ScreenHeader user={user} title="Lista de Presença" />
        <ScreenHeaderDivider />

        <FlatList
          data={showReservasList ? reservas : []}
          keyExtractor={(item) => String(item.reservaId)}
          extraData={{ reservas, updatingReservaIds, resumo }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshAll()} />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerContent}>
              {!isLoadingClubs && !selectedAcademiasId ? (
                <Text style={styles.emptyText}>{LISTA_PRESENCA_MESSAGES.noEffectiveLocal}</Text>
              ) : null}

              {!isLoadingClubs &&
              selectedAcademiasId &&
              !canAccessSelectedAcademia &&
              !clubsError ? (
                <Text style={styles.errorText}>{LISTA_PRESENCA_MESSAGES.noAccess}</Text>
              ) : null}

              <FiltrosListaPresenca
                academias={academias}
                selectedAcademiasId={selectedAcademiasId}
                onChangeAcademia={setSelectedAcademiaId}
                showClubSelector={showClubSelector}
                localNome={localNome}
                isLoadingClubs={isLoadingClubs}
                clubsError={clubsError}
                onRetryClubs={() => void loadClubs()}
                atividades={atividades}
                selectedAtividadesId={selectedAtividadesId}
                onChangeAtividade={setSelectedAtividadesId}
                showAtividadeSelector={showAtividadeSelector}
                isLoadingAtividades={isLoadingAtividades}
                atividadesError={atividadesError}
                onRetryAtividades={() => void loadAtividades()}
                horarios={horarios}
                selectedHorario={selectedHorario}
                onChangeHorario={setSelectedHorario}
                showHorarioSelector={showHorarioSelector}
                isLoadingHorarios={isLoadingHorarios}
                horariosError={horariosError}
                onRetryHorarios={() => void loadHorarios()}
                sortMode={sortMode}
                onChangeSortMode={setSortMode}
                pdfInput={showReservasList ? pdfInput : null}
              />

              {showReservasSection ? (
                <View style={styles.reservasHeader}>
                  {isLoadingReservas ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={COLORS.blue} />
                      <Text style={styles.loadingText}>
                        {LISTA_PRESENCA_MESSAGES.loadReservas}
                      </Text>
                    </View>
                  ) : null}

                  {reservasError ? (
                    <View style={styles.errorBlock}>
                      <Text style={styles.errorText}>{reservasError}</Text>
                      <Text style={styles.retryLink} onPress={() => void loadReservas()}>
                        Tentar novamente
                      </Text>
                    </View>
                  ) : null}

                  {showReservasList ? (
                    <>
                      <ResumoPresenca
                        total={resumo.total}
                        presentes={resumo.presentes}
                        ausentes={resumo.ausentes}
                      />
                      {presencaError ? (
                        <Text style={styles.presencaError}>{presencaError}</Text>
                      ) : null}
                    </>
                  ) : null}

                  {showEmptyReservas ? (
                    <Text style={styles.emptyText}>{LISTA_PRESENCA_MESSAGES.semReservas}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <ReservaPresencaItem
              reserva={item}
              isUpdating={updatingReservaIds.has(item.reservaId)}
              canDelete={canCancelReservas}
              onTogglePresenca={(reserva) => void handleTogglePresenca(reserva)}
              onDelete={setReservaParaCancelar}
            />
          )}
          ListEmptyComponent={null}
        />

        <CancelarReservaPresencaModal
          visible={reservaParaCancelar != null}
          reserva={reservaParaCancelar}
          atividadeNome={selectedAtividade?.nome ?? 'atividade'}
          horarioDescricao={selectedHorario?.descricao ?? ''}
          onClose={() => setReservaParaCancelar(null)}
          onConfirm={handleCancelReserva}
        />
      </WebScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  headerContent: {
    paddingTop: 16,
  },
  reservasHeader: {
    marginTop: 4,
    marginBottom: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
  errorBlock: {
    marginBottom: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryLink: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  presencaError: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
    marginBottom: 8,
  },
});
