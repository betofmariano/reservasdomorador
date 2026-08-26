import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AcessoDetalhesModal } from '@/components/acesso-detalhes-modal';
import { AcessoListItem } from '@/components/acesso-list-item';
import { AdminTableScrollContainer } from '@/components/admin-table-scroll-container';
import { ExcluirCadastroModal } from '@/components/excluir-cadastro-modal';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { WEB_MAX_WIDE_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import {
  type ListaRegistrosVariant,
  useListaRegistrosScreen,
} from '@/hooks/use-lista-acessos-screen';
import type { Acesso } from '@/types/acesso';

const COLORS = {
  background: '#FFFFFF',
  navy: '#3A2154',
  blue: '#0F7A6C',
  error: '#D64545',
  muted: '#5C6475',
  border: '#D5DAE3',
  highlight: '#FFF4D6',
};

const TABLE_MIN_WIDTH_LOGINS = 1082;
const TABLE_MIN_WIDTH_ACESSOS = 1090;
const COL_NOME_WIDTH = 221;
const COL_PAGINA_WIDTH = 237;
const COL_ROTINA_WIDTH = 234;

type ListaRegistrosScreenProps = {
  variant: ListaRegistrosVariant;
  title: string;
};

export function ListaRegistrosScreen({ variant, title }: ListaRegistrosScreenProps) {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();

  const [acessoSelecionado, setAcessoSelecionado] = useState<Acesso | null>(null);
  const [isDetalheVisible, setIsDetalheVisible] = useState(false);
  const [isLimparAcessosModalVisible, setIsLimparAcessosModalVisible] = useState(false);
  const [limparAcessosError, setLimparAcessosError] = useState<string | null>(null);
  const [isBatchDeleteModalVisible, setIsBatchDeleteModalVisible] = useState(false);
  const [batchDeleteError, setBatchDeleteError] = useState<string | null>(null);

  const isAdministrador = user?.administrador === true;

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    if (!isAdministrador) {
      router.replace('/');
    }
  }, [isAdministrador, isAuthLoading, router, user]);

  const {
    acessos,
    isLoading,
    isRefreshing,
    loadError,
    searchQuery,
    sortField,
    sortDirection,
    isDeleting,
    isClearingRecentAcessos,
    setSearchQuery,
    fetchAcessos,
    handleSortFieldChange,
    deleteAcesso,
    deleteAcessosEmLote,
    limparAcessos24Horas,
    messages,
  } = useListaRegistrosScreen({
    variant,
    isAdministrador,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  function handleAcessoPress(acesso: Acesso) {
    console.log('Registro selecionado:', Boolean(acesso?.id));
    setAcessoSelecionado(acesso);
    setIsDetalheVisible(true);
  }

  async function handleDeletePress(acesso: Acesso) {
    if (isDeleting) {
      return;
    }

    const error = await deleteAcesso(acesso.id);

    if (error) {
      showToast(error, { variant: 'error' });
    }
  }

  function handleOpenBatchDeleteModal() {
    if (isDeleting || isClearingRecentAcessos || acessos.length === 0) {
      return;
    }

    setBatchDeleteError(null);
    setIsBatchDeleteModalVisible(true);
  }

  function handleCloseBatchDeleteModal() {
    if (isDeleting) {
      return;
    }

    setIsBatchDeleteModalVisible(false);
    setBatchDeleteError(null);
  }

  async function handleConfirmBatchDelete() {
    const error = await deleteAcessosEmLote(acessos.map((acesso) => acesso.id));

    if (error) {
      setBatchDeleteError(error);
      return;
    }

    setIsBatchDeleteModalVisible(false);
  }

  function handleOpenLimparAcessosModal() {
    if (isClearingRecentAcessos || isDeleting) {
      return;
    }

    setLimparAcessosError(null);
    setIsLimparAcessosModalVisible(true);
  }

  function handleCloseLimparAcessosModal() {
    if (isClearingRecentAcessos) {
      return;
    }

    setIsLimparAcessosModalVisible(false);
    setLimparAcessosError(null);
  }

  async function handleConfirmLimparAcessos() {
    const error = await limparAcessos24Horas();

    if (error) {
      setLimparAcessosError(error);
      return;
    }

    setIsLimparAcessosModalVisible(false);
  }

  function handleCloseDetalhe() {
    setIsDetalheVisible(false);
    setAcessoSelecionado(null);
  }

  if (isAuthLoading || !user || !isAdministrador) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer maxWidth={WEB_MAX_WIDE_CONTENT_WIDTH}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.blue} />
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  const showList = !isLoading && !loadError && acessos.length > 0;

  const swapPaginaRotinaColumns = variant === 'acessos';
  const isAcessosVariant = variant === 'acessos';
  const tableMinWidth = isAcessosVariant ? TABLE_MIN_WIDTH_ACESSOS : TABLE_MIN_WIDTH_LOGINS;

  const tableHeader = (
    <View style={[styles.tableHeader, { width: tableMinWidth, minWidth: tableMinWidth }]}>
      <View style={styles.deleteHeaderSpacer} />
      <Text style={[styles.tableHeaderText, styles.colCreated]}>Data/hora</Text>
      <Text style={[styles.tableHeaderText, styles.colLocal]}>Local</Text>
      <Text style={[styles.tableHeaderText, styles.colNome]}>Nome</Text>
      {swapPaginaRotinaColumns ? (
        <>
          <Text style={[styles.tableHeaderText, styles.colRotina]}>Rotina</Text>
          <Text style={[styles.tableHeaderText, styles.colPagina]}>Página</Text>
        </>
      ) : (
        <>
          <Text style={[styles.tableHeaderText, styles.colPagina]}>Página</Text>
          <Text style={[styles.tableHeaderText, styles.colRotina]}>Rotina</Text>
        </>
      )}
    </View>
  );

  function renderListItem({ item }: { item: Acesso }) {
    return (
      <AcessoListItem
        acesso={item}
        variant={variant}
        swapPaginaRotinaColumns={swapPaginaRotinaColumns}
        onPress={() => handleAcessoPress(item)}
        onDeletePress={() => void handleDeletePress(item)}
      />
    );
  }

  const listElement = (
    <FlatList
      style={[styles.list, { width: tableMinWidth }]}
      data={showList ? acessos : []}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={showList ? tableHeader : null}
      renderItem={renderListItem}
      contentContainerStyle={[styles.scrollContent, { minWidth: tableMinWidth }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void fetchAcessos({ refreshing: true })}
          tintColor={COLORS.blue}
          colors={[COLORS.blue]}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={WEB_MAX_WIDE_CONTENT_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title={title} />
        <ScreenHeaderDivider />

        <View style={styles.toolbar}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Filtrar"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.sortToolbarRow}>
            <View style={styles.listActionsRow}>
              {acessos.length > 0 ? (
                <Pressable
                  style={[
                    styles.batchDeleteButton,
                    (isDeleting || isClearingRecentAcessos) && styles.batchDeleteButtonDisabled,
                  ]}
                  disabled={isDeleting || isClearingRecentAcessos}
                  onPress={handleOpenBatchDeleteModal}>
                  <Text style={styles.batchDeleteButtonText}>
                    Excluir filtrados ({acessos.length})
                  </Text>
                </Pressable>
              ) : null}

              {variant === 'acessos' ? (
                <>
                  <Pressable
                    style={[
                      styles.clearAcessosButton,
                      (isDeleting || isClearingRecentAcessos) && styles.clearAcessosButtonDisabled,
                    ]}
                    disabled={isDeleting || isClearingRecentAcessos}
                    onPress={handleOpenLimparAcessosModal}>
                    <Text style={styles.clearAcessosButtonText}>Limpar Acessos 24 hs</Text>
                  </Pressable>
                  <Pressable
                    style={styles.switchListButton}
                    onPress={() => router.push('/lista-logins')}>
                    <Text style={styles.switchListButtonText}>Lista de Logins</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={styles.switchListButton}
                  onPress={() => router.push('/lista-acessos')}>
                  <Text style={styles.switchListButtonText}>Lista de Acessos</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.sortRow}>
              <Pressable
                style={[styles.sortButton, sortField === 'id' && styles.sortButtonActive]}
                onPress={() => handleSortFieldChange('id')}>
                <Text
                  style={[styles.sortButtonText, sortField === 'id' && styles.sortButtonTextActive]}>
                  Id{sortField === 'id' ? (sortDirection === 'desc' ? ' ↓' : ' ↑') : ''}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {isLoading && !isRefreshing ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.blue} />
          </View>
        ) : null}

        {loadError ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable style={styles.retryButton} onPress={() => void fetchAcessos()}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !loadError && acessos.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>{messages.empty}</Text>
          </View>
        ) : null}

        {showList ? (
          <AdminTableScrollContainer minWidth={tableMinWidth}>{listElement}</AdminTableScrollContainer>
        ) : null}

        <AcessoDetalhesModal
          visible={isDetalheVisible}
          acesso={acessoSelecionado}
          onClose={handleCloseDetalhe}
        />

        {variant === 'acessos' ? (
          <ExcluirCadastroModal
            visible={isLimparAcessosModalVisible}
            title={messages.clearAcessosConfirmTitle}
            message={messages.clearAcessosConfirmMessage}
            isDeleting={isClearingRecentAcessos}
            errorMessage={limparAcessosError}
            onClose={handleCloseLimparAcessosModal}
            onConfirm={() => void handleConfirmLimparAcessos()}
          />
        ) : null}

        <ExcluirCadastroModal
          visible={isBatchDeleteModalVisible}
          title={messages.batchDeleteConfirmTitle}
          message={messages.batchDeleteConfirmMessage(acessos.length)}
          isDeleting={isDeleting}
          errorMessage={batchDeleteError}
          onClose={handleCloseBatchDeleteModal}
          onConfirm={() => void handleConfirmBatchDelete()}
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
  list: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  toolbar: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  searchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.navy,
    backgroundColor: COLORS.background,
  },
  sortToolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  listActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  batchDeleteButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 17,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  batchDeleteButtonDisabled: {
    opacity: 0.6,
  },
  batchDeleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  switchListButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: COLORS.background,
  },
  switchListButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.blue,
    textAlign: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  sortButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  sortButtonActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  clearAcessosButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 17,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  clearAcessosButtonDisabled: {
    opacity: 0.6,
  },
  clearAcessosButtonText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: COLORS.highlight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: TABLE_MIN_WIDTH_ACESSOS,
    minWidth: TABLE_MIN_WIDTH_ACESSOS,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  deleteHeaderSpacer: {
    width: 32,
    flexShrink: 0,
  },
  colCreated: {
    width: 148,
    flexShrink: 0,
  },
  colLocal: {
    width: 150,
    flexShrink: 0,
  },
  colNome: {
    width: COL_NOME_WIDTH,
    flexShrink: 0,
  },
  colPagina: {
    width: COL_PAGINA_WIDTH,
    flexShrink: 0,
  },
  colRotina: {
    width: COL_ROTINA_WIDTH,
    flexShrink: 0,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: 200,
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
