import { StyleSheet, Text, View } from 'react-native';

type ProgramacaoAtividadesResumoProps = {
  total: number;
  exibindo: number;
  hasFiltro: boolean;
};

export function ProgramacaoAtividadesResumo({
  total,
  exibindo,
  hasFiltro,
}: ProgramacaoAtividadesResumoProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Atividades programadas: {total}</Text>
      {hasFiltro ? <Text style={styles.text}>Exibindo: {exibindo}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A2154',
  },
});
