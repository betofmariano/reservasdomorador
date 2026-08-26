import { AppLogo } from '@/components/matchplace-logo';

type MatchPointLogoProps = {
  size?: 'default' | 'large';
  style?: import('react-native').StyleProp<import('react-native').ImageStyle>;
};

/** @deprecated Use AppLogo */
export function MatchPointLogo(props: MatchPointLogoProps) {
  return <AppLogo {...props} />;
}

export { AppLogo, MatchPlaceLogo } from '@/components/matchplace-logo';
