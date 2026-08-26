import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ClubSelectionModal } from '@/components/club-selection-modal';
import { ASSOCIACAO_LOCAL_LABELS } from '@/constants/associacao-local-labels';
import type { Academia } from '@/types/academia';
import { sortByClubNome } from '@/utils/club-sort';

type AcademiaSelectorProps = {
  academias: Academia[];
  value: number | null;
  onChange: (academiaId: number) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
  label?: string;
  hideLabel?: boolean;
  placeholder?: string;
  modalTitle?: string;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
};

export function AcademiaSelector({
  academias,
  value,
  onChange,
  isLoading = false,
  error = null,
  onRetry,
  disabled = false,
  label = ASSOCIACAO_LOCAL_LABELS.informe,
  hideLabel = false,
  placeholder = ASSOCIACAO_LOCAL_LABELS.selecione,
  modalTitle = ASSOCIACAO_LOCAL_LABELS.selecioneTitulo,
}: AcademiaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sortedAcademias = useMemo(() => sortByClubNome(academias), [academias]);
  const selectedAcademia = academias.find((academia) => academia.id === value);
  const isDisabled = disabled || isLoading || !!error || academias.length === 0;

  return (
    <View style={[styles.container, hideLabel && styles.containerCompact]}>
      {hideLabel ? null : <Text style={styles.label}>{label}</Text>}

      <Pressable
        style={[styles.selector, isDisabled && styles.selectorDisabled]}
        onPress={() => setIsOpen(true)}
        disabled={isDisabled}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.blue} />
            <Text style={styles.loadingText}>{ASSOCIACAO_LOCAL_LABELS.carregando}</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.selectorText, !selectedAcademia && styles.placeholder]} numberOfLines={1}>
              {selectedAcademia?.nome || placeholder}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.navy} />
          </>
        )}
      </Pressable>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} style={styles.retryButton}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <ClubSelectionModal
        visible={isOpen}
        title={modalTitle}
        onClose={() => setIsOpen(false)}
        scrollable={sortedAcademias.length > 8}>
        {sortedAcademias.map((academia) => (
          <Pressable
            key={academia.id}
            style={styles.option}
            onPress={() => {
              onChange(academia.id);
              setIsOpen(false);
            }}>
            <Text style={styles.optionText}>{academia.nome}</Text>
          </Pressable>
        ))}
      </ClubSelectionModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '100%',
    marginBottom: 16,
    overflow: 'hidden',
  },
  containerCompact: {
    marginBottom: 0,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 8,
  },
  selector: {
    width: '100%',
    maxWidth: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  selectorDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.navy,
  },
  selectorText: {
    fontSize: 16,
    color: COLORS.navy,
    flex: 1,
    minWidth: 0,
  },
  placeholder: {
    color: '#9AA0A6',
  },
  errorContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#D64545',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  retryText: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  optionText: {
    fontSize: 15,
    color: COLORS.blue,
  },
});
