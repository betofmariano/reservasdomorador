import { useCallback, useMemo, useState } from 'react';
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
import { ListaUsuariosSuspensosCard } from '@/components/lista-usuarios-suspensos/lista-usuarios-suspensos-card';
import { ListaUsuariosSuspensosFiltros } from '@/components/lista-usuarios-suspensos/lista-usuarios-suspensos-filtros';
import {
  LISTA_USUARIOS_SUSPENSOS_TABLE_MIN_WIDTH,
  ListaUsuariosSuspensosListHeader,
} from '@/components/lista-usuarios-suspensos/lista-usuarios-suspensos-list-header';
import { ListaUsuariosSuspensosResumo } from '@/components/lista-usuarios-suspensos/lista-usuarios-suspensos-resumo';
import { ListaUsuariosSuspensosRow } from '@/components/lista-usuarios-suspensos/lista-usuarios-suspensos-row';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import {
  LISTA_USUARIOS_SUSPENSOS_REPORT_WIDTH,
  WEB_MAX_CONTENT_WIDTH,
} from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import {
  LISTA_USUARIOS_SUSPENSOS_MESSAGES,
  useListaUsuariosSuspensosScreen,
} from '@/hooks/use-lista-usuarios-suspensos-screen';
import type { UsersBloqueadoRegistro } from '@/types/users-bloqueados';
import { gerarListaUsuariosSuspensosPdf } from '@/utils/gerar-lista-usuarios-suspensos-pdf';
import {
  LISTA_USUARIOS_SUSPENSOS_ORDEM_OPTIONS,
  LISTA_USUARIOS_SUSPENSOS_STATUS_OPTIONS,
  LISTA_USUARIOS_SUSPENSOS_TODAS_ATIVIDADES_LABEL,
} from '@/utils/lista-usuarios-suspensos';

const COLORS = {
  background: '#FFFFFF',
  navy: '#1B2B4B',
  blue: '#2456A8',
  error: '#D64545',
  muted: '#5C6475',
};

