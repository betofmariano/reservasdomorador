import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  background: '#FFFFFF',
  navy: '#2B3674',
  button: '#0000FF',
  white: '#FFFFFF',
};

export default function NotFoundScreen() {
  const router = useRouter();

  function handleGoHome() {
    router.replace('/');
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Oops! erro 404' }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Oops! erro 404</Text>

          <Text style={styles.description}>
            A página que você está{'\n'}procurando não existe.
          </Text>

          <Pressable
            style={styles.button}
            onPress={handleGoHome}
            accessibilityRole="button"
            accessibilityLabel="Ir para a página inicial">
            <Text style={styles.buttonText}>Ir para a página inicial</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.navy,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 36,
  },
  button: {
    minWidth: 260,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: COLORS.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
});
