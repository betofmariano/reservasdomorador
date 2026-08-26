import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import {
  getGuiaInstalacaoStepUrl,
  type GuiaInstalacao,
} from '@/constants/guia-instalacao';

type PassoAPassoInstalarModalProps = {
  visible: boolean;
  guia: GuiaInstalacao | null;
  onClose: () => void;
  /** Volta à seleção de guias (quando informado). */
  onBackToSelection?: () => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  white: '#FFFFFF',
  muted: '#5C6475',
  border: '#E2E6EE',
  cardBg: '#F4F6FA',
};

const MODAL_MAX_WIDTH = 400;
const OVERLAY_PADDING_H = 16;
const OVERLAY_PADDING_V = 24;
const CARD_PADDING = 16;
const CARD_CHROME_HEIGHT = 158;

export function PassoAPassoInstalarModal({
  visible,
  guia,
  onClose,
  onBackToSelection,
}: PassoAPassoInstalarModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [stepIndex, setStepIndex] = useState(0);
  const steps = guia?.steps ?? [];
  const totalSteps = steps.length;
  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = totalSteps > 0 && stepIndex >= totalSteps - 1;

  const layout = useMemo(() => {
    const cardWidth = Math.min(windowWidth - OVERLAY_PADDING_H * 2, MODAL_MAX_WIDTH);
    const cardMaxHeight = Math.min(windowHeight - OVERLAY_PADDING_V * 2, windowHeight * 0.92);
    const imageWidth = cardWidth - CARD_PADDING * 2;
    const imageHeight = Math.max(
      140,
      Math.min(cardMaxHeight - CARD_PADDING * 2 - CARD_CHROME_HEIGHT, imageWidth * (16 / 9)),
    );

    return {
      cardWidth,
      cardMaxHeight,
      imageHeight,
    };
  }, [windowHeight, windowWidth]);

  useEffect(() => {
    if (visible) {
      setStepIndex(0);
    }
  }, [visible, guia?.id]);

  if (!guia || !step) {
    return null;
  }

  const imageUri = getGuiaInstalacaoStepUrl(step.path);

  function handleBack() {
    if (isFirst) {
      if (onBackToSelection) {
        onBackToSelection();
        return;
      }

      onClose();
      return;
    }

    setStepIndex((current) => Math.max(0, current - 1));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              width: layout.cardWidth,
              maxWidth: MODAL_MAX_WIDTH,
              maxHeight: layout.cardMaxHeight,
            },
          ]}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {guia.label}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar guia de instalação"
              hitSlop={8}
              style={styles.closeButton}>
              <Ionicons name="close" size={22} color={COLORS.navy} />
            </Pressable>
          </View>

          <Text style={styles.stepTitle} numberOfLines={2}>
            {step.title}
          </Text>
          <Text style={styles.stepCounter}>{`${stepIndex + 1} de ${totalSteps}`}</Text>

          <View style={[styles.imageFrame, { height: layout.imageHeight }]}>
            <Image
              key={imageUri}
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="contain"
              accessibilityLabel={step.title}
            />
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.navButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={isFirst ? 'Voltar à seleção de guias' : 'Passo anterior'}>
              <Ionicons name="chevron-back" size={18} color={COLORS.white} />
              <Text style={styles.navButtonText} numberOfLines={1}>
                Voltar
              </Text>
            </Pressable>

            {isLast ? (
              <Pressable
                style={styles.navButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Concluir guia">
                <Text style={styles.navButtonText} numberOfLines={1}>
                  Concluir
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.navButton}
                onPress={() => setStepIndex((current) => Math.min(totalSteps - 1, current + 1))}
                accessibilityRole="button"
                accessibilityLabel="Próximo passo">
                <Text style={styles.navButtonText} numberOfLines={1}>
                  Avançar
                </Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: OVERLAY_PADDING_H,
    paddingVertical: OVERLAY_PADDING_V,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: CARD_PADDING,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 2,
  },
  stepCounter: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 10,
  },
  imageFrame: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  navButton: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 6,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    flexShrink: 1,
  },
});
