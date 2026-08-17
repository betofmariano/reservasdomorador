import { useCallback, useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';

import { MapaDiarioFuturoList } from '@/components/mapa-diario-futuro-list';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import { useUserContext } from '@/contexts/user-context';
import {
  LISTA_ESPERA_HORARIOS_MESSAGES,
  useListaEsperaHorariosScreen,
} from '@/hooks/use-lista-espera-horarios-screen';
import {
  createWaitingListEntry,
  isDuplicateWaitingListError,
} from '@/services/lista-espera-service';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';

const COLORS = {
  background: '#FFFFFF',
  blue: '#2456A8',
  error: '#D64545',
  muted: '#5C6475',
};

function parseRouteId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseRouteText(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;

  return raw?.trim() ?? '';
}

export default function ListaEsperaHorariosScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const params = useLocalSearchParams<{
    academiasId?: string;
    atividadesId?: string;
    atividadeNome?: string;
    observacao?: string;
  }>();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();
  const { effectiveAcademiasId, permissions, isLoading: isContextLoading } = useUserContext();

  const atividadesId = parseRouteId(params.atividadesId);
  const atividadeNome = parseRouteText(params.atividadeNome) || 'Atividade';
  const academiasId = effectiveAcademiasId;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const {
    horarios,
    isLoading,
    isRefreshing,
    loadError,
    emptyMessage,
    isReady,
    fetchHorarios,
  } = useListaEsperaHorariosScreen({
    academiasId,
    atividadesId,
    authToken,
    onUnauthorized: handleUnauthorized,
  });

  useEffect(() => {
    if (isAuthLoading || isContextLoading || !user) {
      return;
    }

    if (!permissions.podeAcessarListaEspera || !academiasId || !atividadesId) {
      router.replace('/lista-espera');
    }
  }, [
    academiasId,
    atividadesId,
    isAuthLoading,
    isContextLoading,
    permissions.podeAcessarListaEspera,
    router,
    user,
  ]);

  useEffect(() => {
    if (isAuthLoading || isContextLoading || !user || !authToken || !isReady) {
      return;
    }

    void fetchHorarios();
  }, [authToken, fetchHorarios, isAuthLoading, isContextLoading, isReady, user]);

  async function handleSelectHorario(item: MapaDiarioFuturoItem) {
    if (!user || !authToken || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createWaitingListEntry(
        {
          academias_id: item.academias_id,
          atividades_id: item.atividades_id,
          atividade: item.atividade,
          dataAtividade: item.dataAtividade,
          users_id: user.id,
          nome: user.nome,
          telefone: user.telefoneConfirmado || user.telefone,
          email: user.email ?? '',
        },
        authToken,
      );

      showToast(LISTA_ESPERA_HORARIOS_MESSAGES.success, { variant: 'success' });
      router.replace('/lista-espera');
    } catch (error) {
      if (isDuplicateWaitingListError(error)) {
        showToast(LISTA_ESPERA_HORARIOS_MESSAGES.duplicate, { variant: 'error' });
        return;
      }

      const message =
        error instanceof ApiError && error.message
          ? error.message
          : getApiErrorMessage(error) || LISTA_ESPERA_HORARIOS_MESSAGES.submitError;

      showToast(message, { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

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

  function renderContent() {
    if (!isReady) {
      return null;
    }

    if (isLoading && !isRefreshing) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      );
    }

    if (loadError) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable style={styles.retryButton} onPress={() => void fetchHorarios()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    if (horarios.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      );
    }

    return (
      <MapaDiarioFuturoList
        atividadeNome={atividadeNome}
        horarios={horarios}
        instructionText="Clique na data para entrar na lista de espera"
        isBusy={isSubmitting}
        allowSelectWhenFull
        onSelectHorario={(item) => void handleSelectHorario(item)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={WEB_MAX_CONTENT_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title={'Lista de\nEspera'} />
        <ScreenHeaderDivider />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            isReady ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void fetchHorarios({ refreshing: true })}
                tintColor={COLORS.blue}
                colors={[COLORS.blue]}
                enabled={!isSubmitting}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}>
          {renderContent()}
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    minHeight: 220,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
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
