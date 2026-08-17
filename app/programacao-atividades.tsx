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
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { ExcluirCadastroModal } from '@/components/excluir-cadastro-modal';
import { EditarAtividadeProgramadaModal } from '@/components/programacao-atividades/editar-atividade-programada-modal';
import { ProgramacaoAtividadesCard } from '@/components/programacao-atividades/programacao-atividades-card';
import { ProgramacaoAtividadesFiltros } from '@/components/programacao-atividades/programacao-atividades-filtros';
import {
  PROGRAMACAO_ATIVIDADES_TABLE_MIN_WIDTH,
  ProgramacaoAtividadesListHeader,
} from '@/components/programacao-atividades/programacao-atividades-list-header';
import { ProgramacaoAtividadesResumo } from '@/components/programacao-atividades/programacao-atividades-resumo';
import { ProgramacaoAtividadesRow } from '@/components/programacao-atividades/programacao-atividades-row';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { PROGRAMACAO_ATIVIDADES_REPORT_WIDTH, WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAuth } from '@/contexts/auth-context';
import {
  PROGRAMACAO_ATIVIDADES_MESSAGES,
  useProgramacaoAtividadesScreen,
} from '@/hooks/use-programacao-atividades-screen';
import type { AtividadeProgramada } from '@/types/atividade-programada';
import { getRelatorioMinStartDate } from '@/utils/lista-reservas-atividade';
import { getProgramacaoMaxSelectableDate } from '@/utils/programacao-atividades';

const COLORS = {
  background: '#FFFFFF',
  navy: '#1B2B4B',
  blue: '#2456A8',
  error: '#D64545',
  muted: '#5C6475',
};

type ActiveDateField = 'startDate' | null;

