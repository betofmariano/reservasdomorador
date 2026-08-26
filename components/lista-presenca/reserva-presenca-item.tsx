import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { UserAvatar } from '@/components/user-avatar';
import type { ReservaPresenca } from '@/types/presenca';
import { getPortraitPhotoDimensions } from '@/utils/user-photo';

type ReservaPresencaItemProps = {
  reserva: ReservaPresenca;
  isUpdating?: boolean;
  canDelete?: boolean;
  onTogglePresenca: (reserva: ReservaPresenca) => void;
  onDelete?: (reserva: ReservaPresenca) => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  error: '#D64545',
  border: '#ECEFF4',
  presentBg: '#E8F5EC',
};

const PORTRAIT_PHOTO_BASE_SIZE = 32;
const portraitPhoto = getPortraitPhotoDimensions(PORTRAIT_PHOTO_BASE_SIZE);

export function ReservaPresencaItem({
  reserva,
  isUpdating = false,
  canDelete = false,
  onTogglePresenca,
  onDelete,
}: ReservaPresencaItemProps) {
  const isPresente = reserva.presente === true;

  return (
    <View style={[styles.container, isPresente && styles.containerPresente]}>
      <Pressable
        style={styles.checkboxArea}
        onPress={() => onTogglePresenca(reserva)}
        disabled={isUpdating}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isPresente }}>
        <View style={[styles.checkbox, isPresente && styles.checkboxChecked]}>
          {isUpdating ? (
            <ActivityIndicator size="small" color={COLORS.blue} />
          ) : isPresente ? (
            <Ionicons name="checkmark" size={22} color="#FFFFFF" />
          ) : null}
        </View>
      </Pressable>

      <UserAvatar
        name={reserva.nomeUsuario}
        photoUrl={reserva.foto}
        size={portraitPhoto.width}
        shape="rounded-rect"
      />

      <View style={styles.content}>
        <Text style={styles.nome}>{reserva.nomeUsuario}</Text>
      </View>

      {canDelete && onDelete ? (
        <Pressable
          style={styles.deleteButton}
          onPress={() => onDelete(reserva)}
          accessibilityLabel={`Cancelar reserva de ${reserva.nomeUsuario}`}>
          <Ionicons name="trash-outline" size={22} color={COLORS.error} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  containerPresente: {
    backgroundColor: COLORS.presentBg,
  },
  checkboxArea: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  nome: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.navy,
  },
  deleteButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
