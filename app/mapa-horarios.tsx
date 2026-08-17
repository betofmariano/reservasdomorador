import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AtividadeSelector } from '@/components/atividade-selector';
import { ClubSelector } from '@/components/club-selector';
import { MapaHorariosGrid, MapaHorariosGridLoading } from '@/components/mapa-horarios-grid';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  MAPA_HORARIOS_MESSAGES,
  useMapaHorariosScreen,
} from '@/hooks/use-mapa-horarios-screen';

const COLORS = {
  background: MATCHPOINT_COLORS.background,
  blue: MATCHPOINT_COLORS.blue,
  error: MATCHPOINT_COLORS.error,
  muted: MATCHPOINT_COLORS.muted,
};

export default function MapaHorariosScreen() {
  const router = useRouter();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const {
    availableClubs,
    selectedClubId,
    atividades,
    selectedAtividadeId,
    isLoadingAtividades,
    atividadesLoadError,
    gridData,
    isLoadingHorarios,
    horariosLoadError,
    isRefreshing,
    isLoadingClubs,
    isLoadingClub,
    clubsLoadError,
    clubLoadError,
    isAdministrador,
    canViewSelectedClub,
    showClubSelector,
    loadedClub,
    setSelectedClubId,
    setSelectedAtividadeId,
    fetchAvailableClubs,
    fetchClubDetails,
    fetchAtividades,
    fetchHorarios,
  } = useMapaHorariosScreen({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  if (isAuthLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer maxWidth={WEB_MAX_CONTENT_WIDTH}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.blue} />
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={WEB_MAX_CONTENT_WIDTH} style={styles.screenContainer}>
        <ScreenHeader
          user={user}
          title={'Grade de\nHorários'}
        />
        <ScreenHeaderDivider />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            canViewSelectedClub && selectedAtividadeId ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void fetchHorarios({ refreshing: true })}
                tintColor={COLORS.blue}
                colors={[COLORS.blue]}
              />
            ) : undefined
          }>
          {isLoadingClubs ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={COLORS.blue} />
            </View>
          ) : null}

          {clubsLoadError ? (
            <View style={styles.centerContent}>
              <Text style={styles.errorText}>{clubsLoadError}</Text>
              <Pressable style={styles.retryButton} onPress={() => void fetchAvailableClubs()}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoadingClubs && !clubsLoadError && showClubSelector ? (
            <ClubSelector
              clubs={availableClubs}
              value={selectedClubId}
              onChange={setSelectedClubId}
              isLoading={isLoadingClubs}
              error={clubsLoadError}
              onRetry={() => void fetchAvailableClubs()}
              label="Local"
              placeholder="Selecione o local"
              modalTitle="Selecione o local"
            />
          ) : null}

          {!isLoadingClubs && !clubsLoadError && !showClubSelector && loadedClub ? (
            <Text style={styles.localTitle}>{loadedClub.nome}</Text>
          ) : null}

          {isLoadingClub ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={COLORS.blue} />
            </View>
          ) : null}

          {clubLoadError ? (
            <View style={styles.centerContent}>
              <Text style={styles.errorText}>{clubLoadError}</Text>
              {selectedClubId ? (
                <Pressable
                  style={styles.retryButton}
                  onPress={() => void fetchClubDetails(selectedClubId)}>
                  <Text style={styles.retryText}>Tentar novamente</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {!isLoadingClubs && !clubsLoadError && !canViewSelectedClub && !isLoadingClub ? (
            <View style={styles.centerContent}>
              <Text style={styles.helperText}>
                {isAdministrador
                  ? MAPA_HORARIOS_MESSAGES.selectLocal
                  : MAPA_HORARIOS_MESSAGES.noEffectiveLocal}
              </Text>
            </View>
          ) : null}

          {canViewSelectedClub ? (
            <>
              <AtividadeSelector
                atividades={atividades}
                value={selectedAtividadeId}
                onChange={setSelectedAtividadeId}
                isLoading={isLoadingAtividades}
                error={atividadesLoadError}
                onRetry={() => void fetchAtividades()}
                disabled={!selectedClubId}
                placeholder="Selecione a atividade"
                emptyPlaceholder="Nenhuma atividade cadastrada"
                modalTitle="Selecione a atividade"
              />

              {!selectedAtividadeId ? (
                <Text style={styles.helperText}>Selecione uma atividade para visualizar a grade.</Text>
              ) : isLoadingHorarios ? (
                <MapaHorariosGridLoading />
              ) : horariosLoadError ? (
                <View style={styles.centerContent}>
                  <Text style={styles.errorText}>{horariosLoadError}</Text>
                  <Pressable style={styles.retryButton} onPress={() => void fetchHorarios()}>
                    <Text style={styles.retryText}>Tentar novamente</Text>
                  </Pressable>
                </View>
              ) : gridData.rows.length === 0 ? (
                <Text style={styles.emptyText}>{MAPA_HORARIOS_MESSAGES.emptyList}</Text>
              ) : (
                <MapaHorariosGrid grid={gridData} />
              )}
            </>
          ) : null}
        </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  localTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.blue,
    marginBottom: 16,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    minHeight: 120,
  },
  helperText: {
    fontSize: 15,
    color: COLORS.muted,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
    fontWeight: '600',
    textAlign: 'center',
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
