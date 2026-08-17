import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MATCHPOINT_COLORS } from '@/constants/theme';
import type { MapaAtividadeUnidadeTab } from '@/utils/mapa-diario-atividade-unidade';

type MapaDiarioUnidadeTabsProps = {
  tabs: MapaAtividadeUnidadeTab[];
  selectedId: number | null;
  onSelect: (unidadeId: number) => void;
  disabled?: boolean;
};

const COLORS = {
  navy: MATCHPOINT_COLORS.navy,
  blue: MATCHPOINT_COLORS.blue,
  white: MATCHPOINT_COLORS.white,
  border: MATCHPOINT_COLORS.borderLight,
};

export function MapaDiarioUnidadeTabs({
  tabs,
  selectedId,
  onSelect,
  disabled = false,
}: MapaDiarioUnidadeTabsProps) {
  if (tabs.length <= 1) {
    return null;
  }

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === selectedId;

        return (
          <Pressable
            key={tab.id}
            style={[
              styles.tab,
              isActive ? styles.tabActive : styles.tabInactive,
              disabled && styles.tabDisabled,
            ]}
            onPress={() => onSelect(tab.id)}
            disabled={disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive, disabled }}>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  tabInactive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  tabDisabled: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: COLORS.white,
  },
});
