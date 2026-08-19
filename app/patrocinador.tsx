import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PATROCINADOR_APPS,
  PATROCINADOR_FOOTER,
  PATROCINADOR_SECTIONS,
  type PatrocinadorAppCard,
  type PatrocinadorShowcaseItem,
} from '@/constants/patrocinador-static';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { usePlataformaStats } from '@/hooks/use-plataforma-stats';
import type { PlataformaStatsMetric } from '@/types/plataforma';

const FOUR_COL_BREAKPOINT = 980;
const TWO_COL_BREAKPOINT = 640;
const PAGE_GUTTER = 16;

export default function PatrocinadorScreen() {
  const { width } = useWindowDimensions();
  const { metrics } = usePlataformaStats();
  const platformColumns = width >= FOUR_COL_BREAKPOINT ? 4 : width >= TWO_COL_BREAKPOINT ? 2 : 1;
  const contentWidth = Math.max(0, width - PAGE_GUTTER * 2);
  const columnGap = 16;
  const platformCardWidth =
    platformColumns === 1
      ? contentWidth
      : (contentWidth - columnGap * (platformColumns - 1)) / platformColumns;
  const platformImageWidth = Math.round(platformCardWidth * 0.9);
  const platformImageHeight = Math.round(platformImageWidth * 1.85);
  const showcaseImageHeight = Math.max(220, Math.round(platformCardWidth * 1.35));
  const footerLogoSize = Math.min(160, Math.max(120, Math.round(contentWidth / 7)));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.platformHeader}>
          <SectionTitle>Nossa Plataforma</SectionTitle>

          {metrics.length > 0 ? (
            <PlataformaStatsBanner metrics={metrics} singleRow={platformColumns === 4} />
          ) : null}
        </View>

        <View style={[styles.grid, styles.appsGrid]}>
          {PATROCINADOR_APPS.map((app) => (
            <PlatformCard
              key={app.id}
              app={app}
              width={platformCardWidth}
              imageWidth={platformImageWidth}
              imageHeight={platformImageHeight}
            />
          ))}
        </View>

        {PATROCINADOR_SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            <SectionTitle>{section.title}</SectionTitle>
            <View style={[styles.grid, platformColumns === 4 && styles.singleRowGrid]}>
              {section.items.map((item) => (
                <ShowcaseCard
                  key={item.id}
                  item={item}
                  width={platformCardWidth}
                  imageHeight={showcaseImageHeight}
                />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <SectionTitle>{PATROCINADOR_FOOTER.title}</SectionTitle>
          <Image
            source={{ uri: PATROCINADOR_FOOTER.logoUrl }}
            style={{ width: footerLogoSize, height: footerLogoSize }}
            contentFit="contain"
            accessibilityLabel="LinkPower Technologia"
          />
          <Text style={styles.footerCredit}>{PATROCINADOR_FOOTER.credit}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlataformaStatsBanner({
  metrics,
  singleRow,
}: {
  metrics: PlataformaStatsMetric[];
  singleRow: boolean;
}) {
  return (
    <View style={[styles.statsBanner, singleRow && styles.statsBannerSingleRow]}>
      {metrics.map((metric) => (
        <Text key={metric.id} style={styles.statsText}>
          {metric.label} = {metric.value}
        </Text>
      ))}
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={styles.titleBadge}>
      <Text style={styles.titleBadgeText}>{children}</Text>
    </View>
  );
}

function PlatformCard({
  app,
  width,
  imageWidth,
  imageHeight,
}: {
  app: PatrocinadorAppCard;
  width: number;
  imageWidth: number;
  imageHeight: number;
}) {
  return (
    <View style={[styles.platformCard, { width }]}>
      <Image
        source={{ uri: app.imageUrl }}
        style={[styles.platformImage, { width: imageWidth, height: imageHeight }]}
        contentFit="contain"
        accessibilityLabel={app.nome}
      />
    </View>
  );
}

function ShowcaseCard({
  item,
  width,
  imageHeight,
}: {
  item: PatrocinadorShowcaseItem;
  width: number;
  imageHeight: number;
}) {
  return (
    <View style={[styles.card, { width }]}>
      <Image
        source={{ uri: item.imageUrl }}
        style={[styles.cardImage, { height: imageHeight }]}
        contentFit="contain"
        accessibilityLabel={item.caption}
      />
      <Text style={styles.cardCaption}>{item.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MATCHPOINT_COLORS.background,
  },
  screen: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: 56,
    alignItems: 'stretch',
    gap: 28,
  },
  statsBanner: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: MATCHPOINT_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: MATCHPOINT_COLORS.borderLight,
  },
  statsBannerSingleRow: {
    flexWrap: 'nowrap',
  },
  statsText: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  platformHeader: {
    width: '100%',
    gap: 0,
  },
  titleBadge: {
    backgroundColor: MATCHPOINT_COLORS.gold,
    paddingHorizontal: 22,
    paddingVertical: 14,
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  titleBadgeText: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  section: {
    width: '100%',
    gap: 20,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 16,
    paddingHorizontal: PAGE_GUTTER,
    overflow: 'visible',
  },
  appsGrid: {
    alignItems: 'stretch',
    overflow: 'visible',
  },
  singleRowGrid: {
    flexWrap: 'nowrap',
  },
  platformCard: {
    backgroundColor: MATCHPOINT_COLORS.white,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    overflow: 'visible',
    alignItems: 'center',
  },
  platformImage: {
    borderRadius: 8,
    marginTop: 'auto',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: MATCHPOINT_COLORS.white,
    borderWidth: 1,
    borderColor: MATCHPOINT_COLORS.borderLight,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  cardImage: {
    width: '100%',
    backgroundColor: MATCHPOINT_COLORS.readOnlyBackground,
    borderRadius: 8,
  },
  cardCaption: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 20,
    marginTop: 8,
  },
  footerCredit: {
    color: MATCHPOINT_COLORS.muted,
    fontSize: 16,
    fontWeight: '600',
  },
});
