import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UserAvatar } from '@/components/user-avatar';
import type { UsuarioListItem } from '@/types/usuario';

type UsuarioListItemRowProps = {
  usuario: UsuarioListItem;
  onPress: (usuario: UsuarioListItem) => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  border: '#E2E6EE',
};

export function UsuarioListItemRow({ usuario, onPress }: UsuarioListItemRowProps) {
  return (
    <View style={styles.row}>
      <UserAvatar name={usuario.nome} photoUrl={null} size={52} />
      <Pressable
        style={styles.namePressable}
        onPress={() => onPress(usuario)}
        accessibilityRole="button"
        accessibilityLabel={`Contato de ${usuario.nome}`}>
        <Text style={styles.name} numberOfLines={2}>
          {usuario.nome}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  namePressable: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
});
