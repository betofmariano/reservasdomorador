import { StyleSheet, Switch, Text, View } from 'react-native';

type ClubFormSwitchProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  border: '#E2E6EE',
};

export function ClubFormSwitch({
  label,
  value,
  onValueChange,
  disabled = false,
}: ClubFormSwitchProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#D5DAE3', true: '#9DB7E8' }}
        thumbColor={value ? COLORS.blue : '#FFFFFF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: COLORS.navy,
    fontWeight: '500',
  },
});
