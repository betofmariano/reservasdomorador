import {
  Image,
  ImageStyle,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

type AppLogoProps = {
  size?: 'default' | 'large';
  style?: StyleProp<ImageStyle>;
};

type AppLogoHomeLinkProps = {
  onPress: () => void;
  size?: 'default' | 'large';
  logoStyle?: StyleProp<ImageStyle>;
  style?: StyleProp<ViewStyle>;
  showTapHint?: boolean;
};

export const APP_LOGO_TAP_HINT = 'Toque no logo para ir ao início';
/** @deprecated Use APP_LOGO_TAP_HINT */
export const MATCHPLACE_LOGO_TAP_HINT = APP_LOGO_TAP_HINT;

const LOGO_SOURCE = require('@/assets/images/logo-reservasdomorador.png');

/** Largura / altura do logotipo completo (símbolo + texto). */
const LOGO_ASPECT_RATIO = 311 / 421;

const SIZES = {
  default: { width: 96, height: Math.round(96 / LOGO_ASPECT_RATIO) },
  large: { width: 176, height: Math.round(176 / LOGO_ASPECT_RATIO) },
} as const;

export function AppLogo({ size = 'default', style }: AppLogoProps) {
  return (
    <Image
      source={LOGO_SOURCE}
      style={[styles.logo, SIZES[size], style]}
      accessibilityLabel="Reservas do Morador"
      resizeMode="contain"
    />
  );
}

/** @deprecated Use AppLogo */
export const MatchPlaceLogo = AppLogo;

export function AppLogoHomeLink({
  onPress,
  size = 'default',
  logoStyle,
  style,
  showTapHint = true,
}: AppLogoHomeLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Voltar para Home"
      style={style}>
      <View style={styles.homeLinkContent}>
        <AppLogo size={size} style={logoStyle} />
        {showTapHint ? <Text style={styles.tapHint}>{APP_LOGO_TAP_HINT}</Text> : null}
      </View>
    </Pressable>
  );
}

/** @deprecated Use AppLogoHomeLink */
export const MatchPlaceLogoHomeLink = AppLogoHomeLink;

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
  homeLinkContent: {
    alignItems: 'center',
  },
  tapHint: {
    marginTop: 4,
    maxWidth: 140,
    fontSize: 11,
    lineHeight: 14,
    color: '#5C6475',
    textAlign: 'center',
  },
});
