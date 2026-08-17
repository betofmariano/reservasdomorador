import type { ComponentProps } from 'react';

import { AuthTextField } from '@/components/auth-text-field';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type CadastroAdminFieldProps = Omit<
  ComponentProps<typeof AuthTextField>,
  'placeholderTextColor'
> & {
  error?: string | null;
  centered?: boolean;
};

export function CadastroAdminField({
  error = null,
  centered = false,
  style,
  ...props
}: CadastroAdminFieldProps) {
  return (
    <View style={styles.container}>
      <AuthTextField
        {...props}
        style={[centered && styles.centeredInput, style]}
        placeholderTextColor={MATCHPOINT_COLORS.placeholder}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  centeredInput: {
    textAlign: 'center',
  },
  errorText: {
    marginTop: -8,
    marginBottom: 8,
    fontSize: 13,
    color: MATCHPOINT_COLORS.error,
    fontWeight: '600',
  },
});
