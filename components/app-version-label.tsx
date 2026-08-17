import { Platform, StyleSheet, Text } from 'react-native';

import { APP_BUILD, APP_VERSION } from '@/constants/app-version';

type AppVersionLabelProps = {
  centered?: boolean;
};

export function AppVersionLabel({ centered = false }: AppVersionLabelProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <Text style={[styles.text, centered && styles.textCentered]}>
      Versão {APP_VERSION} · Build {APP_BUILD}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 11,
    color: '#8A93A3',
    lineHeight: 16,
  },
  textCentered: {
    textAlign: 'center',
  },
});
