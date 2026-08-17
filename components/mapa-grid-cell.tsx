import { Platform, Pressable, StyleSheet, Text } from 'react-native';

export const MAPA_GRID_CELL_WIDTH = 92;
export const MAPA_GRID_CELL_HEIGHT = Platform.OS === 'android' ? 115 : 96;

const FONT_SIZES =
  Platform.OS === 'android'
    ? {
        quadra: 22,
        horario: 18,
        uso: 17,
      }
    : {
        quadra: 18,
        horario: 15,
        uso: 14,
      };

type MapaGridCellProps = {
  quadra: number;
  horarioLabel: string;
  usoLabel: string;
  backgroundColor: string;
  textColor: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function MapaGridCell({
  quadra,
  horarioLabel,
  usoLabel,
  backgroundColor,
  textColor,
  onPress,
  disabled = false,
}: MapaGridCellProps) {
  return (
    <Pressable
      style={[styles.cell, { backgroundColor }]}
      onPress={onPress}
      disabled={disabled || !onPress}>
      <Text
        style={[styles.quadra, { color: textColor }]}
        numberOfLines={1}
        allowFontScaling={false}>
        {quadra}
      </Text>
      <Text
        style={[styles.horario, { color: textColor }]}
        numberOfLines={1}
        allowFontScaling={false}
        {...(Platform.OS === 'ios'
          ? { adjustsFontSizeToFit: true, minimumFontScale: 0.85 }
          : null)}>
        {horarioLabel}
      </Text>
      <Text
        style={[styles.uso, { color: textColor }]}
        numberOfLines={1}
        allowFontScaling={false}
        {...(Platform.OS === 'ios'
          ? { adjustsFontSizeToFit: true, minimumFontScale: 0.85 }
          : null)}>
        {usoLabel}
      </Text>
    </Pressable>
  );
}

const androidTextFix =
  Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' as const } : null;

const styles = StyleSheet.create({
  cell: {
    width: MAPA_GRID_CELL_WIDTH,
    minWidth: MAPA_GRID_CELL_WIDTH,
    height: MAPA_GRID_CELL_HEIGHT,
    minHeight: MAPA_GRID_CELL_HEIGHT,
    flexShrink: 0,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === 'android' ? 10 : 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D5DAE3',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  quadra: {
    fontSize: FONT_SIZES.quadra,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
    ...androidTextFix,
  },
  horario: {
    fontSize: FONT_SIZES.horario,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    marginTop: Platform.OS === 'android' ? 7 : 6,
    ...androidTextFix,
  },
  uso: {
    fontSize: FONT_SIZES.uso,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    marginTop: Platform.OS === 'android' ? 5 : 4,
    ...androidTextFix,
  },
});