export default function ListaUsuariosSuspensosScreen() {
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
    statusFilter,
    setStatusFilter,
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
  } = useListaUsuariosSuspensosScreen({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  const isLoading = isLoadingAtividades || isLoadingRegistros;
  const ativosCount = useMemo(
    () => registrosFiltrados.filter((item) => !item.encerrado).length,
    [registrosFiltrados],
  );
  const ordemLabel =
    LISTA_USUARIOS_SUSPENSOS_ORDEM_OPTIONS.find((item) => item.value === ordem)?.label ??
    'Data final';
  const statusLabel =
    LISTA_USUARIOS_SUSPENSOS_STATUS_OPTIONS.find((item) => item.value === statusFilter)?.label ??
    'Suspensões ativas';

  async function handleGerarPdf() {
    if (!localNome || registrosFiltrados.length === 0) {
      return;
    }

    setIsGeneratingPdf(true);

    try {
      await gerarListaUsuariosSuspensosPdf({
        localNome,
        atividadeNome: selectedAtividade?.nome ?? LISTA_USUARIOS_SUSPENSOS_TODAS_ATIVIDADES_LABEL,
        statusLabel,
        ordemLabel,
        ordem,
        registros: registrosFiltrados,
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
        <ListaUsuariosSuspensosListHeader />
        {registrosFiltrados.map((item) => (
          <ListaUsuariosSuspensosRow
            key={item.id}
            item={item}
            includeYear={!isCompact}
            onDeletePress={() => setItemToDelete(item)}
          />
        ))}
      </>
    );
  }

  function renderListItem({ item }: { item: UsersBloqueadoRegistro }) {
    return (
      <ListaUsuariosSuspensosCard
        item={item}
        onDeletePress={() => setItemToDelete(item)}
      />
    );
  }

  const emptyMessage = useMemo(() => {
    if (selectedAtividadesId != null) {
      return LISTA_USUARIOS_SUSPENSOS_MESSAGES.emptyAtividade;
    }

    if (statusFilter !== 'todos') {
      return LISTA_USUARIOS_SUSPENSOS_MESSAGES.emptyStatus;
    }

    return LISTA_USUARIOS_SUSPENSOS_MESSAGES.empty;
  }, [selectedAtividadesId, statusFilter]);

  const listHeader = (
    <View>
      {localNome ? <Text style={styles.localLabel}>Local: {localNome}</Text> : null}

      <ListaUsuariosSuspensosFiltros
        atividades={atividades}
        selectedAtividadesId={selectedAtividadesId}
        onChangeAtividade={setSelectedAtividadesId}
        isLoadingAtividades={isLoadingAtividades}
        atividadesError={atividadesError}
        onRetryAtividades={() => void reloadAtividades()}
        statusFilter={statusFilter}
        onChangeStatus={setStatusFilter}
        ordem={ordem}
        onChangeOrdem={setOrdem}
        onGerarPdf={() => void handleGerarPdf()}
        pdfDisabled={isGeneratingPdf || registrosFiltrados.length === 0}
      />

      {!isLoading && !loadError && registrosFiltrados.length > 0 ? (
        <ListaUsuariosSuspensosResumo total={registrosFiltrados.length} ativos={ativosCount} />
      ) : null}

      {isLoading && registrosFiltrados.length === 0 ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator size="small" color={COLORS.blue} />
          <Text style={styles.inlineLoadingText}>
            {isLoadingAtividades ? 'Carregando atividades...' : 'Carregando suspensões...'}
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
          <Text style={styles.messageText}>{LISTA_USUARIOS_SUSPENSOS_MESSAGES.emptyAtividades}</Text>
        </View>
      ) : null}

      {!isLoading && !loadError && atividades.length > 0 && registrosFiltrados.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.messageText}>{emptyMessage}</Text>
        </View>
      ) : null}

      {!isCompact && !isLoading && !loadError && registrosFiltrados.length > 0 ? (
        <AdminTableScrollContainer
          minWidth={LISTA_USUARIOS_SUSPENSOS_TABLE_MIN_WIDTH}
          maxWidth={LISTA_USUARIOS_SUSPENSOS_REPORT_WIDTH}>
          {renderTableContent()}
        </AdminTableScrollContainer>
      ) : null}
    </View>
  );

  if (isAuthLoading || isContextLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer maxWidth={LISTA_USUARIOS_SUSPENSOS_REPORT_WIDTH}>
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
        <WebScreenContainer
          maxWidth={LISTA_USUARIOS_SUSPENSOS_REPORT_WIDTH}
          style={styles.screenContainer}>
          <ScreenHeader user={user} title={'Lista de\nUsuários Suspensos'} />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{LISTA_USUARIOS_SUSPENSOS_MESSAGES.noLocal}</Text>
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
        <WebScreenContainer
          maxWidth={LISTA_USUARIOS_SUSPENSOS_REPORT_WIDTH}
          style={styles.screenContainer}>
          <ScreenHeader user={user} title={'Lista de\nUsuários Suspensos'} />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{LISTA_USUARIOS_SUSPENSOS_MESSAGES.permission}</Text>
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer
        maxWidth={LISTA_USUARIOS_SUSPENSOS_REPORT_WIDTH}
        style={styles.screenContainer}>
        <ScreenHeader user={user} title={'Lista de\nUsuários Suspensos'} />
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
          title={LISTA_USUARIOS_SUSPENSOS_MESSAGES.deleteConfirmTitle}
          message={
            itemToDelete
              ? LISTA_USUARIOS_SUSPENSOS_MESSAGES.deleteConfirmMessage(itemToDelete)
              : ''
          }
          confirmLabel="Excluir"
          confirmDestructive
          isDeleting={isDeleting}
          errorMessage={deleteError}
          onClose={closeDeleteModal}
          onConfirm={() =>
            void confirmDelete().then((success) => {
              if (success) {
                showToast(LISTA_USUARIOS_SUSPENSOS_MESSAGES.deleteSuccess, { variant: 'success' });
              }
            })
          }
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
    gap: 12,
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
