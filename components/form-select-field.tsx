import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MATCHPOINT_COLORS } from '@/constants/theme';

export type FormSelectOption<T extends string> = {
  value: T;
  label: string;
};

type FormSelectFieldProps<T extends string> = {
  label: string;
  value: T | '';
  options: Array<FormSelectOption<T>>;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
};

export function FormSelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecione',
  disabled = false,
  error = null,
}: FormSelectFieldProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  function handleSelect(nextValue: T) {
    onChange(nextValue);
    setIsOpen(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => {
          if (!disabled) {
            setIsOpen((current) => !current);
          }
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: isOpen, disabled }}>
        <Text style={[styles.selectorText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label || placeholder}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={MATCHPOINT_COLORS.navy}
        />
      </Pressable>

      {isOpen ? (
        <View style={styles.options}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <Pressable
                key={option.value}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleSelect(option.value)}>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: MATCHPOINT_COLORS.navy,
    marginBottom: 8,
  },
  selector: {
    height: 48,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MATCHPOINT_COLORS.white,
  },
  selectorDisabled: {
    opacity: 0.7,
  },
  selectorText: {
    flex: 1,
    minWidth: 0,
    fontSize: 19,
    color: MATCHPOINT_COLORS.navy,
  },
  placeholder: {
    color: MATCHPOINT_COLORS.placeholder,
  },
  options: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: MATCHPOINT_COLORS.white,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  optionSelected: {
    backgroundColor: '#F3F7F6',
  },
  optionText: {
    fontSize: 16,
    color: MATCHPOINT_COLORS.navy,
  },
  optionTextSelected: {
    color: MATCHPOINT_COLORS.blue,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: MATCHPOINT_COLORS.error,
    fontWeight: '600',
  },
});
