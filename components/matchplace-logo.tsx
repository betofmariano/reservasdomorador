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

type MatchPlaceLogoProps = {
  size?: 'default' | 'large';
  style?: StyleProp<ImageStyle>;
};

type MatchPlaceLogoHomeLinkProps = {
  onPress: () => void;
  size?: 'default' | 'large';
  logoStyle?: StyleProp<ImageStyle>;
  style?: StyleProp<ViewStyle>;
  showTapHint?: boolean;
};

export const MATCHPLACE_LOGO_TAP_HINT = 'Toque no logo para ir ao início';

const LOGO_SOURCE = require('@/assets/images/logo-matchplace.png');

const LOGO_ASPECT_RATIO = 1.55;

const SIZES = {
  default: { width: 96, height: Math.round(96 / LOGO_ASPECT_RATIO) },
  large: { width: 176, height: Math.round(176 / LOGO_ASPECT_RATIO) },
} as const;

export function MatchPlaceLogo({ size = 'default', style }: MatchPlaceLogoProps) {
  return (
    <Image
      source={LOGO_SOURCE}
      style={[styles.logo, SIZES[size], style]}
      accessibilityLabel="MatchPlace"
      resizeMode="contain"
    />
  );
}

export function MatchPlaceLogoHomeLink({
  onPress,
  size = 'default',
  logoStyle,
  style,
  showTapHint = true,
}: MatchPlaceLogoHomeLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Voltar para Home"
      style={style}>
      <View style={styles.homeLinkContent}>
        <MatchPlaceLogo size={size} style={logoStyle} />
        {showTapHint ? <Text style={styles.tapHint}>{MATCHPLACE_LOGO_TAP_HINT}</Text> : null}
      </View>
    </Pressable>
  );
}

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
