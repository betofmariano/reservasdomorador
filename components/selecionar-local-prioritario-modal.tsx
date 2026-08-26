import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import type { UserLocalSummary } from '@/types/user-context';

type SelecionarLocalPrioritarioModalProps = {
  visible: boolean;
  userLocals: UserLocalSummary[];
  isSubmitting: boolean;
  errorMessage?: string | null;
  onConfirm: (academiasId: number) => void;
  dismissible?: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  gold: '#C9A227',
  white: '#FFFFFF',
  gray: '#F4F6FA',
  border: '#E2E6EE',
  error: '#D64545',
  muted: '#5C6475',
};

function getLocalRoleLabel(local: UserLocalSummary): string | null {
  if (local.professor && local.gestor) {
    return 'Professor';
  }

  if (local.gestor) {
    return 'Gestor';
  }

  if (local.professor) {
    return 'Professor';
  }

  return null;
}

export function SelecionarLocalPrioritarioModal({
  visible,
  userLocals,
  isSubmitting,
  errorMessage,
  onConfirm,
  dismissible = false,
  onClose,
  title = 'Selecione seu local',
  subtitle = 'Você está associado a mais de um local. Escolha qual deseja usar agora.',
  confirmLabel = 'Continuar',
}: SelecionarLocalPrioritarioModalProps) {
  const { width: screenWidth } = useWindowDimensions();
  const shouldLimitWidth = Platform.OS === 'web' || screenWidth >= WEB_MAX_CONTENT_WIDTH;
  const [selectedAcademiasId, setSelectedAcademiasId] = useState<number | null>(null);

  const sortedUserLocals = useMemo(
    () => [...userLocals].sort((a, b) => a.academiaNome.localeCompare(b.academiaNome, 'pt-BR')),
    [userLocals],
  );

  useEffect(() => {
    if (!visible) {
      setSelectedAcademiasId(null);
    }
  }, [visible]);

  function handleConfirm() {
    if (selectedAcademiasId == null || isSubmitting) {
      return;
    }

    onConfirm(selectedAcademiasId);
  }

  function handleRequestClose() {
    if (dismissible) {
      onClose?.();
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleRequestClose}>
      <Pressable
        style={[styles.overlay, shouldLimitWidth && styles.overlayWide]}
        onPress={dismissible ? handleRequestClose : undefined}>
        <Pressable
          style={[styles.modalContainer, shouldLimitWidth && styles.modalContainerWide]}
          onPress={(event) => event.stopPropagation()}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.headerBand}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSubtitle}>{subtitle}</Text>
              </View>
              {dismissible ? (
                <Pressable style={styles.closeButton} onPress={handleRequestClose} hitSlop={8}>
                  <Ionicons name="close" size={28} color={COLORS.navy} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            {sortedUserLocals.map((local) => {
              const isSelected = selectedAcademiasId === local.academias_id;
              const roleLabel = getLocalRoleLabel(local);

              return (
                <Pressable
                  key={local.id}
                  style={[styles.localCard, isSelected && styles.localCardSelected]}
                  onPress={() => setSelectedAcademiasId(local.academias_id)}
                  disabled={isSubmitting}>
                  <View style={styles.localIconContainer}>
                    <Ionicons name="business-outline" size={28} color={COLORS.blue} />
                  </View>
                  <View style={styles.localInfo}>
                    <Text style={styles.localName}>{local.academiaNome}</Text>
                    {roleLabel ? <Text style={styles.localRole}>{roleLabel}</Text> : null}
                  </View>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={isSelected ? COLORS.blue : COLORS.muted}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable
            style={[
              styles.primaryButton,
              (selectedAcademiasId == null || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={selectedAcademiasId == null || isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>{confirmLabel}</Text>
            )}
          </Pressable>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  overlayWide: {
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    maxHeight: '85%',
    width: '100%',
    overflow: 'hidden',
  },
  modalContainerWide: {
    maxWidth: WEB_MAX_CONTENT_WIDTH,
  },
  safeArea: {
    maxHeight: '100%',
  },
  headerBand: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.navy,
  },
  scrollArea: {
    maxHeight: 360,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  localCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  localCardSelected: {
    borderColor: COLORS.blue,
    backgroundColor: '#EAF1FB',
  },
  localIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  localInfo: {
    flex: 1,
  },
  localName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  localRole: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.blue,
  },
  errorText: {
    marginHorizontal: 20,
    marginTop: 8,
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    height: 52,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 26,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
});
