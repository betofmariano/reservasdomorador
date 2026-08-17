import { StyleSheet, Text, View } from 'react-native';

import { AcademiaSelector } from '@/components/academia-selector';
import type { Academia } from '@/types/academia';

type GestorAcademiaSelectorFieldProps = {
  showAcademiaSelector: boolean;
  availableAcademias: Academia[];
  selectedAcademiaId: number | null;
  onChange: (academiasId: number) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
  localNome?: string | null;
  label?: string;
  hideLabel?: boolean;
  compact?: boolean;
  placeholder?: string;
  modalTitle?: string;
};

const COLORS = {
  muted: '#5C6475',
  navy: '#1B2B4B',
};

export function GestorAcademiaSelectorField({
  showAcademiaSelector,
  availableAcademias,
  selectedAcademiaId,
  onChange,
  isLoading = false,
  error = null,
  onRetry,
  disabled = false,
  localNome = null,
  label = 'Local',
  hideLabel = false,
  compact = false,
  placeholder = 'Selecione o local',
  modalTitle = 'Selecione o local',
}: GestorAcademiaSelectorFieldProps) {
  if (showAcademiaSelector) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <AcademiaSelector
          academias={availableAcademias}
          value={selectedAcademiaId}
          onChange={onChange}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          disabled={disabled}
          label={label}
          hideLabel={hideLabel}
          placeholder={placeholder}
          modalTitle={modalTitle}
        />
      </View>
    );
  }

  if (localNome) {
    return (
      <View style={[styles.readonlyField, compact && styles.containerCompact]}>
        {hideLabel ? null : <Text style={styles.readonlyLabel}>{label}</Text>}
        <Text style={styles.readonlyValue}>{localNome}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  containerCompact: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  readonlyField: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 6,
  },
  readonlyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },
  readonlyValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.navy,
  },
});
