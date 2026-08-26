import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AdminTableScrollContainer } from '@/components/admin-table-scroll-container';
import { ExcluirCadastroModal } from '@/components/excluir-cadastro-modal';
import { RelatorioListaEsperaCard } from '@/components/relatorio-lista-espera/relatorio-lista-espera-card';
import { RelatorioListaEsperaFiltros } from '@/components/relatorio-lista-espera/relatorio-lista-espera-filtros';
import {
  RELATORIO_LISTA_ESPERA_TABLE_MIN_WIDTH,
  RelatorioListaEsperaListHeader,
} from '@/components/relatorio-lista-espera/relatorio-lista-espera-list-header';
import { RelatorioListaEsperaResumo } from '@/components/relatorio-lista-espera/relatorio-lista-espera-resumo';
import { RelatorioListaEsperaRow } from '@/components/relatorio-lista-espera/relatorio-lista-espera-row';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { RELATORIO_LISTA_ESPERA_REPORT_WIDTH, WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import {
  RELATORIO_LISTA_ESPERA_MESSAGES,
  useRelatorioListaEsperaScreen,
} from '@/hooks/use-relatorio-lista-espera-screen';
import type { ListaEsperaRegistro } from '@/types/lista-espera';
import { gerarRelatorioListaEsperaPdf } from '@/utils/gerar-relatorio-lista-espera-pdf';
import {
  RELATORIO_LISTA_ESPERA_ORDEM_OPTIONS,
  RELATORIO_LISTA_ESPERA_TODAS_ATIVIDADES_LABEL,
} from '@/utils/relatorio-lista-espera';

const COLORS = {
  background: '#FFFFFF',
  navy: '#3A2154',
  blue: '#0F7A6C',
  error: '#D64545',
  muted: '#5C6475',
};

export default function RelatorioListaEsperaScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { width } = useWindowDimensions();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();
  const isCompact = width <= WEB_MAX_CONTENT_WIDTH;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
    ordem,
    setOrdem,
    setSelectedAtividadesId,
    registrosFiltrados,
    isLoadingAtividades,
    isLoadingRegistros,
    isRefreshing,
    atividadesError,
    loadError,
    itemToDelete,
    isDeleting,
    deleteError,
    setItemToDelete,
    closeDeleteModal,
    confirmDelete,
    reloadAtividades,
    reloadRegistros,
  } = useRelatorioListaEsperaScreen({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  const isLoading = isLoadingAtividades || isLoadingRegistros;
  const ordemLabel =
    RELATORIO_LISTA_ESPERA_ORDEM_OPTIONS.find((item) => item.value === ordem)?.label ?? 'Entrada';

  async function handleGerarPdf() {
    if (!localNome || registrosFiltrados.length === 0) {
      return;
    }

    setIsGeneratingPdf(true);

    try {
      await gerarRelatorioListaEsperaPdf({
        localNome,
        atividadeNome: selectedAtividade?.nome ?? RELATORIO_LISTA_ESPERA_TODAS_ATIVIDADES_LABEL,
        ordemLabel,
        registros: registrosFiltrados,
        ordem,
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

  function renderTableContent() {
    return (
      <>
        <RelatorioListaEsperaListHeader />
        {registrosFiltrados.map((item) => (
          <RelatorioListaEsperaRow
            key={item.id}
            item={item}
            includeYear={!isCompact}
            onDeletePress={() => setItemToDelete(item)}
          />
        ))}
      </>
    );
  }

  function renderListItem({ item }: { item: ListaEsperaRegistro }) {
    return (
      <RelatorioListaEsperaCard item={item} onDeletePress={() => setItemToDelete(item)} />
    );
  }

  const listHeader = (
    <View>
      {localNome ? <Text style={styles.localLabel}>Local: {localNome}</Text> : null}

      <RelatorioListaEsperaFiltros
        atividades={atividades}
        selectedAtividadesId={selectedAtividadesId}
        onChangeAtividade={setSelectedAtividadesId}
        isLoadingAtividades={isLoadingAtividades}
        atividadesError={atividadesError}
        onRetryAtividades={() => void reloadAtividades()}
        ordem={ordem}
        onChangeOrdem={setOrdem}
        onGerarPdf={() => void handleGerarPdf()}
        pdfDisabled={isGeneratingPdf || registrosFiltrados.length === 0}
      />

      {!isLoading && !loadError && registrosFiltrados.length > 0 ? (
        <RelatorioListaEsperaResumo total={registrosFiltrados.length} />
      ) : null}

      {isLoading && registrosFiltrados.length === 0 ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator size="small" color={COLORS.blue} />
          <Text style={styles.inlineLoadingText}>
            {isLoadingAtividades
              ? RELATORIO_LISTA_ESPERA_MESSAGES.loadingAtividades
              : RELATORIO_LISTA_ESPERA_MESSAGES.loadingRegistros}
          </Text>
        </View>
      ) : null}

      {loadError ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable style={styles.linkButton} onPress={() => void reloadRegistros()}>
            <Text style={styles.linkButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoadingAtividades && !atividadesError && atividades.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.messageText}>{RELATORIO_LISTA_ESPERA_MESSAGES.emptyAtividades}</Text>
        </View>
      ) : null}

      {!isLoading && !loadError && atividades.length > 0 && registrosFiltrados.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.messageText}>
            {selectedAtividadesId != null
              ? RELATORIO_LISTA_ESPERA_MESSAGES.emptyAtividade
              : RELATORIO_LISTA_ESPERA_MESSAGES.empty}
          </Text>
        </View>
      ) : null}

      {!isCompact && !isLoading && !loadError && registrosFiltrados.length > 0 ? (
        <AdminTableScrollContainer
          minWidth={RELATORIO_LISTA_ESPERA_TABLE_MIN_WIDTH}
          maxWidth={RELATORIO_LISTA_ESPERA_REPORT_WIDTH}>
          {renderTableContent()}
        </AdminTableScrollContainer>
      ) : null}
    </View>
  );

  if (isAuthLoading || isContextLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer maxWidth={RELATORIO_LISTA_ESPERA_REPORT_WIDTH}>
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
        <WebScreenContainer maxWidth={RELATORIO_LISTA_ESPERA_REPORT_WIDTH} style={styles.screenContainer}>
          <ScreenHeader user={user} title="Lista de Espera" />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{RELATORIO_LISTA_ESPERA_MESSAGES.noLocal}</Text>
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
        <WebScreenContainer maxWidth={RELATORIO_LISTA_ESPERA_REPORT_WIDTH} style={styles.screenContainer}>
          <ScreenHeader user={user} title="Lista de Espera" />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{RELATORIO_LISTA_ESPERA_MESSAGES.unavailable}</Text>
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={RELATORIO_LISTA_ESPERA_REPORT_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title="Lista de Espera" />
        <ScreenHeaderDivider />

        <FlatList
          data={isCompact && !isLoading && !loadError ? registrosFiltrados : []}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderListItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void reloadRegistros()}
              colors={[COLORS.blue]}
              tintColor={COLORS.blue}
            />
          }
        />

        <ExcluirCadastroModal
          visible={itemToDelete != null}
          title={RELATORIO_LISTA_ESPERA_MESSAGES.deleteConfirmTitle}
          message={
            itemToDelete
              ? RELATORIO_LISTA_ESPERA_MESSAGES.deleteConfirmMessage(itemToDelete)
              : ''
          }
          isDeleting={isDeleting}
          errorMessage={deleteError}
          onClose={closeDeleteModal}
          onConfirm={() => void confirmDelete()}
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
  listContent: {
    paddingBottom: 24,
  },
  localLabel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  inlineLoadingText: {
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
});
