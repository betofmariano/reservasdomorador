import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useClubSelectionModalLayout } from '@/hooks/use-club-selection-modal-layout';
import type { PhotoAsset } from '@/types/user-photo';
import { appAlert } from '@/utils/app-dialog-bridge';
import {
  CameraLaunchError,
  CameraPermissionError,
  GalleryLaunchError,
  GalleryPermissionError,
  pickUserPhotoFromGallery,
  takeUserPhoto,
} from '@/utils/pick-user-photo';

type PhotoSourceModalProps = {
  visible: boolean;
  onClose: () => void;
  onPhotoSelected: (asset: PhotoAsset) => void;
  disabled?: boolean;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  white: '#FFFFFF',
};

function handlePhotoPickerError(error: unknown) {
  if (error instanceof CameraPermissionError || error instanceof GalleryPermissionError) {
    void appAlert({ title: 'Permissão necessária', message: error.message });
    return;
  }

  if (error instanceof CameraLaunchError || error instanceof GalleryLaunchError) {
    void appAlert({ title: 'Erro', message: error.message });
  }
}

export async function handleTakePhoto(
  onPhotoSelected: (asset: PhotoAsset) => void,
  onClose: () => void,
): Promise<void> {
  try {
    const asset = await takeUserPhoto();

    if (asset) {
      onPhotoSelected(asset);
      onClose();
    }
  } catch (error) {
    handlePhotoPickerError(error);
  }
}

export async function handleChooseFromGallery(
  onPhotoSelected: (asset: PhotoAsset) => void,
  onClose: () => void,
): Promise<void> {
  try {
    const asset = await pickUserPhotoFromGallery();

    if (asset) {
      onPhotoSelected(asset);
      onClose();
    }
  } catch (error) {
    handlePhotoPickerError(error);
  }
}

export function PhotoSourceModal({
  visible,
  onClose,
  onPhotoSelected,
  disabled = false,
}: PhotoSourceModalProps) {
  const { overlayStyle, contentStyle } = useClubSelectionModalLayout({
    maxWidth: WEB_MAX_CONTENT_WIDTH,
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, overlayStyle]}>
        <View style={[styles.content, contentStyle]}>
          <Text style={styles.title}>Selecionar foto</Text>

          <Pressable
            style={styles.actionButton}
            onPress={() => handleTakePhoto(onPhotoSelected, onClose)}
            disabled={disabled}>
            <Text style={styles.actionButtonText}>Tirar foto</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => handleChooseFromGallery(onPhotoSelected, onClose)}
            disabled={disabled}>
            <Text style={styles.secondaryButtonText}>Escolher da galeria</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={onClose} disabled={disabled}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
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
    paddingHorizontal: 32,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    backgroundColor: COLORS.blue,
    borderRadius: 24,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#E8B830',
    borderRadius: 24,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
