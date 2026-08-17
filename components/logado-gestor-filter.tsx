import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ClubSelectionModal } from '@/components/club-selection-modal';
import type { LogadoGestorFilter } from '@/types/logado';
import { LOGADO_GESTOR_FILTER_OPTIONS } from '@/utils/logado-lista-format';

type LogadoGestorFilterProps = {
  value: LogadoGestorFilter;
  onChange: (value: LogadoGestorFilter) => void;
  disabled?: boolean;
};

const COLORS = {
  navy: '#1B2B4B',
  muted: '#5C6475',
  border: '#D5DAE3',
};

export function LogadoGestorFilter({
  value,
  onChange,
  disabled = false,
}: LogadoGestorFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = LOGADO_GESTOR_FILTER_OPTIONS.find((option) => option.value === value);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => setIsOpen(true)}
        disabled={disabled}>
        <Text style={[styles.selectorText, value === 'all' && styles.placeholder]}>
          {selectedOption?.label ?? 'Gestor'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.navy} />
      </Pressable>

      <ClubSelectionModal
        visible={isOpen}
        title="Filtrar por gestor"
        maxHeight="70%"
        onClose={() => setIsOpen(false)}>
        {LOGADO_GESTOR_FILTER_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={styles.option}
            onPress={() => {
              onChange(option.value);
              setIsOpen(false);
            }}>
            <Text style={[styles.optionText, option.value === value && styles.optionTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ClubSelectionModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selector: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  selectorDisabled: {
    opacity: 0.6,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.navy,
    marginRight: 8,
  },
  placeholder: {
    color: COLORS.muted,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F6',
  },
  optionText: {
    fontSize: 15,
    color: COLORS.navy,
  },
  optionTextActive: {
    fontWeight: '700',
    color: COLORS.navy,
  },
});
