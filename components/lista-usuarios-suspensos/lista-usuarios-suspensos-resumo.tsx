import { StyleSheet, Text, View } from 'react-native';

type ListaUsuariosSuspensosResumoProps = {
  total: number;
  ativos: number;
};

const COLORS = {
  navy: '#3A2154',
};

export function ListaUsuariosSuspensosResumo({ total, ativos }: ListaUsuariosSuspensosResumoProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Registros exibidos: {total}</Text>
      <Text style={styles.text}>Suspensões ativas: {ativos}</Text>
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
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
});
