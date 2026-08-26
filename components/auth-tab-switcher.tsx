import { Pressable, StyleSheet, Text, View } from 'react-native';

export type AuthTab = 'login' | 'signup';

type AuthTabSwitcherProps = {
  value: AuthTab;
  onChange: (tab: AuthTab) => void;
  disabled?: boolean;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  muted: '#5C6475',
  border: '#E2E6EE',
};

const TABS: Array<{ id: AuthTab; label: string }> = [
  { id: 'login', label: 'Entrar' },
  { id: 'signup', label: 'Cadastrar' },
];

export function AuthTabSwitcher({ value, onChange, disabled = false }: AuthTabSwitcherProps) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const isActive = value === tab.id;

        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, isActive && styles.tabActive, disabled && styles.tabDisabled]}
            onPress={() => onChange(tab.id)}
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: COLORS.blue,
  },
  tabDisabled: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.muted,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: COLORS.navy,
    fontWeight: '700',
  },
});
