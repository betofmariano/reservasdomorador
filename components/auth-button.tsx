import { Pressable, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';

import { MATCHPOINT_COLORS, VOLTAR_BUTTON_FONT_SIZE } from '@/constants/theme';

type AuthButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'link' | 'actionLink' | 'outline' | 'voltar';
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
};

const COLORS = {
  gold: MATCHPOINT_COLORS.gold,
  blue: MATCHPOINT_COLORS.blue,
  navy: MATCHPOINT_COLORS.navy,
  white: MATCHPOINT_COLORS.white,
  voltarBackground: MATCHPOINT_COLORS.voltarButtonBackground,
};

export function AuthButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  labelStyle,
}: AuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'voltar' && styles.voltar,
        variant === 'link' && styles.link,
        variant === 'actionLink' && styles.actionLink,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.primaryLabel,
          variant === 'secondary' && styles.secondaryLabel,
          variant === 'outline' && styles.outlineLabel,
          variant === 'voltar' && styles.voltarLabel,
          variant === 'link' && styles.linkLabel,
          variant === 'actionLink' && styles.actionLinkLabel,
          labelStyle,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    minHeight: 48,
    paddingHorizontal: 20,
    width: '100%',
  },
  primary: {
    backgroundColor: COLORS.blue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  secondary: {
    backgroundColor: COLORS.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  outline: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.blue,
  },
  voltar: {
    backgroundColor: COLORS.voltarBackground,
    borderWidth: 1,
    borderColor: COLORS.blue,
  },
  link: {
    backgroundColor: 'transparent',
    minHeight: 36,
    paddingHorizontal: 0,
  },
  actionLink: {
    backgroundColor: 'transparent',
    minHeight: 40,
    paddingHorizontal: 0,
    marginBottom: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  primaryLabel: {
    color: COLORS.white,
  },
  secondaryLabel: {
    color: '#000',
  },
  outlineLabel: {
    color: COLORS.blue,
  },
  voltarLabel: {
    color: COLORS.blue,
    fontSize: VOLTAR_BUTTON_FONT_SIZE,
    fontWeight: '600',
  },
  linkLabel: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  actionLinkLabel: {
    color: COLORS.blue,
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