export default function ProgramacaoAtividadesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();
  const isCompact = width <= WEB_MAX_CONTENT_WIDTH;
  const [activeDateField, setActiveDateField] = useState<ActiveDateField>(null);

  const minStartDate = useMemo(() => getRelatorioMinStartDate(), []);
  const maxSelectableDate = useMemo(() => getProgramacaoMaxSelectableDate(), []);

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const {
    canAccess,
    requiresLocalSelection,
    isContextLoading,
    localNome,
    atividadesCarregadas,
    atividadesNoPeriodo,
    atividadesFiltradas,
    filtro,
    setFiltro,
    startDate,
    setStartDate,
    validationError,
    hasConsultado,
    isLoading,
    isRefreshing,
    loadError,
    itemToDelete,
    isDeleting,
    deleteError,
    setItemToDelete,
    closeDeleteModal,
    confirmDelete,
    itemToEdit,
    isSavingEdit,
    editError,
    setItemToEdit,
    closeEditModal,
    confirmEdit,
    consultarProgramacao,
    reload,
    retryLoad,
  } = useProgramacaoAtividadesScreen({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  function handleEditPress(item: AtividadeProgramada) {
    setItemToEdit(item);
  }

  function renderTableContent() {
    return (
      <>
        <ProgramacaoAtividadesListHeader />
        {atividadesFiltradas.map((item) => (
          <ProgramacaoAtividadesRow
            key={item.id}
            item={item}
            includeYear={!isCompact}
            onEditPress={() => handleEditPress(item)}
            onDeletePress={() => setItemToDelete(item)}
          />
        ))}
      </>
    );
  }

  function renderListItem({ item }: { item: AtividadeProgramada }) {
    if (isCompact) {
      return (
        <ProgramacaoAtividadesCard
          item={item}
          onEditPress={() => handleEditPress(item)}
          onDeletePress={() => setItemToDelete(item)}
        />
      );
    }

    return null;
  }

  const listHeader = (
    <View>
      {localNome ? <Text style={styles.localLabel}>Local: {localNome}</Text> : null}

      <ProgramacaoAtividadesFiltros
        value={filtro}
        onChange={setFiltro}
        startDate={startDate}
        onPressStartDate={() => setActiveDateField('startDate')}
        validationError={validationError}
        isConsultando={isLoading || isRefreshing}
        onConsultar={consultarProgramacao}
      />

      {hasConsultado && !isLoading && !loadError ? (
        <ProgramacaoAtividadesResumo
          total={atividadesNoPeriodo.length}
          exibindo={atividadesFiltradas.length}
          hasFiltro={filtro.trim().length > 0}
        />
      ) : null}

      {isLoading && atividadesCarregadas.length === 0 ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator size="small" color={COLORS.blue} />
          <Text style={styles.inlineLoadingText}>{PROGRAMACAO_ATIVIDADES_MESSAGES.loading}</Text>
        </View>
      ) : null}

      {loadError ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable style={styles.linkButton} onPress={() => void retryLoad()}>
            <Text style={styles.linkButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && !loadError && atividadesCarregadas.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.messageText}>{PROGRAMACAO_ATIVIDADES_MESSAGES.empty}</Text>
        </View>
      ) : null}

      {hasConsultado &&
      !isLoading &&
      !loadError &&
      atividadesCarregadas.length > 0 &&
      atividadesNoPeriodo.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.messageText}>{PROGRAMACAO_ATIVIDADES_MESSAGES.emptyPeriodo}</Text>
        </View>
      ) : null}

      {hasConsultado &&
      !isLoading &&
      !loadError &&
      atividadesNoPeriodo.length > 0 &&
      atividadesFiltradas.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.messageText}>Nenhuma atividade encontrada para o filtro informado.</Text>
        </View>
      ) : null}

      {!isCompact && !isLoading && !loadError && atividadesFiltradas.length > 0 ? (
        <AdminTableScrollContainer
          minWidth={PROGRAMACAO_ATIVIDADES_TABLE_MIN_WIDTH}
          maxWidth={PROGRAMACAO_ATIVIDADES_REPORT_WIDTH}>
          {renderTableContent()}
        </AdminTableScrollContainer>
      ) : null}
    </View>
  );

  if (isAuthLoading || isContextLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer maxWidth={PROGRAMACAO_ATIVIDADES_REPORT_WIDTH}>
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
        <WebScreenContainer maxWidth={PROGRAMACAO_ATIVIDADES_REPORT_WIDTH} style={styles.screenContainer}>
          <ScreenHeader user={user} title="Programação de Atividades" />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{PROGRAMACAO_ATIVIDADES_MESSAGES.noLocal}</Text>
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
        <WebScreenContainer maxWidth={PROGRAMACAO_ATIVIDADES_REPORT_WIDTH} style={styles.screenContainer}>
          <ScreenHeader user={user} title="Programação de Atividades" />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{PROGRAMACAO_ATIVIDADES_MESSAGES.permission}</Text>
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={PROGRAMACAO_ATIVIDADES_REPORT_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title="Programação de Atividades" />
        <ScreenHeaderDivider />

        <FlatList
          data={isCompact && !isLoading && !loadError ? atividadesFiltradas : []}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderListItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                reload();
                consultarProgramacao();
              }}
              colors={[COLORS.blue]}
              tintColor={COLORS.blue}
            />
          }
        />

        <DatePickerSheet
          visible={activeDateField === 'startDate'}
          value={startDate}
          minimumDate={minStartDate}
          maximumDate={maxSelectableDate}
          onConfirm={setStartDate}
          onClose={() => setActiveDateField(null)}
        />

        <ExcluirCadastroModal
          visible={itemToDelete != null}
          title={PROGRAMACAO_ATIVIDADES_MESSAGES.deleteConfirmTitle}
          message={
            itemToDelete
              ? PROGRAMACAO_ATIVIDADES_MESSAGES.deleteConfirmMessage(itemToDelete)
              : ''
          }
          isDeleting={isDeleting}
          errorMessage={deleteError}
          onClose={closeDeleteModal}
          onConfirm={() => void confirmDelete()}
        />

        <EditarAtividadeProgramadaModal
          visible={itemToEdit != null}
          item={itemToEdit}
          isSaving={isSavingEdit}
          errorMessage={editError}
          onClose={closeEditModal}
          onSave={(capacidade) => void confirmEdit(capacidade)}
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
    paddingBottom: 8,
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
