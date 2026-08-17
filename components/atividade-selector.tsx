import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ClubSelectionModal } from '@/components/club-selection-modal';
import type { AtividadeOption } from '@/types/atividade';

type AtividadeSelectorProps = {
  atividades: AtividadeOption[];
  value: number | null;
  onChange: (atividadeId: number) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  emptyPlaceholder?: string;
  modalTitle?: string;
  hideLabel?: boolean;
  allowAll?: boolean;
  allLabel?: string;
  onSelectAll?: () => void;
  /** Mantém a ordem recebida em `atividades` (sem reordenar alfabeticamente). */
  preserveOrder?: boolean;
  style?: StyleProp<ViewStyle>;
  selectorTextStyle?: StyleProp<TextStyle>;
  optionTextStyle?: StyleProp<TextStyle>;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
};

export function AtividadeSelector({
  atividades,
  value,
  onChange,
  isLoading = false,
  error = null,
  onRetry,
  disabled = false,
  label = 'Atividade',
  placeholder = 'Selecione a atividade',
  emptyPlaceholder = 'Selecione o local primeiro',
  modalTitle = 'Selecione a atividade',
  hideLabel = false,
  allowAll = false,
  allLabel = 'Todas as atividades',
  onSelectAll,
  preserveOrder = false,
  style,
  selectorTextStyle,
  optionTextStyle,
}: AtividadeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sortedAtividades = useMemo(
    () =>
      preserveOrder
        ? atividades
        : [...atividades].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [atividades, preserveOrder],
  );
  const selectedAtividade = value != null ? atividades.find((item) => item.id === value) : null;
  const showingAll = allowAll && value == null;
  const hasActivities = atividades.length > 0;
  const isDisabled = disabled || isLoading || !!error || !hasActivities;

  return (
    <View style={[styles.container, style]}>
      {hideLabel ? null : <Text style={styles.label}>{label}</Text>}

      <Pressable
        style={[styles.selector, isDisabled && styles.selectorDisabled]}
        onPress={() => setIsOpen(true)}
        disabled={isDisabled}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.blue} />
            <Text style={styles.loadingText}>Carregando atividades...</Text>
          </View>
        ) : (
          <>
            <Text
              style={[
                styles.selectorText,
                selectorTextStyle,
                !selectedAtividade && !showingAll && styles.placeholder,
              ]}
              numberOfLines={1}>
              {showingAll
                ? allLabel
                : selectedAtividade?.nome || (hasActivities ? placeholder : emptyPlaceholder)}
            </Text>
            {hasActivities ? <Ionicons name="chevron-down" size={20} color={COLORS.navy} /> : null}
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

      <ClubSelectionModal visible={isOpen} title={modalTitle} onClose={() => setIsOpen(false)}>
        {allowAll && onSelectAll ? (
          <Pressable
            style={styles.option}
            onPress={() => {
              onSelectAll();
              setIsOpen(false);
            }}>
            <Text style={[styles.optionText, optionTextStyle]}>{allLabel}</Text>
          </Pressable>
        ) : null}
        {sortedAtividades.map((atividade) => (
          <Pressable
            key={atividade.id}
            style={styles.option}
            onPress={() => {
              onChange(atividade.id);
              setIsOpen(false);
            }}>
            <Text style={[styles.optionText, optionTextStyle]}>{atividade.nome}</Text>
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
