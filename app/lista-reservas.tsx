import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AdminTableScrollContainer } from '@/components/admin-table-scroll-container';
import { AtividadeSelector } from '@/components/atividade-selector';
import { ExcluirReservaGestorModal } from '@/components/excluir-reserva-gestor-modal';
import { GestorAcademiaSelectorField } from '@/components/gestor-academia-selector-field';
import {
  ListaReservaListHeader,
  ListaReservaListItem,
} from '@/components/lista-reserva-list-item';
import { ListaReservasFiltros } from '@/components/lista-reservas-filtros';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAuth } from '@/contexts/auth-context';
import {
  LISTA_RESERVAS_MESSAGES,
  useListaReservasScreen,
} from '@/hooks/use-lista-reservas-screen';
import type { ListaReservaItem } from '@/types/lista-reserva';
import { getListaReservasTableLayout } from '@/utils/lista-reservas-table-layout';
import { canCancelReservaWithinLimite } from '@/utils/reserva-adversario';

const COLORS = {
  background: '#FFFFFF',
  navy: '#3A2154',
  blue: '#0F7A6C',
  error: '#D64545',
  muted: '#5C6475',
};

export default function ListaReservasScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();
  const [reservaParaExcluir, setReservaParaExcluir] = useState<ListaReservaItem | null>(null);

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const {
    academias,
    selectedAcademia,
    selectedAtividadesId,
    atividades,
    reservas,
    startDate,
    endDate,
    minimumStartDate,
    canSelectPastDates,
    isLoadingClubs,
    isLoadingAtividades,
    isLoadingReservas,
    isRefreshing,
    clubsError,
    atividadesError,
    reservasError,
    showClubSelector,
    showAcademiaSelector,
    availableAcademias,
    selectedAcademiaId,
    setSelectedAcademiaId,
    isLoadingAcademias,
    academiasLoadError,
    fetchAvailableAcademias,
    localNome,
    showAtividadeSelector,
    usaMensalPorSemana,
    canAccessSelectedAcademia,
    setSelectedAtividadesId,
    setStartDate,
    setEndDate,
    nomeFiltro,
    setNomeFiltro,
    loadClubs,
    loadAtividades,
    fetchReservas,
    canDeleteReservas,
    showResponsavelColumn,
    showUnidadeColumn,
  } = useListaReservasScreen({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  const tableLayout = useMemo(
    () =>
      getListaReservasTableLayout(screenWidth, usaMensalPorSemana ? 'mensalPorSemana' : 'default', {
        showUnidade: showUnidadeColumn,
      }),
    [screenWidth, showUnidadeColumn, usaMensalPorSemana],
  );
  const isWideLayout = screenWidth > WEB_MAX_CONTENT_WIDTH;

  const isLoadingInitial =
    isLoadingClubs ||
    (canAccessSelectedAcademia && isLoadingAtividades) ||
    (isLoadingReservas && !isRefreshing);

  const renderItem = useCallback(
    ({ item }: { item: ListaReservaItem }) => (
      <ListaReservaListItem
        reserva={item}
        layout={tableLayout}
        showDeleteAction={canDeleteReservas}
        canDelete={canDeleteReservas && canCancelReservaWithinLimite(item)}
        showResponsavel={showResponsavelColumn}
        showUnidade={showUnidadeColumn}
        onDeletePress={() => setReservaParaExcluir(item)}
      />
    ),
    [canDeleteReservas, showResponsavelColumn, showUnidadeColumn, tableLayout],
  );

  if (isAuthLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={WEB_MAX_CONTENT_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title="" />
        <ScreenHeaderDivider />

        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>
            Total de Reservas : <Text style={styles.totalStrong}>{reservas.length}</Text>
          </Text>
        </View>

        <ListaReservasFiltros
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          minimumStartDate={minimumStartDate}
          hideYear={!canSelectPastDates}
          nomeFiltro={nomeFiltro}
          onNomeFiltroChange={setNomeFiltro}
          topContent={
            <View
              style={[
                styles.selectorsBlock,
                isWideLayout ? styles.headerBlockWide : undefined,
              ]}>
              <GestorAcademiaSelectorField
                showAcademiaSelector={showAcademiaSelector || showClubSelector}
                availableAcademias={
                  availableAcademias.length > 0 ? availableAcademias : academias
                }
                selectedAcademiaId={selectedAcademiaId ?? selectedAcademia?.id ?? null}
                onChange={setSelectedAcademiaId}
                isLoading={isLoadingAcademias}
                error={academiasLoadError}
                onRetry={() => void fetchAvailableAcademias()}
                localNome={localNome}
                hideLabel
                compact
              />

              {showAtividadeSelector ? (
                <AtividadeSelector
                  atividades={atividades}
                  value={selectedAtividadesId}
                  onChange={setSelectedAtividadesId}
                  isLoading={isLoadingAtividades}
                  error={atividadesError}
                  onRetry={() => void loadAtividades()}
                  disabled={isLoadingReservas && !isRefreshing}
                  hideLabel
                  preserveOrder
                  allowAll
                  allLabel="Todas as atividades"
                  onSelectAll={() => setSelectedAtividadesId(null)}
                  placeholder="Selecione a atividade"
                  modalTitle="Selecione a atividade"
                  style={styles.atividadeSelector}
                  selectorTextStyle={styles.atividadeSelectorText}
                  optionTextStyle={styles.atividadeSelectorText}
                />
              ) : null}
            </View>
          }
        />

        {clubsError && academias.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{LISTA_RESERVAS_MESSAGES.clubsError}</Text>
            <Pressable style={styles.retryButton} onPress={() => void loadClubs()}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : !isLoadingClubs && academias.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>{LISTA_RESERVAS_MESSAGES.noClubs}</Text>
          </View>
        ) : !isLoadingClubs && !selectedAcademiaId && !selectedAcademia ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>Selecione um local para continuar.</Text>
          </View>
        ) : !canAccessSelectedAcademia && selectedAcademia ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>{LISTA_RESERVAS_MESSAGES.noAccess}</Text>
          </View>
        ) : usaMensalPorSemana && canAccessSelectedAcademia && !isLoadingAtividades && atividades.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>
              {atividadesError ?? LISTA_RESERVAS_MESSAGES.noAtividades}
            </Text>
            {atividadesError ? (
              <Pressable style={styles.retryButton} onPress={() => void loadAtividades()}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            ) : null}
          </View>
        ) : isLoadingInitial ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.blue} />
          </View>
        ) : reservasError && reservas.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{reservasError}</Text>
            <Pressable style={styles.retryButton} onPress={() => void fetchReservas()}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <AdminTableScrollContainer
              minWidth={tableLayout.tableWidth}
              centerWhenScreenWiderThan={WEB_MAX_CONTENT_WIDTH}>
              {reservas.length > 0 ? (
                <ListaReservaListHeader
                  layout={tableLayout}
                  showDeleteAction={canDeleteReservas}
                  showResponsavel={showResponsavelColumn}
                  showUnidade={showUnidadeColumn}
                />
              ) : null}
              <FlatList
                style={styles.list}
                data={reservas}
                keyExtractor={(item) => `${item.usaMensalPorSemana ? 'mensal' : 'jogo'}-${item.id}`}
                renderItem={renderItem}
                extraData={`${tableLayout.tableWidth}-${nomeFiltro}`}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>{LISTA_RESERVAS_MESSAGES.empty}</Text>
                }
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => void fetchReservas({ refreshing: true })}
                    tintColor={COLORS.blue}
                    colors={[COLORS.blue]}
                  />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            </AdminTableScrollContainer>
          </View>
        )}

        <ExcluirReservaGestorModal
          visible={reservaParaExcluir !== null}
          reserva={reservaParaExcluir}
          user={user}
          authToken={authToken}
          onClose={() => setReservaParaExcluir(null)}
          onSuccess={() => void fetchReservas({ refreshing: true })}
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
  loadingSafeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
  pageTitleContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  selectorsBlock: {
    width: '100%',
    gap: 6,
  },
  headerBlockWide: {
    alignItems: 'center',
    width: '100%',
  },
  atividadeSelector: {
    marginBottom: 0,
  },
  atividadeSelectorText: {
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  list: {
    flex: 1,
  },
  totalStrong: {
    fontWeight: '700',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
});
