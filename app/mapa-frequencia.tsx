import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AdminTableScrollContainer } from '@/components/admin-table-scroll-container';
import { BotaoGerarPdfMapaFrequencia } from '@/components/mapa-frequencia/botao-gerar-pdf-mapa-frequencia';
import { MapaFrequenciaGrid } from '@/components/mapa-frequencia/mapa-frequencia-grid';
import { MapaFrequenciaLegenda } from '@/components/mapa-frequencia/mapa-frequencia-legenda';
import { MapaFrequenciaSelecaoModal } from '@/components/mapa-frequencia/mapa-frequencia-selecao-modal';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { MAPA_FREQUENCIA_REPORT_WIDTH } from '@/constants/web-layout';
import { useAuth } from '@/contexts/auth-context';
import {
  MAPA_FREQUENCIA_MESSAGES,
  useMapaFrequenciaScreen,
} from '@/hooks/use-mapa-frequencia-screen';
import type { GerarMapaFrequenciaPdfInput } from '@/utils/gerar-mapa-frequencia-pdf';

const COLORS = {
  background: '#FFFFFF',
  navy: '#1B2B4B',
  blue: '#2456A8',
  error: '#D64545',
  muted: '#5C6475',
  accent: '#E89520',
};

const GRID_MIN_WIDTH = MAPA_FREQUENCIA_REPORT_WIDTH;

