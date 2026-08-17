import { MatchPlaceLogo } from '@/components/matchplace-logo';

type MatchPointLogoProps = {
  size?: 'default' | 'large';
  style?: import('react-native').StyleProp<import('react-native').ImageStyle>;
};

/** @deprecated Use MatchPlaceLogo */
export function MatchPointLogo(props: MatchPointLogoProps) {
  return <MatchPlaceLogo {...props} />;
}

export { MatchPlaceLogo };
