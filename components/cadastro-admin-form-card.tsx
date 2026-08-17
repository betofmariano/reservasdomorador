import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { MATCHPOINT_COLORS } from '@/constants/theme';

type CadastroAdminFormCardProps = {
  title: string;
  children: ReactNode;
  onCancel: () => void;
  onSave: () => void;
  cancelLabel?: string;
  isSaving?: boolean;
  saveLabel?: string;
  savingLabel?: string;
  disabled?: boolean;
  canSave?: boolean;
};

export function CadastroAdminFormCard({
  title,
  children,
  onCancel,
  onSave,
  cancelLabel = 'Encerrar',
  isSaving = false,
  saveLabel = 'Salvar',
  savingLabel = 'Salvando...',
  disabled = false,
  canSave = false,
}: CadastroAdminFormCardProps) {
  const isSaveDisabled = disabled || isSaving || !canSave;

  return (
    <View style={styles.form}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.divider} />

      <View style={styles.fields}>{children}</View>

      <View style={styles.actions}>
        <AuthButton
          label={cancelLabel}
          variant="outline"
          onPress={onCancel}
          disabled={isSaving}
        />
        <AuthButton
          label={isSaving ? savingLabel : saveLabel}
          onPress={onSave}
          disabled={isSaveDisabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    marginBottom: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 2,
    backgroundColor: MATCHPOINT_COLORS.accent,
    marginBottom: 16,
    borderRadius: 1,
  },
  fields: {
    gap: 4,
  },
  actions: {
    gap: 12,
    marginTop: 20,
  },
});
