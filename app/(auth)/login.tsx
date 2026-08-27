import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AuthTabSwitcher, type AuthTab } from '@/components/auth-tab-switcher';
import { AppVersionLabel } from '@/components/app-version-label';
import { LoginForm } from '@/components/login-form';
import { MatchPlaceLogo } from '@/components/matchplace-logo';
import { SignupForm } from '@/components/signup-form';
import { WebScreenContainer } from '@/components/web-screen-container';
import { useAuth } from '@/contexts/auth-context';
import { navigateToHome } from '@/utils/auth-navigation';

const COLORS = {
  background: '#FFFFFF',
  navy: '#3A2154',
  muted: '#5C6475',
};

function parseAuthTab(value: string | string[] | undefined): AuthTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return tab === 'signup' ? 'signup' : 'login';
}

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<AuthTab>(() => parseAuthTab(tab));
  const [isFormBusy, setIsFormBusy] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      return;
    }

    navigateToHome(router);
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    setActiveTab(parseAuthTab(tab));
  }, [tab]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardInset(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const subtitle =
    activeTab === 'signup' ? 'Preencha os dados para criar sua conta' : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <WebScreenContainer style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            keyboardInset > 0 && { paddingBottom: 40 + keyboardInset },
          ]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}>
          <View style={styles.logoBlock}>
            <MatchPlaceLogo size="large" style={styles.logo} />
          </View>

          <AuthTabSwitcher
            value={activeTab}
            onChange={setActiveTab}
            disabled={isFormBusy}
          />

          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={[styles.tabPanel, activeTab !== 'login' && styles.tabPanelHidden]}>
            <LoginForm onSubmittingChange={setIsFormBusy} />
          </View>

          <View style={[styles.tabPanel, activeTab !== 'signup' && styles.tabPanelHidden]}>
            <SignupForm onSubmittingChange={setIsFormBusy} />
          </View>

          <View style={styles.versionLabelContainer}>
            <AppVersionLabel centered />
          </View>
        </ScrollView>

        {isFormBusy ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={COLORS.navy} />
          </View>
        ) : null}
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 40,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    marginBottom: 0,
  },
  subtitle: {
    width: '100%',
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  tabPanel: {
    width: '100%',
  },
  tabPanelHidden: {
    display: 'none',
  },
  versionLabelContainer: {
    width: '100%',
    marginTop: 24,
    paddingTop: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
