import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
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

import { ListaEsperaCard } from '@/components/lista-espera-card';
import { CancelarListaEsperaModal } from '@/components/cancelar-lista-espera-modal';
import { MeusLocaisModal } from '@/components/meus-locais-modal';
import { SelecionarAtividadeReservaModal } from '@/components/selecionar-atividade-reserva-modal';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAuth } from '@/contexts/auth-context';
import { useUserContext } from '@/contexts/user-context';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { getAcademias } from '@/services/academias-service';
import {
  buildAssociatedAcademiaOptions,
  enrichListaEsperaWithAcademias,
  getListaEsperaForUser,
} from '@/services/lista-espera-service';
import { filterActiveFutureListaEspera } from '@/services/home-summary-service';
import { getUserLocalAssociations } from '@/services/user-local-service';
import type { AssociatedClubOption, ListaEsperaDisplay } from '@/types/lista-espera';
import type { ListaEsperaSummary } from '@/types/home-summary';

const COLORS = {
  background: '#FFFFFF',
  navy: '#1B2B4B',
  blue: '#2456A8',
  error: '#D64545',
};

const LOAD_ERROR_MESSAGE = 'Não foi possível carregar seus registros de espera.';
const EMPTY_MESSAGE = 'Você não possui registros na lista de espera.';
const BLOCKED_MESSAGE = 'Lista de espera não está disponível neste local.';
export default function ListaEsperaScreen() {
  const router = useRouter();
  const { user, authToken, isLoading: isAuthLoading } = useAuth();
  const { permissions, isLoading: isContextLoading } = useUserContext();
  const userId = user?.id;

  const [associatedClubs, setAssociatedClubs] = useState<AssociatedClubOption[]>([]);
  const [registros, setRegistros] = useState<ListaEsperaDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAtividadeModalVisible, setIsAtividadeModalVisible] = useState(false);
  const [isMeusLocaisVisible, setIsMeusLocaisVisible] = useState(false);
  const [registroParaRemover, setRegistroParaRemover] = useState<ListaEsperaSummary | null>(null);
  const requestIdRef = useRef(0);
  const isFetchingRef = useRef(false);

  const loadData = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (!userId || !authToken) {
        setErrorMessage('Não foi possível identificar o usuário.');
        setRegistros([]);
        setAssociatedClubs([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (isFetchingRef.current && !options?.refreshing) {
        return;
      }

      const requestId = ++requestIdRef.current;
      isFetchingRef.current = true;

      if (options?.refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage(null);

      try {
        const [associations, clubs] = await Promise.all([
          getUserLocalAssociations(userId),
          getAcademias(),
        ]);

        if (requestId !== requestIdRef.current) {
          return;
        }

        const clubOptions = buildAssociatedAcademiaOptions(associations, clubs);
        setAssociatedClubs(clubOptions);

        const clubIds = clubOptions.map((club) => club.id);
        const entries = await getListaEsperaForUser(userId, clubIds, authToken);
        const activeEntries = filterActiveFutureListaEspera(entries);

        if (requestId !== requestIdRef.current) {
          return;
        }

        const enriched = enrichListaEsperaWithAcademias(entries, clubs);

        enriched.sort((a, b) => (b.registro.dataAtividade ?? 0) - (a.registro.dataAtividade ?? 0));
        setRegistros(enriched);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const message =
          error instanceof ApiError && error.message
            ? error.message
            : getApiErrorMessage(error) || LOAD_ERROR_MESSAGE;

        setErrorMessage(message.includes('conectar') ? message : LOAD_ERROR_MESSAGE);
        setRegistros([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }

        isFetchingRef.current = false;
      }
    },
    [authToken, userId],
  );

  useFocusEffect(
    useCallback(() => {
      if (isAuthLoading || isContextLoading || !userId || !authToken) {
        return;
      }

      if (!permissions.podeAcessarListaEspera) {
        return;
      }

      void loadData();
    }, [
      authToken,
      isAuthLoading,
      isContextLoading,
      loadData,
      permissions.podeAcessarListaEspera,
      userId,
    ]),
  );

  useEffect(() => {
    if (isAuthLoading || isContextLoading || !user) {
      return;
    }

    if (!permissions.podeAcessarListaEspera) {
      router.replace('/');
    }
  }, [isAuthLoading, isContextLoading, permissions.podeAcessarListaEspera, router, user]);

  function handleOpenAtividadeModal() {
    setIsAtividadeModalVisible(true);
  }

  if (isAuthLoading || isContextLoading || !user) {
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

  if (!permissions.podeAcessarListaEspera) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer maxWidth={WEB_MAX_CONTENT_WIDTH}>
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{BLOCKED_MESSAGE}</Text>
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
          title="Lista de Espera"
        />
        <ScreenHeaderDivider />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadData({ refreshing: true })}
              tintColor={COLORS.blue}
              colors={[COLORS.blue]}
            />
          }
          showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Meus registros de espera</Text>

          {isLoading && !isRefreshing ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={COLORS.blue} />
            </View>
          ) : errorMessage && registros.length === 0 ? (
            <View style={styles.centerContent}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadData()}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : registros.length === 0 ? (
            <Text style={styles.emptyText}>{EMPTY_MESSAGE}</Text>
          ) : (
            registros.map((item) => (
              <ListaEsperaCard
                key={item.registro.id}
                item={item}
                onDeletePress={() =>
                  setRegistroParaRemover({
                    id: item.registro.id,
                    dataAtividade: item.registro.dataAtividade!,
                    academias_id: item.registro.academias_id,
                    localNome: item.localNome,
                    atividade: item.registro.atividade,
                    avisado: item.registro.avisado,
                    posicao: null,
                    totalNaLista: null,
                  })
                }
              />
            ))
          )}

          <View style={styles.newSection}>
            <Text style={styles.sectionTitle}>Entrar em uma nova lista de espera</Text>
            <Pressable style={styles.primaryButton} onPress={handleOpenAtividadeModal}>
              <Text style={styles.primaryButtonText}>Entrar em uma lista de espera</Text>
            </Pressable>
          </View>
        </ScrollView>

        <SelecionarAtividadeReservaModal
          visible={isAtividadeModalVisible}
          userId={user.id}
          onClose={() => setIsAtividadeModalVisible(false)}
          onSelect={(atividade) => {
            router.push({
              pathname: '/lista-espera-horarios',
              params: {
                academiasId: String(atividade.academias_id),
                atividadesId: String(atividade.id),
                atividadeNome: atividade.nome,
                observacao: atividade.observacao ?? '',
              },
            });
          }}
          onAddLocal={() => {
            setIsAtividadeModalVisible(false);
            setIsMeusLocaisVisible(true);
          }}
        />

        <MeusLocaisModal
          visible={isMeusLocaisVisible}
          user={user}
          onClose={() => setIsMeusLocaisVisible(false)}
        />

        <CancelarListaEsperaModal
          visible={registroParaRemover !== null}
          registro={registroParaRemover}
          authToken={authToken}
          onClose={() => setRegistroParaRemover(null)}
          onSuccess={() => void loadData({ refreshing: true })}
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 14,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#5C6475',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
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
  newSection: {
    marginTop: 28,
    paddingTop: 8,
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
