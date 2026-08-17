import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image, type ImageLoadEventData } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Patrocinador, PublicidadeLinkButton } from '@/types/publicidade';
import type { User } from '@/types/user';
import { registrarImpressaoBanner } from '@/services/publicidade-service';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { PUBLICIDADE_COUNTDOWN_SECONDS } from '@/utils/publicidade-interval';
import { getPublicidadeLinkClickDisplay } from '@/utils/publicidade-display';
import {
  buildInstagramUrl,
  buildWhatsAppUrl,
  normalizeExternalUrl,
  openExternalLink,
} from '@/utils/publicidade-links';
import {
  getPatrocinadorBannerImageUrl,
  getPatrocinadorTitulo,
} from '@/utils/publicidade-patrocinador';

type PublicidadeModalProps = {
  visible: boolean;
  user: User | null;
  patrocinador: Patrocinador | null;
  onImpressionReady: () => void;
  onImageError: () => void;
  onClose: () => void;
  showCountdown?: boolean;
  trackImpression?: boolean;
  trackLinkImpression?: boolean;
};

const COLORS = {
  background: '#FFFFFF',
  navy: '#1B2B4B',
  blue: '#2456A8',
  whatsapp: '#25D366',
  white: '#FFFFFF',
};

const ICON_BUTTON_SIZE = 62;
const ICON_GLYPH_SIZE = 31;
const CLOSE_CONTROL_HEIGHT = 62;

type ImageLayoutSize = {
  width: number;
  height: number;
};

function getBannerContentFit(
  container: ImageLayoutSize,
  image: ImageLayoutSize,
): 'contain' | 'fill' {
  if (
    container.width <= 0 ||
    container.height <= 0 ||
    image.width <= 0 ||
    image.height <= 0
  ) {
    return 'contain';
  }

  const scale = Math.min(container.width / image.width, container.height / image.height);
  const renderedHeight = image.height * scale;

  return renderedHeight < container.height - 1 ? 'fill' : 'contain';
}

function buildLinkButtons(patrocinador: Patrocinador): PublicidadeLinkButton[] {
  const buttons: PublicidadeLinkButton[] = [];

  const whatsappUrl = buildWhatsAppUrl(patrocinador.telefone);
  if (whatsappUrl) {
    buttons.push({ action: 'whatsapp', label: 'WhatsApp', url: whatsappUrl });
  }

  const instagramUrl = buildInstagramUrl(patrocinador.instagram);
  if (instagramUrl) {
    buttons.push({ action: 'instagram', label: 'Instagram', url: instagramUrl });
  }

  const deliveryUrl = normalizeExternalUrl(patrocinador.direcionamento);
  const websiteUrl = normalizeExternalUrl(patrocinador.website);

  if (deliveryUrl) {
    buttons.push({ action: 'delivery', label: 'Delivery', url: deliveryUrl });
  } else if (websiteUrl) {
    buttons.push({ action: 'website', label: 'Site', url: websiteUrl });
  }

  return buttons;
}

function getLinkIconName(action: PublicidadeLinkButton['action']): keyof typeof Ionicons.glyphMap {
  if (action === 'whatsapp') {
    return 'logo-whatsapp';
  }

  if (action === 'instagram') {
    return 'logo-instagram';
  }

  if (action === 'website') {
    return 'globe-outline';
  }

  return 'cart-outline';
}

function getLinkIconColor(action: PublicidadeLinkButton['action']): string {
  if (action === 'whatsapp') {
    return COLORS.whatsapp;
  }

  return COLORS.blue;
}

