import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { CadastroAdminField } from '@/components/cadastro-admin-field';
import { CadastroAdminFormCard } from '@/components/cadastro-admin-form-card';
import { ClubSelector } from '@/components/club-selector';
import { EditarAtividadeModal } from '@/components/editar-atividade-modal';
import { ExcluirCadastroModal } from '@/components/excluir-cadastro-modal';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAppDialog } from '@/contexts/app-dialog-context';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import { useCadastroAtividadesScreen } from '@/hooks/use-cadastro-atividades-screen';
import type { Atividade } from '@/types/atividade';
import { CLUB_ADMIN_MESSAGES } from '@/utils/club-config';
import type { UpdateAtividadePayload } from '@/utils/atividade-form';
import { MATCHPOINT_COLORS } from '@/constants/theme';

const COLORS = {
  background: MATCHPOINT_COLORS.background,
  blue: MATCHPOINT_COLORS.blue,
  navy: MATCHPOINT_COLORS.navy,
  border: MATCHPOINT_COLORS.borderLight,
  error: MATCHPOINT_COLORS.error,
  muted: MATCHPOINT_COLORS.muted,
};

export default function CadastroAtividadesScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { confirm } = useAppDialog();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();

  const [atividadeToDelete, setAtividadeToDelete] = useState<Atividade | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [atividadeToEdit, setAtividadeToEdit] = useState<Atividade | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const {
    availableClubs,
    selectedClubId,
    atividadeValue,
    fieldError,
    atividades,
    isLoadingClubs,
    clubsLoadError,
    isLoadingClub,
    clubLoadError,
    isLoadingItems,
    itemsLoadError,
    isRefreshing,
    isSaving,
    isUpdating,
    isDeleting,
    isAdministrador,
    canManageSelectedClub,
    showClubSelector,
    loadedClub,
    hasUnsavedInput,
    setSelectedClubId,
    handleAtividadeChange,
    fetchAvailableClubs,
    fetchClubDetails,
    fetchAtividades,
    saveAtividade,
    updateAtividadeItem,
    removeAtividade,
    messages,
  } = useCadastroAtividadesScreen({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  useEffect(() => {
    if (isAuthLoading || !user || isLoadingClubs) {
      return;
    }

    if (!isAdministrador && availableClubs.length === 0 && !clubsLoadError) {
      showToast(CLUB_ADMIN_MESSAGES.permission, { variant: 'error' });
      router.replace('/');
    }
  }, [
    availableClubs.length,
    clubsLoadError,
    isAdministrador,
    isAuthLoading,
    isLoadingClubs,
    router,
    showToast,
    user,
  ]);

  useEffect(() => {
    if (!clubLoadError || clubLoadError === CLUB_ADMIN_MESSAGES.loadError) {
      return;
    }

    if (clubLoadError === CLUB_ADMIN_MESSAGES.permission) {
      showToast(clubLoadError, { variant: 'error' });
      router.replace('/');
    }
  }, [clubLoadError, router, showToast]);

  function navigateBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }

  async function handleCancel() {
    if (isSaving || isUpdating || isDeleting) {
      return;
    }

    if (!hasUnsavedInput) {
      navigateBack();
      return;
    }

    const confirmed = await confirm({
      title: CLUB_ADMIN_MESSAGES.unsavedTitle,
      message: CLUB_ADMIN_MESSAGES.unsavedMessage,
      cancelLabel: 'Continuar editando',
      confirmLabel: 'Sair',
      destructive: true,
    });

    if (confirmed) {
      navigateBack();
    }
  }

  async function handleSave() {
    const error = await saveAtividade();

    if (error) {
      showToast(error, { variant: 'error' });
      return;
    }

    showToast(messages.saveSuccess, { variant: 'success' });
  }

  function handleDeletePress(item: Atividade) {
    setDeleteError(null);
    setAtividadeToDelete(item);
  }

  function handleEditPress(item: Atividade) {
    setEditError(null);
    setAtividadeToEdit(item);
  }

  function handleCloseEditModal() {
    if (isUpdating) {
      return;
    }

    setAtividadeToEdit(null);
    setEditError(null);
  }

  async function handleConfirmEdit(payload: UpdateAtividadePayload) {
    if (!atividadeToEdit) {
      return;
    }

    const error = await updateAtividadeItem(atividadeToEdit, payload);

    if (error) {
      setEditError(error);
      return;
    }

    setAtividadeToEdit(null);
    setEditError(null);
    showToast(messages.updateSuccess, { variant: 'success' });
  }

  async function handleConfirmDelete() {
    if (!atividadeToDelete) {
      return;
    }

    const error = await removeAtividade(atividadeToDelete);

    if (error) {
      setDeleteError(error);
      return;
    }

    setAtividadeToDelete(null);
    showToast(messages.deleteSuccess, { variant: 'success' });
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

  const isFormDisabled = isLoadingClub || isLoadingClubs || !canManageSelectedClub;
  const showContent =
    !isLoadingClub && !clubLoadError && canManageSelectedClub && selectedClubId != null;
  const canEditActivityInput = showContent && !isSaving && !isUpdating && !isDeleting;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={WEB_MAX_CONTENT_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title={'Cadastro de\nAtividades'} />
        <ScreenHeaderDivider />

        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              showContent ? (
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => void fetchAtividades({ refreshing: true })}
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
                disabled={isSaving || isUpdating || isDeleting}
                label="Escolha o local"
                placeholder="Selecione o local"
                modalTitle="Escolha o local"
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

            {clubLoadError === CLUB_ADMIN_MESSAGES.loadError ? (
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

            {showContent ? (
              <CadastroAdminFormCard
                title="Cadastrar Atividade"
                onCancel={handleCancel}
                onSave={() => void handleSave()}
                isSaving={isSaving}
                disabled={isFormDisabled || isSaving || isUpdating || isDeleting}
                canSave={atividadeValue.trim().length > 0}>
                <CadastroAdminField
                  label="Atividade"
                  value={atividadeValue}
                  onChangeText={handleAtividadeChange}
                  error={fieldError}
                  editable={canEditActivityInput}
                />
              </CadastroAdminFormCard>
            ) : null}

            {showContent ? (
              <View style={styles.listSection}>
                {isLoadingItems ? (
                  <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={COLORS.blue} />
                  </View>
                ) : itemsLoadError ? (
                  <View style={styles.centerContent}>
                    <Text style={styles.errorText}>{itemsLoadError}</Text>
                    <Pressable style={styles.retryButton} onPress={() => void fetchAtividades()}>
                      <Text style={styles.retryText}>Tentar novamente</Text>
                    </Pressable>
                  </View>
                ) : atividades.length === 0 ? (
                  <Text style={styles.emptyText}>{messages.emptyList}</Text>
                ) : (
                  atividades.map((item) => (
                    <View key={item.id} style={styles.row}>
                      <Text style={styles.rowLabel}>{item.atividade}</Text>
                      <View style={styles.rowActions}>
                        <Pressable
                          style={styles.actionButton}
                          onPress={() => handleEditPress(item)}
                          disabled={isDeleting || isSaving || isUpdating}
                          accessibilityLabel="Editar atividade">
                          <Ionicons name="create-outline" size={18} color={COLORS.blue} />
                        </Pressable>
                        {item.qtdeHorarios === 0 ? (
                          <Pressable
                            style={styles.actionButton}
                            onPress={() => handleDeletePress(item)}
                            disabled={isDeleting || isSaving || isUpdating}
                            accessibilityLabel="Excluir atividade">
                            <Ionicons name="trash-outline" size={18} color={COLORS.blue} />
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>

        <EditarAtividadeModal
          visible={atividadeToEdit != null}
          atividade={atividadeToEdit}
          isSaving={isUpdating}
          errorMessage={editError}
          onClose={handleCloseEditModal}
          onSave={handleConfirmEdit}
        />

        <ExcluirCadastroModal
          visible={atividadeToDelete != null}
          title="Excluir atividade"
          message="Deseja realmente excluir esta atividade?"
          isDeleting={isDeleting}
          errorMessage={deleteError}
          onClose={() => {
            if (!isDeleting) {
              setAtividadeToDelete(null);
              setDeleteError(null);
            }
          }}
          onConfirm={() => void handleConfirmDelete()}
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
  keyboardAvoiding: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  localTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.blue,
    marginBottom: 16,
  },
  listSection: {
    marginTop: 8,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    minHeight: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: '100%',
  },
  rowLabel: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'left',
    paddingRight: 12,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
    fontWeight: '600',
    textAlign: 'center',
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
