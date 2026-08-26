import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getUserInitials, hasUserPhoto } from '@/utils/user-photo';

type UserAvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: number;
  shape?: 'circle' | 'rounded-rect';
  onPress?: () => void;
  showEditBadge?: boolean;
};

export function UserAvatar({
  name,
  photoUrl,
  size = 52,
  shape = 'circle',
  onPress,
  showEditBadge = false,
}: UserAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowPhoto = hasUserPhoto(photoUrl) && !hasImageError;
  const photoWidth = size;
  const photoHeight = shape === 'rounded-rect' ? size * 1.25 : size;
  const borderRadius = shape === 'rounded-rect' ? Math.min(8, size * 0.12) : size / 2;

  useEffect(() => {
    setHasImageError(false);
  }, [photoUrl]);

  const avatarContent = shouldShowPhoto ? (
    <Image
      source={{ uri: photoUrl!.trim() }}
      style={{ width: photoWidth, height: photoHeight, borderRadius }}
      resizeMode="cover"
      onError={() => setHasImageError(true)}
    />
  ) : (
    <View
      style={[
        styles.initialsContainer,
        { width: photoWidth, height: photoHeight, borderRadius },
      ]}>
      <Text style={[styles.initialsText, { fontSize: size * 0.34 }]}>
        {getUserInitials(name)}
      </Text>
    </View>
  );

  const content = (
    <View style={[styles.wrapper, { width: photoWidth, height: photoHeight }]}>
      {avatarContent}
      {showEditBadge ? (
        <View style={[styles.badge, { width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16 }]}>
          <Ionicons name="camera" size={size * 0.18} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Alterar foto">
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  initialsContainer: {
    backgroundColor: '#0F7A6C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#0F7A6C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
