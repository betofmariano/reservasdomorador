import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image, type ImageLoadEventData } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AuthButton } from '@/components/auth-button';
import { DefinirPeriodoModal } from '@/components/definir-periodo-modal';
import { PhotoSourceModal } from '@/components/photo-source-modal';
import { ResultadosPublicidadeModal } from '@/components/resultados-publicidade-modal';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { HOME_MAX_BUTTON_WIDTH, WEB_MAX_WIDE_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import {
  GERENCIAR_PUBLICIDADE_MESSAGES,
  useGerenciarPublicidadeScreen,
} from '@/hooks/use-gerenciar-publicidade-screen';
import { getApiErrorMessage } from '@/services/api-client';
import { getMostrarPubliXano } from '@/services/publicidade-service';
import type { PatrocinadorAssetSlot, PublicidadeEmpresaTotais } from '@/types/publicidade';
import { gerarResultadosPublicidadeEmpresaPdf } from '@/utils/gerar-resumo-publicidade-pdf';
import {
  agregarResumoPublicidade,
  fimDoDiaAtual,
  formatPublicidadePeriodo,
  inicioDoMesAtual,
  timestampFimPeriodo,
  timestampInicioPeriodo,
} from '@/utils/resumo-publicidade';

const ASSET_SLOTS: Array<{ id: PatrocinadorAssetSlot; label: string }> = [
  { id: 'logo', label: 'Logotipo' },
  { id: 'banner', label: 'Banner Principal' },
  { id: 'popup', label: 'Popup Tela' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

export default function GerenciarPublicidadeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { showToast } = useAppToast();
  const { user, authToken, isLoading: isAuthLoading } = useAuth();
  const [empresaPickerOpen, setEmpresaPickerOpen] = useState(false);
  const [resultadosPeriodoVisible, setResultadosPeriodoVisible] = useState(false);
  const [periodoInicio, setPeriodoInicio] = useState(() => inicioDoMesAtual());
  const [periodoFim, setPeriodoFim] = useState(() => fimDoDiaAtual());
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [isLoadingResultados, setIsLoadingResultados] = useState(false);
  const [resultadosError, setResultadosError] = useState<string | null>(null);
  const [resultadosTotais, setResultadosTotais] = useState<PublicidadeEmpresaTotais | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const {
    empresas,
    selected,
    form,
    isLoading,
    isSubmitting,
    error,
    canAccess,
    hasChanges,
    pickingSlot,
    setPickingSlot,
    selectEmpresa,
    setField,
    getAssetPreviewUrl,
    handlePhotoSelected,
    submit,
  } = useGerenciarPublicidadeScreen(user, authToken);

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    if (!isLoading && !canAccess) {
      router.replace('/patrocinador');
    }
  }, [canAccess, isAuthLoading, isLoading, router, user]);

  useEffect(() => {
    setMostrarResultados(false);
    setResultadosTotais(null);
    setResultadosError(null);
    setIsGeneratingPdf(false);
  }, [selected?.id]);

  const columns = width >= 980 ? 4 : width >= 640 ? 2 : 1;
  const cardWidth = Math.max(
    140,
    (Math.min(width, WEB_MAX_WIDE_CONTENT_WIDTH) - 48 - 16 * (columns - 1)) / columns,
  );

  function handleComingSoon() {
    showToast('Esta função será liberada em breve.', { variant: 'info' });
  }

  function handleResultados() {
    if (!selected?.empresa?.trim()) {
      showToast('Selecione uma empresa.', { variant: 'error' });
      return;
    }

    setResultadosPeriodoVisible(true);
  }

  async function handleGerarPdf() {
    if (!resultadosTotais || !selected?.empresa?.trim()) {
      return;
    }

    setIsGeneratingPdf(true);

    try {
      await gerarResultadosPublicidadeEmpresaPdf({
        empresa: selected.empresa.trim(),
        totais: resultadosTotais,
        periodoLabel: formatPublicidadePeriodo(periodoInicio, periodoFim),
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
  }

  async function loadResultados(inicio: Date, fim: Date, empresa: string) {
    setIsLoadingResultados(true);
    setResultadosError(null);
    setMostrarResultados(true);

    try {
      const dataInicio = timestampInicioPeriodo(inicio, inicio);
      const dataFinal = timestampFimPeriodo(fim, fim);
      const records = await getMostrarPubliXano({ dataInicio, dataFinal });
      const resumo = agregarResumoPublicidade(records, dataInicio, dataFinal, empresa);
      setResultadosTotais(resumo.totais);
    } catch (err) {
      setResultadosError(getApiErrorMessage(err));
      setResultadosTotais(null);
    } finally {
      setIsLoadingResultados(false);
    }
  }

  async function handleSave() {
    const message = await submit();

    if (message) {
      showToast(message, { variant: 'error' });
      return;
    }

    showToast(GERENCIAR_PUBLICIDADE_MESSAGES.saved, { variant: 'success' });
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/patrocinador');
  }

  if (isAuthLoading || isLoading || !user || !canAccess) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={MATCHPOINT_COLORS.blue} />
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={WEB_MAX_WIDE_CONTENT_WIDTH} style={styles.screen}>
        <ScreenHeader user={user} title="Gerenciar Minha Publicidade" />
        <ScreenHeaderDivider />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {empresas.length === 0 ? (
            <Text style={styles.hint}>Nenhuma publicidade cadastrada.</Text>
          ) : null}

          {selected ? (
            <Pressable
              style={styles.empresaSelector}
              onPress={() => {
                if (empresas.length > 1) {
                  setEmpresaPickerOpen((open) => !open);
                }
              }}>
              <Text style={styles.empresaName}>{selected.empresa}</Text>
              {empresas.length > 1 ? (
                <Ionicons name="chevron-down" size={18} color={MATCHPOINT_COLORS.navy} />
              ) : null}
            </Pressable>
          ) : null}

          {empresaPickerOpen
            ? empresas.map((empresa) => (
                <Pressable
                  key={empresa.id}
                  style={styles.empresaOption}
                  onPress={() => {
                    selectEmpresa(empresa);
                    setEmpresaPickerOpen(false);
                  }}>
                  <Text style={styles.empresaOptionText}>{empresa.empresa}</Text>
                </Pressable>
              ))
            : null}

          <View style={styles.actionButtons}>
            <AuthButton label="Cadastrar uma empresa" onPress={handleComingSoon} disabled={isSubmitting} />
            <AuthButton label="Resultados" onPress={handleResultados} disabled={isSubmitting} />
          </View>

          {selected ? (
            <>
              <Text style={styles.hint}>Clique sobre a imagem se quiser substituir</Text>

              <View style={styles.assetsRow}>
                {ASSET_SLOTS.map((slot) => (
                  <AssetCard
                    key={slot.id}
                    label={slot.label}
                    width={cardWidth}
                    imageUrl={getAssetPreviewUrl(slot.id)}
                    expandHeight={slot.id === 'banner'}
                    disabled={isSubmitting}
                    onPress={() => setPickingSlot(slot.id)}
                  />
                ))}
              </View>

              <View style={styles.form}>
                <CenteredField
                  label="WhatsApp"
                  value={form.telefone}
                  onChangeText={(value) => setField('telefone', value)}
                  editable={!isSubmitting}
                  keyboardType="phone-pad"
                />
                <CenteredField
                  label="Slogan"
                  value={form.slogan}
                  onChangeText={(value) => setField('slogan', value)}
                  editable={!isSubmitting}
                />
                <CenteredField
                  label="Instagram"
                  value={form.instagram}
                  onChangeText={(value) => setField('instagram', value)}
                  editable={!isSubmitting}
                  autoCapitalize="none"
                />
                <CenteredField
                  label="website"
                  value={form.website}
                  onChangeText={(value) => setField('website', value)}
                  editable={!isSubmitting}
                  autoCapitalize="none"
                />
                <CenteredField
                  label="redirecionamento"
                  value={form.direcionamento}
                  onChangeText={(value) => setField('direcionamento', value)}
                  editable={!isSubmitting}
                  autoCapitalize="none"
                />
              </View>
            </>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.saveWrap}>
            <AuthButton
              label={isSubmitting ? 'Salvando...' : 'Salvar as alterações'}
              onPress={() => void handleSave()}
              disabled={isSubmitting || !hasChanges}
            />
            <AuthButton label="Voltar" variant="voltar" onPress={handleBack} disabled={isSubmitting} />
          </View>
        </ScrollView>
      </WebScreenContainer>

      <PhotoSourceModal
        visible={pickingSlot != null}
        onClose={() => setPickingSlot(null)}
        onPhotoSelected={handlePhotoSelected}
        disabled={isSubmitting}
      />

      <DefinirPeriodoModal
        visible={resultadosPeriodoVisible}
        inicio={periodoInicio}
        fim={periodoFim}
        onClose={() => setResultadosPeriodoVisible(false)}
        onConfirm={(novoInicio, novoFim) => {
          setResultadosPeriodoVisible(false);

          const empresa = selected?.empresa?.trim();
          if (!empresa) {
            return;
          }

          setPeriodoInicio(novoInicio);
          setPeriodoFim(novoFim);
          void loadResultados(novoInicio, novoFim, empresa);
        }}
      />

      <ResultadosPublicidadeModal
        visible={mostrarResultados}
        empresa={selected?.empresa?.trim() ?? ''}
        periodoLabel={formatPublicidadePeriodo(periodoInicio, periodoFim)}
        totais={resultadosTotais}
        isLoading={isLoadingResultados}
        error={resultadosError}
        isGeneratingPdf={isGeneratingPdf}
        onClose={() => setMostrarResultados(false)}
        onGerarPdf={() => void handleGerarPdf()}
      />
    </SafeAreaView>
  );
}

function CenteredField({
  label,
  value,
  onChangeText,
  editable,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={MATCHPOINT_COLORS.placeholder}
      />
    </View>
  );
}

const DEFAULT_ASSET_HEIGHT = 220;

function AssetCard({
  label,
  width,
  imageUrl,
  expandHeight = false,
  disabled,
  onPress,
}: {
  label: string;
  width: number;
  imageUrl: string | null;
  expandHeight?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    setAspectRatio(null);
  }, [imageUrl]);

  function handleLoad(event: ImageLoadEventData) {
    if (!expandHeight) {
      return;
    }

    const sourceWidth = event.source?.width;
    const sourceHeight = event.source?.height;

    if (!sourceWidth || !sourceHeight || sourceWidth <= 0) {
      return;
    }

    setAspectRatio(sourceHeight / sourceWidth);
  }

  const imageHeight =
    expandHeight && aspectRatio != null
      ? Math.round(width * aspectRatio)
      : DEFAULT_ASSET_HEIGHT;

  const imageStyle = [styles.assetImage, { height: expandHeight ? imageHeight : DEFAULT_ASSET_HEIGHT }];

  return (
    <Pressable style={[styles.assetCard, { width }]} onPress={onPress} disabled={disabled}>
      <Text style={styles.assetLabel}>{label}</Text>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={imageStyle}
          contentFit="contain"
          onLoad={handleLoad}
        />
      ) : (
        <View style={[imageStyle, styles.assetPlaceholder]}>
          <Text style={styles.assetPlaceholderText}>Selecionar</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MATCHPOINT_COLORS.background,
  },
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 16,
  },
  empresaSelector: {
    minHeight: 48,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: MATCHPOINT_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: MATCHPOINT_COLORS.white,
  },
  empresaName: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  empresaOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  empresaOptionText: {
    color: MATCHPOINT_COLORS.blue,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    maxWidth: HOME_MAX_BUTTON_WIDTH,
    gap: 12,
  },
  hint: {
    color: MATCHPOINT_COLORS.blue,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  assetsRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  assetCard: {
    gap: 8,
    alignItems: 'center',
  },
  assetLabel: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  assetImage: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: MATCHPOINT_COLORS.readOnlyBackground,
  },
  assetPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetPlaceholderText: {
    color: MATCHPOINT_COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    width: '100%',
    maxWidth: 520,
    marginTop: 12,
  },
  field: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: MATCHPOINT_COLORS.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  fieldInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: MATCHPOINT_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 19,
    color: MATCHPOINT_COLORS.navy,
    backgroundColor: MATCHPOINT_COLORS.white,
    textAlign: 'center',
  },
  errorText: {
    color: MATCHPOINT_COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  saveWrap: {
    width: '100%',
    maxWidth: HOME_MAX_BUTTON_WIDTH,
    marginTop: 8,
    gap: 12,
  },
});
