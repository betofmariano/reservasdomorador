import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { AppVersionChecker } from '@/components/app-version-checker';
import { UserLocalSelectionGate } from '@/components/user-local-selection-gate';
import { AppDialogProvider } from '@/contexts/app-dialog-context';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { UserContextProvider } from '@/contexts/user-context';
import { AppToastProvider } from '@/contexts/app-toast-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { canUserAccessRoute, getActiveRouteName, isAuthRoute, isPublicUnauthenticatedRoute } from '@/utils/route-access';
import { HOME_ROUTE, LOGIN_ROUTE, navigateToHome } from '@/utils/auth-navigation';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading, isAuthenticated, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isNotFoundRoute = getActiveRouteName(segments) === '+not-found';

    if (isNotFoundRoute) {
      return;
    }

    const routeName = getActiveRouteName(segments);
    const inAuthGroup = isAuthRoute(segments);
    const isPublicPage = isPublicUnauthenticatedRoute(routeName);

    if (!isAuthenticated && !inAuthGroup && !isPublicPage) {
      router.replace(LOGIN_ROUTE);
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      navigateToHome(router);
      return;
    }

    if (isAuthenticated && (routeName === '' || routeName === 'index')) {
      router.replace(HOME_ROUTE);
      return;
    }

    if (isPublicPage) {
      return;
    }

    if (!isAuthenticated || !user) {
      return;
    }

    if (!canUserAccessRoute(user, routeName)) {
      navigateToHome(router);
    }
  }, [isAuthenticated, isLoading, router, segments, user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2456A8" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lista-reservas" />
        <Stack.Screen name="lista-reservas-atividade" />
        <Stack.Screen name="lista-reservas-periodo" />
        <Stack.Screen name="programacao-atividades" />
        <Stack.Screen name="mapa-frequencia" />
        <Stack.Screen name="relatorio-lista-espera" />
        <Stack.Screen name="lista-presenca" />
        <Stack.Screen name="lista-espera" />
        <Stack.Screen name="lista-espera-horarios" />
        <Stack.Screen name="minhas-reservas" />
        <Stack.Screen name="reservar-horario" />
        <Stack.Screen name="usuarios" />
        <Stack.Screen name="lista-acessos" />
        <Stack.Screen name="lista-logins" />
        <Stack.Screen name="lista-logados" />
        <Stack.Screen name="resumo-publicidade" />
        <Stack.Screen name="lista-usuarios-gestor" />
        <Stack.Screen name="lista-usuarios-suspensos" />
        <Stack.Screen name="configuracao-local" />
        <Stack.Screen name="cadastro-atividades" />
        <Stack.Screen name="cadastro-horarios" />
        <Stack.Screen name="mapa-horarios" />
        <Stack.Screen name="administracao" />
        <Stack.Screen name="meus-dados" />
        <Stack.Screen name="patrocinador" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <AppVersionChecker enabled={!isLoading} />
      <UserLocalSelectionGate />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <UserContextProvider>
        <AppDialogProvider>
          <AppToastProvider>
            <RootLayoutNav />
          </AppToastProvider>
        </AppDialogProvider>
      </UserContextProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
