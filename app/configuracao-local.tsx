import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AcademiaConfigForm } from '@/components/academia-config-form';
import { ClubSelector } from '@/components/club-selector';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import { useConfiguracaoLocalScreen } from '@/hooks/use-configuracao-local-screen';
import { LOCAL_CONFIG_MESSAGES } from '@/utils/academia-form';
import { openExternalLink } from '@/utils/publicidade-links';

const COLORS = {
  background: '#FFFFFF',
  blue: '#2456A8',
  error: '#D64545',
  muted: '#5C6475',
};

export default function ConfiguracaoLocalScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const {
    availableClubs,
    selectedClubId,
    values,
    errors,
    isLoadingClubs,
    clubsLoadError,
    isLoadingClub,
    clubLoadError,
    isSaving,
    isAdministrador,
    canManageSelectedClub,
    showClubSelector,
    loadedAcademia,
    hasChanges,
    regulamentoUrl,
    setSelectedClubId,
    handleChange,
    fetchAvailableClubs,
    fetchClubDetails,
    saveLocalConfiguration,
  } = useConfiguracaoLocalScreen({
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
      showToast(LOCAL_CONFIG_MESSAGES.permissionView, { variant: 'error' });
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
    if (!clubLoadError || clubLoadError === LOCAL_CONFIG_MESSAGES.loadError) {
      return;
    }

    if (clubLoadError === LOCAL_CONFIG_MESSAGES.permissionView) {
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

  function handleCancel() {
    if (isSaving) {
      return;
    }

    if (!hasChanges) {
      navigateBack();
      return;
    }

    const confirmExit = () => navigateBack();

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(LOCAL_CONFIG_MESSAGES.unsavedMessage)) {
        confirmExit();
      }

      return;
    }

    Alert.alert(LOCAL_CONFIG_MESSAGES.unsavedTitle, LOCAL_CONFIG_MESSAGES.unsavedMessage, [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: confirmExit },
    ]);
  }

  async function handleSubmit() {
    const error = await saveLocalConfiguration();

    if (error) {
      showToast(error, { variant: 'error' });
      return;
    }

    showToast(LOCAL_CONFIG_MESSAGES.updateSuccess, { variant: 'success' });
  }

  async function handleViewRegulamento() {
    if (!regulamentoUrl) {
      return;
    }

    const error = await openExternalLink(regulamentoUrl);

    if (error) {
      showToast(LOCAL_CONFIG_MESSAGES.regulamentoOpenError, { variant: 'error' });
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

  const isFormDisabled = isLoadingClub || isLoadingClubs || !canManageSelectedClub;
  const showForm = !isLoadingClub && !clubLoadError && canManageSelectedClub && selectedClubId != null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={WEB_MAX_CONTENT_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title={'Configuração\ndo Local'} />
        <ScreenHeaderDivider />

        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
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
                disabled={isSaving || isLoadingClub}
                label="Escolha o local"
                placeholder="Selecione o local"
                modalTitle="Escolha o local"
              />
            ) : null}

            {!isLoadingClubs && !clubsLoadError && !showClubSelector && loadedAcademia ? (
              <Text style={styles.localTitle}>{loadedAcademia.nome}</Text>
            ) : null}

            {isLoadingClub ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={COLORS.blue} />
              </View>
            ) : null}

            {clubLoadError === LOCAL_CONFIG_MESSAGES.loadError ? (
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

            {showForm ? (
              <AcademiaConfigForm
                values={values}
                errors={errors}
                isSubmitting={isSaving}
                disabled={isFormDisabled}
                regulamentoUrl={regulamentoUrl}
                onChange={handleChange}
                onViewRegulamento={() => void handleViewRegulamento()}
                onCancel={handleCancel}
                onSubmit={() => void handleSubmit()}
              />
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    minHeight: 160,
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
  localTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.blue,
    marginBottom: 16,
  },
});
