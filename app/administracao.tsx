import { useCallback, useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AdministracaoMenu } from '@/components/administracao-menu';
import { MenuActionButton } from '@/components/menu-action-button';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAuth } from '@/contexts/auth-context';
import { useUserContext } from '@/contexts/user-context';
import { useAdministracaoMenuAccess } from '@/hooks/use-administracao-menu-access';
import {
  getAdministracaoMenuButtonWidth,
  getAdministracaoScreenMaxWidth,
  isAdministracaoWideLayout,
} from '@/utils/administracao-menu-layout';
import { getHomeMenuButtonMetrics } from '@/utils/home-menu-button';

const COLORS = {
  background: MATCHPOINT_COLORS.background,
  blue: MATCHPOINT_COLORS.blue,
};

export default function AdministracaoScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { permissions } = useUserContext();
  const administracaoAccess = useAdministracaoMenuAccess(user);
  const { canAccess, isCheckingAccess } = administracaoAccess;
  const isWideLayout = isAdministracaoWideLayout(width);
  const screenMaxWidth = getAdministracaoScreenMaxWidth(width, { useGestaoTwoColumns: isWideLayout });
  const buttonWidth = getAdministracaoMenuButtonWidth(width);
  const menuButtonMetrics = getHomeMenuButtonMetrics(width);

  const navigateBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }, [router]);

  useEffect(() => {
    if (isAuthLoading || !user || isCheckingAccess) {
      return;
    }

    if (!canAccess) {
      router.replace('/');
    }
  }, [canAccess, isAuthLoading, isCheckingAccess, router, user]);

  if (isAuthLoading || !user || isCheckingAccess || !canAccess) {
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={screenMaxWidth} style={styles.screenContainer}>
        <ScreenHeader
          user={user}
          title={permissions.administrador ? 'Administração' : 'Gestão'}
        />
        <ScreenHeaderDivider />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <AdministracaoMenu user={user} access={administracaoAccess} />

          <MenuActionButton
            label="Voltar"
            backgroundColor={MATCHPOINT_COLORS.voltarButtonBackground}
            textColor={MATCHPOINT_COLORS.blue}
            width={buttonWidth}
            fontSize={Math.max(menuButtonMetrics.fontSize, 18)}
            buttonHeight={menuButtonMetrics.buttonHeight}
            paddingHorizontal={menuButtonMetrics.paddingHorizontal}
            style={styles.backButton}
            onPress={navigateBack}
          />
        </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    minHeight: 160,
  },
  backButton: {
    marginTop: 24,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: MATCHPOINT_COLORS.blue,
  },
});
