import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

type AuthTextFieldProps = TextInputProps & {
  label: string;
};

export function AuthTextField({ label, style, ...props }: AuthTextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#9AA0A6"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A2154',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 19,
    color: '#3A2154',
    backgroundColor: '#FFFFFF',
  },
});
