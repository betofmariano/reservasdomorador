import { StyleSheet, Text, View } from 'react-native';

type ResumoPresencaProps = {
  total: number;
  presentes: number;
  ausentes: number;
  showDetails?: boolean;
};

const COLORS = {
  navy: '#3A2154',
  muted: '#5C6475',
};

export function ResumoPresenca({
  total,
  presentes,
  ausentes,
  showDetails = true,
}: ResumoPresencaProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.total}>Quantidade de reservas: {total}</Text>
      {showDetails ? (
        <View style={styles.detailsRow}>
          <Text style={styles.detail}>Presentes: {presentes}</Text>
          <Text style={styles.detail}>Ausentes: {ausentes}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    gap: 6,
  },
  total: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detail: {
    fontSize: 14,
    color: COLORS.muted,
  },
});
