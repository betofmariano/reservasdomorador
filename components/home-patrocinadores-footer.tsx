import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';

import type { Patrocinador } from '@/types/publicidade';
import {
  FOOTER_BOTTOM_PADDING,
  FOOTER_ICON_GAP,
  FOOTER_TOP_PADDING,
  getHomePatrocinadoresFooterIconSize,
} from '@/utils/home-patrocinadores-footer-metrics';
import { getPatrocinadorLogoImageUrl, getPatrocinadorTitulo } from '@/utils/publicidade-patrocinador';
import { getWebConstrainedWidth } from '@/utils/web-layout';

type HomePatrocinadoresFooterProps = {
  patrocinadores: Patrocinador[];
  onPatrocinadorPress: (patrocinador: Patrocinador) => void;
};

export function HomePatrocinadoresFooter({
  patrocinadores,
  onPatrocinadorPress,
}: HomePatrocinadoresFooterProps) {
  const { width } = useWindowDimensions();

  const patrocinadoresVisiveis = patrocinadores.filter(
    (patrocinador) => Boolean(getPatrocinadorLogoImageUrl(patrocinador)),
  );

  if (patrocinadoresVisiveis.length === 0) {
    return null;
  }

  const iconSize = getHomePatrocinadoresFooterIconSize(width, patrocinadoresVisiveis.length);
  const rowMaxWidth = getWebConstrainedWidth(width) - 32;

  return (
    <View style={[styles.footer, { paddingBottom: FOOTER_BOTTOM_PADDING }]}>
      <View style={[styles.iconsRow, { gap: FOOTER_ICON_GAP, maxWidth: rowMaxWidth }]}>
        {patrocinadoresVisiveis.map((patrocinador) => {
          const logoUrl = getPatrocinadorLogoImageUrl(patrocinador);
          const label = getPatrocinadorTitulo(patrocinador) ?? 'Patrocinador';

          if (!logoUrl) {
            return null;
          }

          return (
            <Pressable
              key={patrocinador.id}
              style={[
                styles.iconButton,
                {
                  width: iconSize,
                  height: iconSize,
                  borderRadius: iconSize / 2,
                },
              ]}
              accessibilityLabel={label}
              onPress={() => onPatrocinadorPress(patrocinador)}>
              <Image
                source={{ uri: logoUrl }}
                style={styles.iconImage}
                contentFit="cover"
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E6EE',
    backgroundColor: '#FFFFFF',
    paddingTop: FOOTER_TOP_PADDING,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconButton: {
    overflow: 'hidden',
    backgroundColor: '#F4F6FA',
    borderWidth: 1,
    borderColor: '#E2E6EE',
    flexShrink: 0,
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
});
