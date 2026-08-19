import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MATCHPOINT_COLORS } from '@/constants/theme';
import { PUBLICIDADE_APPS, type PublicidadeEmpresaTotais } from '@/types/publicidade';
import { formatPublicidadeInteiro } from '@/utils/resumo-publicidade';

type ResultadosPublicidadeModalProps = {
  visible: boolean;
  empresa: string;
  periodoLabel: string;
  totais: PublicidadeEmpresaTotais | null;
  isLoading: boolean;
  error: string | null;
  isGeneratingPdf: boolean;
  onClose: () => void;
  onGerarPdf: () => void;
};

export function ResultadosPublicidadeModal({
  visible,
  empresa,
  periodoLabel,
  totais,
  isLoading,
  error,
  isGeneratingPdf,
  onClose,
  onGerarPdf,
}: ResultadosPublicidadeModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Resultados</Text>
          </View>

          <View style={styles.body}>
            {empresa ? <Text style={styles.empresa}>{empresa}</Text> : null}
            <Text style={styles.periodo}>{periodoLabel}</Text>

            {isLoading ? (
              <ActivityIndicator size="large" color={MATCHPOINT_COLORS.blue} />
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {!isLoading && totais ? (
              <>
                <View style={styles.table}>
                  <View style={[styles.row, styles.headerRow]}>
                    <Text style={[styles.cell, styles.colApp, styles.headerCell]}>Aplicativo</Text>
                    <Text style={[styles.cell, styles.colTotal, styles.headerCell]}>TOTAL</Text>
                  </View>
                  {PUBLICIDADE_APPS.map((app) => (
                    <View key={app} style={styles.row}>
                      <Text style={[styles.cell, styles.colApp]}>{app}</Text>
                      <Text style={[styles.cell, styles.colTotal]}>
                        {formatPublicidadeInteiro(totais[app])}
                      </Text>
                    </View>
                  ))}
                  <View style={[styles.row, styles.totalRow]}>
                    <Text style={[styles.cell, styles.colApp, styles.totalCell]}>TOTAL</Text>
                    <Text style={[styles.cell, styles.colTotal, styles.totalCell]}>
                      {formatPublicidadeInteiro(totais.total)}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={[styles.pdfButton, isGeneratingPdf && styles.pdfButtonDisabled]}
                  onPress={onGerarPdf}
                  disabled={isGeneratingPdf}
                  accessibilityRole="button"
                  accessibilityLabel="Gerar PDF">
                  {isGeneratingPdf ? (
                    <ActivityIndicator size="small" color={MATCHPOINT_COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={18} color={MATCHPOINT_COLORS.white} />
                      <Text style={styles.pdfButtonText}>PDF</Text>
                    </>
                  )}
                </Pressable>
              </>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar resultados">
              <Text style={styles.closeText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: MATCHPOINT_COLORS.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: MATCHPOINT_COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1,
  },
  header: {
    backgroundColor: MATCHPOINT_COLORS.gold,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerText: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
    alignItems: 'center',
  },
  empresa: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  periodo: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    color: MATCHPOINT_COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  table: {
    borderWidth: 1,
    borderColor: MATCHPOINT_COLORS.borderLight,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: MATCHPOINT_COLORS.white,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: MATCHPOINT_COLORS.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  headerRow: {
    backgroundColor: MATCHPOINT_COLORS.white,
    borderBottomWidth: 1,
  },
  totalRow: {
    borderBottomWidth: 0,
    backgroundColor: MATCHPOINT_COLORS.readOnlyBackground,
  },
  cell: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 14,
  },
  headerCell: {
    fontWeight: '800',
  },
  totalCell: {
    fontWeight: '800',
  },
  colApp: {
    flex: 1,
  },
  colTotal: {
    minWidth: 80,
    textAlign: 'right',
    fontWeight: '800',
  },
  pdfButton: {
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: MATCHPOINT_COLORS.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pdfButtonDisabled: {
    opacity: 0.6,
  },
  pdfButtonText: {
    color: MATCHPOINT_COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    minHeight: 48,
    width: '100%',
    borderRadius: 10,
    backgroundColor: MATCHPOINT_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: MATCHPOINT_COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});
