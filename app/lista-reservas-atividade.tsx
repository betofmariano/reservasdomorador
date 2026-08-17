import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { ListaReservasAtividadeFiltros } from '@/components/lista-reservas-atividade/lista-reservas-atividade-filtros';
import { ListaReservasAtividadeListHeader } from '@/components/lista-reservas-atividade/lista-reservas-atividade-list-header';
import { ReservaAtividadeRelatorioItemRow } from '@/components/lista-reservas-atividade/reserva-atividade-relatorio-item';
import { ResumoListaReservasAtividade } from '@/components/lista-reservas-atividade/resumo-lista-reservas-atividade';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { LISTA_RESERVAS_ATIVIDADE_MAX_WIDTH } from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import {
  LISTA_RESERVAS_ATIVIDADE_MESSAGES,
  useListaReservasAtividadeScreen,
} from '@/hooks/use-lista-reservas-atividade-screen';
import { formatFullDateLabel } from '@/utils/jogos-time';
import { gerarListaReservasAtividadePdf } from '@/utils/gerar-lista-reservas-atividade-pdf';
import {
  getRelatorioMaxSelectableDate,
  getRelatorioMinStartDate,
} from '@/utils/lista-reservas-atividade';

const COLORS = {
  background: '#FFFFFF',
  navy: '#1B2B4B',
  blue: '#2456A8',
  error: '#D64545',
  muted: '#5C6475',
};

type ActiveDateField = 'startDate' | 'endDate' | null;

export default function ListaReservasAtividadeScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeDateField, setActiveDateField] = useState<ActiveDateField>(null);

  const minStartDate = useMemo(() => getRelatorioMinStartDate(), []);
  const maxSelectableDate = useMemo(() => getRelatorioMaxSelectableDate(), []);

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const {
    canAccess,
    requiresLocalSelection,
    isContextLoading,
    localNome,
    atividades,
    selectedAtividadesId,
    selectedAtividade,
    startDate,
    endDate,
    reservas,
    resumo,
    validationError,
    isLoadingAtividades,
    isConsultando,
    atividadesError,
    consultaError,
    hasConsultado,
    setSelectedAtividadesId,
    setStartDate,
    setEndDate,
    loadAtividades,
    consultarReservas,
  } = useListaReservasAtividadeScreen({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  async function handleGerarPdf() {
    if (!localNome || !selectedAtividade || reservas.length === 0) {
      return;
    }

    setIsGeneratingPdf(true);

    try {
      await gerarListaReservasAtividadePdf({
        localNome,
        atividadeNome: selectedAtividade.nome,
        periodoInicioLabel: formatFullDateLabel(startDate),
        periodoFimLabel: formatFullDateLabel(endDate),
        reservas,
        resumo,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Não foi possível gerar o PDF.';
      showToast(message, { variant: 'error' });
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  const listHeader = useMemo(
    () => (
      <>
        {localNome ? <Text style={styles.localLabel}>Local: {localNome}</Text> : null}

        <ListaReservasAtividadeFiltros
          atividades={atividades}
          selectedAtividadesId={selectedAtividadesId}
          onChangeAtividade={setSelectedAtividadesId}
          isLoadingAtividades={isLoadingAtividades}
          atividadesError={atividadesError}
          onRetryAtividades={() => void loadAtividades()}
          startDate={startDate}
          endDate={endDate}
          onPressStartDate={() => setActiveDateField('startDate')}
          onPressEndDate={() => setActiveDateField('endDate')}
          validationError={validationError}
          isConsultando={isConsultando}
          onConsultar={() => void consultarReservas()}
          onGerarPdf={() => void handleGerarPdf()}
          pdfDisabled={isGeneratingPdf || reservas.length === 0}
        />

        {hasConsultado && !consultaError ? (
          <ResumoListaReservasAtividade resumo={resumo} />
        ) : null}

        {isLoadingAtividades && atividades.length === 0 ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color={COLORS.blue} />
            <Text style={styles.inlineLoadingText}>
              {LISTA_RESERVAS_ATIVIDADE_MESSAGES.loadAtividades}
            </Text>
          </View>
        ) : null}

        {!isLoadingAtividades && atividades.length === 0 && !atividadesError ? (
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>
              {LISTA_RESERVAS_ATIVIDADE_MESSAGES.emptyAtividades}
            </Text>
          </View>
        ) : null}

        {consultaError ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{consultaError}</Text>
            <Pressable style={styles.linkButton} onPress={() => void consultarReservas()}>
              <Text style={styles.linkButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}
      </>
    ),
    [
      atividades,
      atividadesError,
      consultaError,
      endDate,
      hasConsultado,
      isConsultando,
      isGeneratingPdf,
      isLoadingAtividades,
      loadAtividades,
      localNome,
      reservas.length,
      resumo,
      selectedAtividadesId,
      startDate,
      validationError,
    ],
  );

  if (isAuthLoading || isContextLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.blue} />
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  if (requiresLocalSelection) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer style={styles.screenContainer}>
          <ScreenHeader user={user} title="Lista de Reservas por Atividade" />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{LISTA_RESERVAS_ATIVIDADE_MESSAGES.noLocal}</Text>
            <Pressable style={styles.linkButton} onPress={() => router.replace('/')}>
              <Text style={styles.linkButtonText}>Ir para o início</Text>
            </Pressable>
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  if (!canAccess) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer style={styles.screenContainer}>
          <ScreenHeader user={user} title="Lista de Reservas por Atividade" />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{LISTA_RESERVAS_ATIVIDADE_MESSAGES.permission}</Text>
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={LISTA_RESERVAS_ATIVIDADE_MAX_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title="Lista de Reservas por Atividade" />
        <ScreenHeaderDivider />

        <View style={styles.listContainer}>
          <FlatList
            style={styles.list}
            data={reservas}
            keyExtractor={(item) => String(item.reservaId)}
            ListHeaderComponent={
              <>
                {listHeader}
                {hasConsultado && !consultaError && resumo.totalConsulta > 0 ? (
                  <ListaReservasAtividadeListHeader />
                ) : null}
              </>
            }
            ListEmptyComponent={
              hasConsultado && !consultaError && !isConsultando ? (
                <View style={styles.centerContent}>
                  <Text style={styles.messageText}>
                    {LISTA_RESERVAS_ATIVIDADE_MESSAGES.emptyConsulta}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => <ReservaAtividadeRelatorioItemRow item={item} />}
            refreshControl={
              <RefreshControl
                refreshing={isConsultando}
                onRefresh={() => void consultarReservas()}
                tintColor={COLORS.blue}
                colors={[COLORS.blue]}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          />
        </View>

        <DatePickerSheet
          visible={activeDateField === 'startDate'}
          value={startDate}
          minimumDate={minStartDate}
          maximumDate={endDate}
          onConfirm={setStartDate}
          onClose={() => setActiveDateField(null)}
        />
        <DatePickerSheet
          visible={activeDateField === 'endDate'}
          value={endDate}
          minimumDate={startDate}
          maximumDate={maxSelectableDate}
          onConfirm={setEndDate}
          onClose={() => setActiveDateField(null)}
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
    minHeight: 0,
  },
  listContainer: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    maxWidth: LISTA_RESERVAS_ATIVIDADE_MAX_WIDTH,
    alignSelf: 'center',
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  localLabel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 14,
    color: COLORS.muted,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 12,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  inlineLoadingText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.navy,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: COLORS.error,
    textAlign: 'center',
  },
  linkButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  linkButtonText: {
    color: COLORS.blue,
    fontSize: 15,
    fontWeight: '700',
  },
});
