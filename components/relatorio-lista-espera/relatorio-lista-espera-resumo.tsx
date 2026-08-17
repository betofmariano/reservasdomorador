import { StyleSheet, Text, View } from 'react-native';

type RelatorioListaEsperaResumoProps = {
  total: number;
};

export function RelatorioListaEsperaResumo({ total }: RelatorioListaEsperaResumoProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Quantidade de reservas : {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F4F6FA',
    borderWidth: 1,
    borderColor: '#E2E6EE',
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2B4B',
    textAlign: 'center',
  },
});
