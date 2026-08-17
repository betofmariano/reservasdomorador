import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PasswordTextFieldProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label: string;
  labelHint?: string;
};

const COLORS = {
  navy: '#1B2B4B',
  muted: '#5C6475',
  hint: '#D64545',
};

export function PasswordTextField({
  label,
  labelHint,
  style,
  editable = true,
  ...props
}: PasswordTextFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function handleToggleVisibility() {
    if (!editable) {
      return;
    }

    setIsPasswordVisible((current) => !current);
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {labelHint ? <Text style={styles.labelHint}>{labelHint}</Text> : null}
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#9AA0A6"
          secureTextEntry={!isPasswordVisible}
          editable={editable}
          {...props}
        />

        <Pressable
          style={styles.toggleButton}
          onPress={handleToggleVisibility}
          disabled={!editable}
          accessibilityRole="button"
          accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          hitSlop={8}>
          <Ionicons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={editable ? COLORS.navy : COLORS.muted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 8,
    rowGap: 4,
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.navy,
  },
  labelHint: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.hint,
    flexShrink: 1,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingRight: 48,
    fontSize: 19,
    color: COLORS.navy,
    backgroundColor: '#FFFFFF',
  },
  toggleButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
