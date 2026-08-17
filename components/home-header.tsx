import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ChangePhotoModal } from '@/components/change-photo-modal';
import { MatchPlaceLogoHomeLink } from '@/components/matchplace-logo';
import { UserAvatar } from '@/components/user-avatar';
import { APP_BUILD, APP_VERSION } from '@/constants/app-version';
import { useUserContext } from '@/contexts/user-context';
import type { User } from '@/types/user';

const COLORS = {
  divider: '#E89520',
  navy: '#1B2B4B',
};

const HEADER_LOGO_WIDTH = 96;
const HEADER_LOGO_HEIGHT = 62;
const HEADER_AVATAR_SIZE = 68;

type HomeHeaderProps = {
  user: User;
};

export function HomeHeader({ user }: HomeHeaderProps) {
  const router = useRouter();
  const { currentAcademia } = useUserContext();
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);

  const academiaNome = currentAcademia?.nome ?? null;

  function handleAvatarPress() {
    if (!user?.id) {
      Alert.alert('Erro', 'Não foi possível identificar o usuário.');
      return;
    }

    setIsPhotoModalVisible(true);
  }

  return (
    <View style={styles.headerContainer}>
      <MatchPlaceLogoHomeLink
        onPress={() => router.replace('/')}
        logoStyle={styles.logo}
      />

      <View style={styles.academiaContainer}>
        {academiaNome ? (
          <Text style={styles.academiaName} numberOfLines={2}>
            {academiaNome}
          </Text>
        ) : null}
      </View>

      <View style={styles.avatarColumn}>
        <UserAvatar
          name={user.nome}
          photoUrl={user.foto}
          size={HEADER_AVATAR_SIZE}
          onPress={handleAvatarPress}
          showEditBadge
        />
        <Text style={styles.versionLabel}>v{APP_VERSION}</Text>
        <Text style={styles.buildLabel}>{APP_BUILD}</Text>
      </View>

      <ChangePhotoModal
        visible={isPhotoModalVisible}
        onClose={() => setIsPhotoModalVisible(false)}
      />
    </View>
  );
}

export function HomeHeaderDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: HEADER_LOGO_WIDTH,
    height: HEADER_LOGO_HEIGHT,
  },
  academiaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    minHeight: HEADER_AVATAR_SIZE,
  },
  academiaName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    lineHeight: 20,
  },
  avatarColumn: {
    alignItems: 'center',
    minWidth: HEADER_AVATAR_SIZE,
  },
  versionLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#5C6475',
    textAlign: 'center',
  },
  buildLabel: {
    marginTop: 2,
    fontSize: 10,
    color: '#8A919E',
    textAlign: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: COLORS.divider,
  },
});
