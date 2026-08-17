import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

type MenuActionButtonProps = {
  label: string;
  backgroundColor: string;
  textColor: string;
  icon?: ReactNode;
  width: number;
  fontSize?: number;
  buttonHeight?: number;
  iconContainerWidth?: number;
  paddingHorizontal?: number;
  style?: ViewStyle;
  disabled?: boolean;
  onPress?: () => void;
};

export function MenuActionButton({
  label,
  backgroundColor,
  textColor,
  icon,
  width,
  fontSize = 20,
  buttonHeight = 56,
  iconContainerWidth = 36,
  paddingHorizontal = 24,
  style,
  disabled = false,
  onPress,
}: MenuActionButtonProps) {
  const hasIcon = icon != null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        hasIcon ? styles.buttonWithIcon : styles.buttonTextOnly,
        {
          backgroundColor,
          width,
          height: buttonHeight,
          paddingHorizontal,
        },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {hasIcon ? (
        <View style={[styles.iconContainer, { width: iconContainerWidth }]}>{icon}</View>
      ) : null}
      <Text
        style={[
          styles.label,
          hasIcon ? styles.labelWithIcon : styles.labelTextOnly,
          { color: textColor, fontSize },
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  buttonWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonTextOnly: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.9,
  },
  iconContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  label: {
    fontWeight: '400',
  },
  labelWithIcon: {
    flex: 1,
  },
  labelTextOnly: {
    textAlign: 'center',
    width: '100%',
  },
});
