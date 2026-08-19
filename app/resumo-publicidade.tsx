import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AdminTableScrollContainer } from '@/components/admin-table-scroll-container';
import { DefinirPeriodoModal } from '@/components/definir-periodo-modal';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { WEB_MAX_WIDE_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import {
  RESUMO_PUBLICIDADE_MESSAGES,
  useResumoPublicidadeScreen,
} from '@/hooks/use-resumo-publicidade-screen';
import { PUBLICIDADE_APPS } from '@/types/publicidade';
import { gerarResumoPublicidadePdf } from '@/utils/gerar-resumo-publicidade-pdf';
import {
  formatPublicidadeInteiro,
  formatPublicidadePeriodo,
} from '@/utils/resumo-publicidade';

const TABLE_MIN_WIDTH = 720;

export default function ResumoPublicidadeScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [periodoVisible, setPeriodoVisible] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const {
    canAccess,
    inicio,
    fim,
    empresas,
    totais,
    isLoading,
    error,
    applyPeriodo,
  } = useResumoPublicidadeScreen({
    user,
    isAuthLoading,
  });

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    if (!canAccess) {
      router.replace('/administracao');
    }
  }, [canAccess, isAuthLoading, router, user]);

  const handleGerarPdf = useCallback(async () => {
    if (!totais) {
      return;
    }

    setIsGeneratingPdf(true);

    try {
      await gerarResumoPublicidadePdf({
        data: {
          dataInicio: inicio.getTime(),
          dataFinal: fim.getTime(),
          empresas,
          totais,
        },
        periodoLabel: formatPublicidadePeriodo(inicio, fim),
      });
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível gerar o PDF.';
      showToast(message, { variant: 'error' });
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [empresas, fim, inicio, showToast, totais]);

  if (isAuthLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={MATCHPOINT_COLORS.blue} />
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  if (!canAccess) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer style={styles.screenContainer}>
          <ScreenHeader user={user} title="Resumo Publicidade" />
          <ScreenHeaderDivider />
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>{RESUMO_PUBLICIDADE_MESSAGES.permission}</Text>
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={WEB_MAX_WIDE_CONTENT_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title="Resumo Publicidade" />
        <ScreenHeaderDivider />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.badgesRow}>
            <View style={styles.goldBadge}>
              <Text style={styles.goldBadgeText}>Resumo Publicidade</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.goldBadge, pressed && styles.pressed]}
              onPress={() => setPeriodoVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Definir período">
              <Text style={styles.goldBadgeText}>{formatPublicidadePeriodo(inicio, fim)}</Text>
            </Pressable>
          </View>

          {totais ? (
            <Pressable
              style={[styles.pdfButton, isGeneratingPdf && styles.pdfButtonDisabled]}
              onPress={() => void handleGerarPdf()}
              disabled={isGeneratingPdf}>
              {isGeneratingPdf ? (
                <ActivityIndicator size="small" color={MATCHPOINT_COLORS.white} />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={18} color={MATCHPOINT_COLORS.white} />
                  <Text style={styles.pdfButtonText}>PDF</Text>
                </>
              )}
            </Pressable>
          ) : null}

          {isLoading ? (
            <ActivityIndicator size="large" color={MATCHPOINT_COLORS.blue} style={styles.loader} />
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!isLoading && totais ? (
            <AdminTableScrollContainer minWidth={TABLE_MIN_WIDTH}>
              <View style={styles.table}>
                <View style={[styles.row, styles.headerRow]}>
                  <Text style={[styles.cell, styles.colEmpresa, styles.headerCell]}>Empresa</Text>
                  {PUBLICIDADE_APPS.map((app) => (
                    <Text key={app} style={[styles.cell, styles.colNum, styles.headerCell]}>
                      {app}
                    </Text>
                  ))}
                  <Text style={[styles.cell, styles.colTotal, styles.headerCell]}>TOTAL</Text>
                </View>

                {empresas.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhuma visualização neste período.</Text>
                ) : (
                  empresas.map((row) => (
                    <View key={row.empresa} style={styles.row}>
                      <Text style={[styles.cell, styles.colEmpresa]}>{row.empresa}</Text>
                      {PUBLICIDADE_APPS.map((app) => (
                        <Text key={app} style={[styles.cell, styles.colNum]}>
                          {formatPublicidadeInteiro(row[app])}
                        </Text>
                      ))}
                      <Text style={[styles.cell, styles.colTotal]}>
                        {formatPublicidadeInteiro(row.total)}
                      </Text>
                    </View>
                  ))
                )}

                <View style={[styles.row, styles.totalRow]}>
                  <Text style={[styles.cell, styles.colEmpresa, styles.totalCell]}>
                    {totais.empresa}
                  </Text>
                  {PUBLICIDADE_APPS.map((app) => (
                    <Text key={app} style={[styles.cell, styles.colNum, styles.totalCell]}>
                      {formatPublicidadeInteiro(totais[app])}
                    </Text>
                  ))}
                  <Text style={[styles.cell, styles.colTotal, styles.totalCell]}>
                    {formatPublicidadeInteiro(totais.total)}
                  </Text>
                </View>
              </View>
            </AdminTableScrollContainer>
          ) : null}
        </ScrollView>
      </WebScreenContainer>

      <DefinirPeriodoModal
        visible={periodoVisible}
        inicio={inicio}
        fim={fim}
        onClose={() => setPeriodoVisible(false)}
        onConfirm={(novoInicio, novoFim) => {
          setPeriodoVisible(false);
          applyPeriodo(novoInicio, novoFim);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MATCHPOINT_COLORS.background,
  },
  loadingSafeArea: {
    flex: 1,
    backgroundColor: MATCHPOINT_COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 12,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    minHeight: 160,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  goldBadge: {
    backgroundColor: MATCHPOINT_COLORS.gold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    flexShrink: 1,
  },
  goldBadgeText: {
    color: MATCHPOINT_COLORS.navy,
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
  },
  pdfButton: {
    minHeight: 40,
    paddingHorizontal: 16,
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
  loader: {
    marginVertical: 24,
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
    paddingHorizontal: 10,
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
  colEmpresa: {
    flex: 1.4,
    minWidth: 140,
  },
  colNum: {
    flex: 1,
    minWidth: 88,
    textAlign: 'right',
    fontWeight: '600',
  },
  colTotal: {
    flex: 0.8,
    minWidth: 72,
    textAlign: 'right',
    fontWeight: '800',
  },
  emptyText: {
    color: MATCHPOINT_COLORS.muted,
    padding: 16,
    textAlign: 'center',
  },
  errorText: {
    color: MATCHPOINT_COLORS.error,
    textAlign: 'center',
    width: '100%',
  },
  messageText: {
    color: MATCHPOINT_COLORS.muted,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  pressed: {
    opacity: 0.85,
  },
});
