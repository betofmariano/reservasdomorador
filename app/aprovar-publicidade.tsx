import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image, type ImageLoadEventData } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AuthButton } from '@/components/auth-button';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { WebScreenContainer } from '@/components/web-screen-container';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { HOME_MAX_BUTTON_WIDTH, WEB_MAX_WIDE_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import {
  APROVAR_PUBLICIDADE_MESSAGES,
  useAprovarPublicidadeScreen,
} from '@/hooks/use-aprovar-publicidade-screen';

export default function AprovarPublicidadeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { showToast } = useAppToast();
  const { user, authToken, isLoading: isAuthLoading } = useAuth();
  const [empresaPickerOpen, setEmpresaPickerOpen] = useState(false);

  const {
    canAccess,
    empresas,
    selected,
    pendencias,
    isLoading,
    isSubmitting,
    error,
    selectEmpresa,
    confirm,
  } = useAprovarPublicidadeScreen(user, authToken, isAuthLoading);

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    if (!canAccess) {
      router.replace('/administracao');
    }
  }, [canAccess, isAuthLoading, router, user]);

  const imageWidth = Math.max(140, Math.min(width - 64, 420));

  async function handleConfirm() {
    const message = await confirm();

    if (message) {
      showToast(message, { variant: 'error' });
      return;
    }

    showToast(APROVAR_PUBLICIDADE_MESSAGES.confirmed, { variant: 'success' });
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/administracao');
  }

  if (isAuthLoading || !user || !canAccess) {
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

  const hasPendencias = pendencias.textos.length > 0 || pendencias.imagens.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={WEB_MAX_WIDE_CONTENT_WIDTH} style={styles.screen}>
        <ScreenHeader user={user} title="Aprovar Publicidade" />
        <ScreenHeaderDivider />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? <ActivityIndicator size="large" color={MATCHPOINT_COLORS.blue} /> : null}

          {!isLoading && empresas.length === 0 ? (
            <Text style={styles.emptyText}>{APROVAR_PUBLICIDADE_MESSAGES.empty}</Text>
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

          {pendencias.textos.map((texto) => (
            <View key={texto.key} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{texto.label}</Text>
              <Text style={styles.sideLabel}>Atual</Text>
              <Text style={styles.fieldValue}>{texto.atual || '—'}</Text>
              <Text style={styles.sideLabel}>Novo</Text>
              <Text style={styles.fieldValueNovo}>{texto.novo}</Text>
            </View>
          ))}

          {pendencias.imagens.map((imagem) => (
            <View key={imagem.key} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{imagem.label}</Text>
              <ApprovalImage label="Atual" imageUrl={imagem.atualUrl} width={imageWidth} />
              <ApprovalImage
                label="Novo"
                imageUrl={imagem.novoUrl}
                width={imageWidth}
                expandHeight={imagem.key === 'banner'}
              />
            </View>
          ))}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            {hasPendencias ? (
              <AuthButton
                label={isSubmitting ? 'Confirmando...' : 'Confirmar'}
                onPress={() => void handleConfirm()}
                disabled={isSubmitting}
              />
            ) : null}
            <AuthButton label="Voltar" variant="voltar" onPress={handleBack} disabled={isSubmitting} />
          </View>
        </ScrollView>
      </WebScreenContainer>
    </SafeAreaView>
  );
}

const DEFAULT_IMAGE_HEIGHT = 220;

function ApprovalImage({
  label,
  imageUrl,
  width,
  expandHeight = false,
}: {
  label: string;
  imageUrl: string | null;
  width: number;
  expandHeight?: boolean;
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

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
      : DEFAULT_IMAGE_HEIGHT;

  return (
    <View style={[styles.imageBlock, { width }]}>
      <Text style={styles.sideLabel}>{label}</Text>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { height: imageHeight }]}
          contentFit="contain"
          onLoad={handleLoad}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder, { height: DEFAULT_IMAGE_HEIGHT }]}>
          <Text style={styles.placeholderText}>Sem imagem</Text>
        </View>
      )}
    </View>
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
  emptyText: {
    color: MATCHPOINT_COLORS.muted,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 24,
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
  fieldBlock: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  sideLabel: {
    color: MATCHPOINT_COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  fieldValue: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 16,
    textAlign: 'center',
  },
  fieldValueNovo: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  imageBlock: {
    alignItems: 'center',
    gap: 6,
  },
  image: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: MATCHPOINT_COLORS.readOnlyBackground,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: MATCHPOINT_COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: MATCHPOINT_COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: HOME_MAX_BUTTON_WIDTH,
    marginTop: 8,
    gap: 12,
  },
});
