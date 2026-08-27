import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ClubSelectionModal } from '@/components/club-selection-modal';
import type { GestorUsuarioStatusFilter } from '@/types/usuario';
import { GESTOR_USUARIO_STATUS_FILTER_OPTIONS } from '@/utils/usuario-gestor-lista';

type GestorUsuarioStatusFilterProps = {
  value: GestorUsuarioStatusFilter;
  onChange: (value: GestorUsuarioStatusFilter) => void;
  disabled?: boolean;
};

const COLORS = {
  navy: '#3A2154',
  muted: '#5C6475',
  border: '#D5DAE3',
};

export function GestorUsuarioStatusFilter({
  value,
  onChange,
  disabled = false,
}: GestorUsuarioStatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = GESTOR_USUARIO_STATUS_FILTER_OPTIONS.find((option) => option.value === value);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => setIsOpen(true)}
        disabled={disabled}>
        <Text style={styles.selectorText}>{selectedOption?.label ?? 'Todos'}</Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.navy} />
      </Pressable>

      <ClubSelectionModal
        visible={isOpen}
        title="Filtrar moradores"
        maxHeight="70%"
        onClose={() => setIsOpen(false)}>
        {GESTOR_USUARIO_STATUS_FILTER_OPTIONS.map((option) => (
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
    maxWidth: 320,
    alignSelf: 'center',
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
    color: '#0F7A6C',
    fontWeight: '700',
  },
});
