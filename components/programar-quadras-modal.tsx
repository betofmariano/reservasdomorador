import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ProgramarQuadrasPanel } from '@/components/programar-quadras-panel';
import { HOME_MAX_BUTTON_WIDTH } from '@/constants/web-layout';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import type { User } from '@/types/user';

type ProgramarQuadrasModalProps = {
  visible: boolean;
  user: User;
  disabled?: boolean;
  onClose: () => void;
};

export function ProgramarQuadrasModal({
  visible,
  user,
  disabled = false,
  onClose,
}: ProgramarQuadrasModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={styles.card}>
          <View style={styles.panelHost}>
            {visible ? (
              <ProgramarQuadrasPanel user={user} disabled={disabled} onCancel={onClose} />
            ) : null}
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: MATCHPOINT_COLORS.overlay,
  },
  card: {
    backgroundColor: MATCHPOINT_COLORS.white,
    borderRadius: 16,
    maxHeight: '92%',
    width: '100%',
    maxWidth: HOME_MAX_BUTTON_WIDTH,
    alignSelf: 'center',
    overflow: 'hidden',
    zIndex: 1,
    minWidth: 0,
  },
  panelHost: {
    position: 'relative',
    width: '100%',
    maxWidth: HOME_MAX_BUTTON_WIDTH,
    minHeight: 420,
    maxHeight: '92%',
    overflow: 'hidden',
  },
});
