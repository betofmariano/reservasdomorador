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
import type { HorarioPresencaOption } from '@/types/presenca';

type HorarioSelectProps = {
  horarios: HorarioPresencaOption[];
  value: HorarioPresencaOption | null;
  onChange: (horario: HorarioPresencaOption) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  modalTitle?: string;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
};

export function HorarioSelect({
  horarios,
  value,
  onChange,
  isLoading = false,
  error = null,
  onRetry,
  disabled = false,
  label = 'Horário',
  placeholder = 'Selecione o horário',
  modalTitle = 'Selecione o horário',
}: HorarioSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sortedHorarios = useMemo(
    () => [...horarios].sort((a, b) => a.dataAtividade - b.dataAtividade),
    [horarios],
  );
  const hasHorarios = sortedHorarios.length > 0;
  const isDisabled = disabled || isLoading || !!error || !hasHorarios;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        style={[styles.selector, isDisabled && styles.selectorDisabled]}
        onPress={() => setIsOpen(true)}
        disabled={isDisabled}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.blue} />
            <Text style={styles.loadingText}>Carregando horários...</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.selectorText, !value && styles.placeholder]} numberOfLines={1}>
              {value?.descricao || (hasHorarios ? placeholder : 'Nenhum horário disponível')}
            </Text>
            {hasHorarios ? <Ionicons name="chevron-down" size={20} color={COLORS.navy} /> : null}
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
        {sortedHorarios.map((horario) => (
          <Pressable
            key={horario.mapaDiarioId}
            style={styles.option}
            onPress={() => {
              onChange(horario);
              setIsOpen(false);
            }}>
            <Text style={styles.optionText}>{horario.descricao}</Text>
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
