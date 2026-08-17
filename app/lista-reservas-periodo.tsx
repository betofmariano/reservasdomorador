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
import { ListaReservasPeriodoFiltros } from '@/components/lista-reservas-periodo/lista-reservas-periodo-filtros';
import { ListaReservasPeriodoListHeader } from '@/components/lista-reservas-periodo/lista-reservas-periodo-list-header';
import { ReservaPeriodoRelatorioItemRow } from '@/components/lista-reservas-periodo/reserva-periodo-relatorio-item';
import { ResumoListaReservasPeriodo } from '@/components/lista-reservas-periodo/resumo-lista-reservas-periodo';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { LISTA_RESERVAS_ATIVIDADE_MAX_WIDTH } from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import {
  LISTA_RESERVAS_PERIODO_MESSAGES,
  useListaReservasPeriodoScreen,
} from '@/hooks/use-lista-reservas-periodo-screen';
import { gerarListaReservasPeriodoPdf } from '@/utils/gerar-lista-reservas-periodo-pdf';
import { formatFullDateLabel } from '@/utils/jogos-time';
import {
  getRelatorioMaxSelectableDate,
  getRelatorioMinStartDate,
} from '@/utils/lista-reservas-periodo';

const COLORS = {
  background: '#FFFFFF',
  navy: '#1B2B4B',
  blue: '#2456A8',
  error: '#D64545',
  muted: '#5C6475',
};

type ActiveDateField = 'startDate' | 'endDate' | null;

export default function ListaReservasPeriodoScreen() {
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
    startDate,
    endDate,
    reservas,
    resumo,
    validationError,
    isConsultando,
    consultaError,
    hasConsultado,
    setStartDate,
    setEndDate,
    consultarReservas,
  } = useListaReservasPeriodoScreen({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  async function handleGerarPdf() {
    if (!localNome || reservas.length === 0) {
      return;
    }

    setIsGeneratingPdf(true);

    try {
      await gerarListaReservasPeriodoPdf({
        localNome,
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

        <ListaReservasPeriodoFiltros
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

        {hasConsultado && !consultaError ? <ResumoListaReservasPeriodo resumo={resumo} /> : null}

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
      consultaError,
      consultarReservas,
      endDate,
      hasConsultado,
      isConsultando,
      isGeneratingPdf,
      localNome,
      reservas.length,
      resumo,
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
          <ScreenHeader user={user} title="Resumo de Reservas por Período" />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{LISTA_RESERVAS_PERIODO_MESSAGES.noLocal}</Text>
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
          <ScreenHeader user={user} title="Resumo de Reservas por Período" />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{LISTA_RESERVAS_PERIODO_MESSAGES.permission}</Text>
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={LISTA_RESERVAS_ATIVIDADE_MAX_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title="Resumo de Reservas por Período" />
        <ScreenHeaderDivider />

        <View style={styles.listContainer}>
          <FlatList
            style={styles.list}
            data={reservas}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={
              <>
                {listHeader}
                {hasConsultado && !consultaError && resumo.totalAtividades > 0 ? (
                  <ListaReservasPeriodoListHeader />
                ) : null}
              </>
            }
            ListEmptyComponent={
              hasConsultado && !consultaError && !isConsultando ? (
                <View style={styles.centerContent}>
                  <Text style={styles.messageText}>
                    {LISTA_RESERVAS_PERIODO_MESSAGES.emptyConsulta}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => <ReservaPeriodoRelatorioItemRow item={item} />}
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