export default function MapaFrequenciaScreen() {
  const router = useRouter();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const {
    canAccess,
    requiresLocalSelection,
    isContextLoading,
    localNome,
    showModal,
    setShowModal,
    atividades,
    horarios,
    selectedAtividadesId,
    setSelectedAtividadesId,
    selectedHorario,
    setSelectedHorario,
    selectedAtividade,
    relatorio,
    alunosFiltrados,
    filtroNome,
    setFiltroNome,
    isLoadingAtividades,
    isLoadingHorarios,
    isGenerating,
    generationLabel,
    atividadesError,
    horariosError,
    generationError,
    loadAtividades,
    loadHorarios,
    confirmarConsulta,
    abrirNovaConsulta,
    cancelarGeracao,
    retryGeneration,
  } = useMapaFrequenciaScreen({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  const pdfInput = useMemo((): GerarMapaFrequenciaPdfInput | null => {
    if (!relatorio || !localNome || alunosFiltrados.length === 0 || relatorio.colunas.length === 0) {
      return null;
    }

    return {
      localNome,
      relatorio,
      alunos: alunosFiltrados,
    };
  }, [alunosFiltrados, localNome, relatorio]);

  function navigateAwayFromMapaFrequencia() {
    setShowModal(false);

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/administracao');
  }

  function handleCancelModal() {
    if (relatorio) {
      setShowModal(false);
      return;
    }

    navigateAwayFromMapaFrequencia();
  }

  if (isAuthLoading || isContextLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer maxWidth={MAPA_FREQUENCIA_REPORT_WIDTH}>
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
        <WebScreenContainer maxWidth={MAPA_FREQUENCIA_REPORT_WIDTH} style={styles.screenContainer}>
          <ScreenHeader user={user} title="Mapa de Frequência" />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{MAPA_FREQUENCIA_MESSAGES.noLocal}</Text>
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  if (!canAccess) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer maxWidth={MAPA_FREQUENCIA_REPORT_WIDTH} style={styles.screenContainer}>
          <ScreenHeader user={user} title="Mapa de Frequência" />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{MAPA_FREQUENCIA_MESSAGES.permission}</Text>
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={MAPA_FREQUENCIA_REPORT_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title="Mapa de Frequência" />
        <ScreenHeaderDivider />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {!isLoadingAtividades && atividades.length === 0 && !atividadesError ? (
            <View style={styles.centerContent}>
              <Text style={styles.messageText}>{MAPA_FREQUENCIA_MESSAGES.emptyAtividades}</Text>
            </View>
          ) : null}

          {isGenerating ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={COLORS.blue} />
              <Text style={styles.messageText}>{generationLabel}</Text>
              <Pressable style={styles.linkButton} onPress={cancelarGeracao}>
                <Text style={styles.linkButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          ) : null}

          {generationError ? (
            <View style={styles.centerContent}>
              <Text style={styles.errorText}>{generationError}</Text>
              <Pressable style={styles.linkButton} onPress={() => void retryGeneration()}>
                <Text style={styles.linkButtonText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          {relatorio && !isGenerating ? (
            <>
              <View style={styles.reportHeader}>
                <View style={styles.titleBadges}>
                  <Text style={styles.badge}>Mapa de Frequência</Text>
                  <Text style={styles.badge}>{relatorio.atividadeNome}</Text>
                </View>
                <Text style={styles.metaText}>
                  Horário: {relatorio.horarioFormatado ?? 'Todos'}
                </Text>
                <Text style={styles.metaText}>
                  Total de pessoas na lista: {relatorio.alunos.length}
                </Text>
                {filtroNome.trim() ? (
                  <Text style={styles.metaText}>Exibindo: {alunosFiltrados.length}</Text>
                ) : null}
              </View>

              <View style={styles.filterRow}>
                <TextInput
                  value={filtroNome}
                  onChangeText={setFiltroNome}
                  placeholder="Filtrar por nome..."
                  placeholderTextColor={COLORS.muted}
                  style={styles.filterInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.actionRow}>
                  <Pressable style={styles.secondaryButton} onPress={abrirNovaConsulta}>
                    <Text style={styles.secondaryButtonText}>Nova consulta</Text>
                  </Pressable>
                  <BotaoGerarPdfMapaFrequencia input={pdfInput} />
                </View>
              </View>

              <MapaFrequenciaLegenda />

              {relatorio.colunas.length === 0 ? (
                <View style={styles.centerContent}>
                  <Text style={styles.messageText}>
                    Nenhuma coluna encontrada para os filtros selecionados.
                  </Text>
                </View>
              ) : null}

              {relatorio.alunos.length === 0 ? (
                <View style={styles.centerContent}>
                  <Text style={styles.messageText}>{MAPA_FREQUENCIA_MESSAGES.emptyAlunos}</Text>
                </View>
              ) : null}

              {relatorio.colunas.length > 0 && alunosFiltrados.length > 0 ? (
                <AdminTableScrollContainer
                  minWidth={GRID_MIN_WIDTH}
                  maxWidth={MAPA_FREQUENCIA_REPORT_WIDTH}>
                  <MapaFrequenciaGrid colunas={relatorio.colunas} alunos={alunosFiltrados} />
                </AdminTableScrollContainer>
              ) : null}
            </>
          ) : null}
        </ScrollView>

        <MapaFrequenciaSelecaoModal
          visible={showModal}
          atividades={atividades}
          horarios={horarios}
          selectedAtividadesId={selectedAtividadesId}
          selectedHorario={selectedHorario}
          isLoadingAtividades={isLoadingAtividades}
          isLoadingHorarios={isLoadingHorarios}
          isConfirming={isGenerating}
          atividadesError={atividadesError}
          horariosError={horariosError}
          onChangeAtividade={setSelectedAtividadesId}
          onChangeHorario={setSelectedHorario}
          onRetryAtividades={() => void loadAtividades()}
          onRetryHorarios={() => {
            if (selectedAtividadesId != null) {
              void loadHorarios(selectedAtividadesId);
            }
          }}
          onCancel={handleCancelModal}
          onConfirm={() => void confirmarConsulta()}
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
    paddingBottom: 24,
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
    fontWeight: '600',
    color: COLORS.navy,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
    textAlign: 'center',
  },
  linkButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.blue,
  },
  reportHeader: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  titleBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.accent,
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    overflow: 'hidden',
  },
  metaText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.navy,
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
});
