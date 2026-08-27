import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';

import { HeaderMenuDropdown } from '@/components/header-menu-dropdown';

import { MatchPlaceLogoHomeLink } from '@/components/matchplace-logo';
import { UserAvatar } from '@/components/user-avatar';
import { useAdministracaoMenuAccess } from '@/hooks/use-administracao-menu-access';
import type { User } from '@/types/user';
import { canShowAdministracaoEntry } from '@/utils/club-config';
import { getActiveRouteName, isAdministracaoChildRoute } from '@/utils/route-access';

const COLORS = {
  menuBackground: '#D9D9D9',
  divider: '#E8B830',
  navy: '#3A2154',
};

const HEADER_LOGO_WIDTH = 72;
const HEADER_AVATAR_SIZE = 68;

type ScreenHeaderProps = {
  user: User;
  title: string;
  onLogoPress?: () => void;
  showMenuButton?: boolean;
  onMenuPress?: () => void;
  enableDefaultMenu?: boolean;
  showMeusDadosOption?: boolean;
};

export function ScreenHeader({
  user,
  title,
  onLogoPress,
  showMenuButton = false,
  onMenuPress,
  enableDefaultMenu = true,
  showMeusDadosOption = false,
}: ScreenHeaderProps) {
  const router = useRouter();
  const segments = useSegments();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const { showUsuariosInHeaderMenu } = useAdministracaoMenuAccess(user);

  function handleLogoPress() {
    if (onLogoPress) {
      onLogoPress();
      return;
    }

    const routeName = getActiveRouteName(segments);

    if (isAdministracaoChildRoute(routeName) && canShowAdministracaoEntry(user)) {
      router.replace('/administracao');
      return;
    }

    router.replace('/');
  }

  function handleMenuPress() {
    if (onMenuPress) {
      onMenuPress();
      return;
    }

    if (enableDefaultMenu) {
      setIsMenuVisible(true);
    }
  }

  return (
    <View style={styles.container}>
      <MatchPlaceLogoHomeLink onPress={handleLogoPress} logoStyle={styles.logo} />

      {showMenuButton ? (
        <Pressable style={styles.menuButton} onPress={handleMenuPress} accessibilityLabel="Menu">
          <Ionicons name="menu" size={28} color="#000" />
        </Pressable>
      ) : null}

      <View style={styles.titleContainer} pointerEvents="none">
        <Text style={styles.title}>{title}</Text>
      </View>

      <UserAvatar name={user.nome} photoUrl={user.foto} size={HEADER_AVATAR_SIZE} />

      {showMenuButton && enableDefaultMenu && !onMenuPress ? (
        <HeaderMenuDropdown
          visible={isMenuVisible}
          onClose={() => setIsMenuVisible(false)}
          showHomeOption
          showUsuariosOption={showUsuariosInHeaderMenu}
          showMeusDadosOption={showMeusDadosOption}
        />
      ) : null}
    </View>
  );
}

export function ScreenHeaderDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: HEADER_LOGO_WIDTH,
  },
  menuButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.menuBackground,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    height: 2,
    backgroundColor: COLORS.divider,
  },
});