export function PublicidadeModal({
  visible,
  user,
  patrocinador,
  onImpressionReady,
  onImageError,
  onClose,
  showCountdown = true,
  trackImpression = true,
  trackLinkImpression = false,
}: PublicidadeModalProps) {
  const [canClose, setCanClose] = useState(false);
  const [countdown, setCountdown] = useState(PUBLICIDADE_COUNTDOWN_SECONDS);
  const [isImageReady, setIsImageReady] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState<ImageLayoutSize | null>(null);
  const [imageAreaSize, setImageAreaSize] = useState<ImageLayoutSize | null>(null);
  const [linkErrorMessage, setLinkErrorMessage] = useState<string | null>(null);
  const [openingAction, setOpeningAction] = useState<PublicidadeLinkButton['action'] | null>(
    null,
  );

  const impressionSentRef = useRef(false);
  const impressedPatrocinadorIdRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { width: screenWidth } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' || screenWidth >= WEB_MAX_CONTENT_WIDTH;

  const imageUrl = patrocinador ? getPatrocinadorBannerImageUrl(patrocinador) : null;
  const titulo = patrocinador ? getPatrocinadorTitulo(patrocinador) : null;
  const linkButtons = useMemo(
    () => (patrocinador ? buildLinkButtons(patrocinador) : []),
    [patrocinador],
  );
  const bannerContentFit = useMemo(() => {
    if (!imageNaturalSize || !imageAreaSize) {
      return 'contain' as const;
    }

    return getBannerContentFit(imageAreaSize, imageNaturalSize);
  }, [imageAreaSize, imageNaturalSize]);

  useEffect(() => {
    if (!visible) {
      setCanClose(false);
      setCountdown(PUBLICIDADE_COUNTDOWN_SECONDS);
      setIsImageReady(false);
      setImageNaturalSize(null);
      setImageAreaSize(null);
      setLinkErrorMessage(null);
      setOpeningAction(null);
      impressionSentRef.current = false;
      impressedPatrocinadorIdRef.current = null;

      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      return;
    }

    if (!showCountdown) {
      setCanClose(true);
      setCountdown(0);
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canClose) {
        onClose();
      }

      return !canClose;
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (canClose) {
          onClose();
          return;
        }

        event.preventDefault();
        event.stopPropagation();
      }
    }

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown, true);
    }

    return () => {
      backHandler.remove();

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('keydown', handleKeyDown, true);
      }
    };
  }, [canClose, onClose, showCountdown, visible]);

  useEffect(() => {
    if (!visible || !isImageReady || !showCountdown) {
      return;
    }

    setCountdown(PUBLICIDADE_COUNTDOWN_SECONDS);
    setCanClose(false);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }

          setCanClose(true);

          if (__DEV__) {
            console.log('Publicidade encerrada após 5 segundos');
          }

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [isImageReady, showCountdown, visible]);

  function handleImageLoad(event: ImageLoadEventData) {
    setImageNaturalSize({
      width: event.source.width,
      height: event.source.height,
    });
    setIsImageReady(true);

    if (!trackImpression || impressionSentRef.current) {
      return;
    }

    if (patrocinador && impressedPatrocinadorIdRef.current === patrocinador.id) {
      return;
    }

    impressionSentRef.current = true;
    impressedPatrocinadorIdRef.current = patrocinador?.id ?? null;
    onImpressionReady();
  }

  async function handleOpenLink(button: PublicidadeLinkButton) {
    if (openingAction) {
      return;
    }

    if (trackLinkImpression && user?.id && patrocinador) {
      void registrarImpressaoBanner({
        user,
        patrocinador,
        display: getPublicidadeLinkClickDisplay(button.action),
      });
    }

    setOpeningAction(button.action);
    setLinkErrorMessage(null);

    const errorMessage = await openExternalLink(button.url);

    if (errorMessage) {
      setLinkErrorMessage(errorMessage);
    }

    setOpeningAction(null);
  }

  if (!visible || !patrocinador || !imageUrl) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (canClose) {
          onClose();
        }
      }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            {titulo ? <Text style={styles.title}>{titulo}</Text> : null}
          </View>

          <View
            style={styles.imageArea}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setImageAreaSize({ width, height });
            }}>
            {!isImageReady ? (
              <ActivityIndicator size="large" color={COLORS.blue} style={styles.imageLoader} />
            ) : null}
            <Image
              source={{ uri: imageUrl }}
              style={styles.bannerImage}
              contentFit={bannerContentFit}
              onLoad={handleImageLoad}
              onError={onImageError}
            />
          </View>

          <View style={[styles.footer, isLargeScreen && styles.footerLargeScreen]}>
            {linkErrorMessage ? <Text style={styles.linkError}>{linkErrorMessage}</Text> : null}

            <View style={styles.footerRow}>
              <View style={styles.iconsRow}>
                {linkButtons.map((button) => (
                  <Pressable
                    key={button.action}
                    style={[
                      styles.iconButton,
                      { backgroundColor: getLinkIconColor(button.action) },
                      openingAction === button.action && styles.iconButtonDisabled,
                    ]}
                    disabled={Boolean(openingAction)}
                    accessibilityLabel={button.label}
                    onPress={() => void handleOpenLink(button)}>
                    <Ionicons
                      name={getLinkIconName(button.action)}
                      size={ICON_GLYPH_SIZE}
                      color={COLORS.white}
                    />
                  </Pressable>
                ))}
              </View>

              <View style={styles.closeSlot}>
                {!showCountdown || canClose ? (
                  <Pressable style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>Fechar</Text>
                  </Pressable>
                ) : (
                  <View style={styles.countdownCircle}>
                    <Text style={styles.countdownText}>{countdown}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  imageArea: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLoader: {
    position: 'absolute',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    maxHeight: '100%',
  },
  footer: {
    flexShrink: 0,
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E6EE',
  },
  footerLargeScreen: {
    alignSelf: 'center',
    maxWidth: WEB_MAX_CONTENT_WIDTH,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: CLOSE_CONTROL_HEIGHT,
  },
  iconsRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: ICON_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDisabled: {
    opacity: 0.7,
  },
  closeSlot: {
    flexShrink: 0,
    minWidth: 80,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  countdownCircle: {
    width: CLOSE_CONTROL_HEIGHT,
    height: CLOSE_CONTROL_HEIGHT,
    borderRadius: CLOSE_CONTROL_HEIGHT / 2,
    borderWidth: 2,
    borderColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
  },
  closeButton: {
    minWidth: 88,
    height: CLOSE_CONTROL_HEIGHT,
    borderRadius: CLOSE_CONTROL_HEIGHT / 2,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  linkError: {
    color: '#D64545',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
