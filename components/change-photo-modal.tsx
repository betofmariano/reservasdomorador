import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { HOME_MAX_BUTTON_WIDTH } from '@/constants/web-layout';
import { getApiErrorMessage } from '@/services/api-client';
import {
  resolveAcademiaNameById,
  submitSolicitacaoFotoAlteracao,
} from '@/services/solicitar-foto-alteracao-service';
import type { PhotoAsset } from '@/types/user-photo';
import { appAlert } from '@/utils/app-dialog-bridge';
import { MEUS_DADOS_MESSAGES } from '@/utils/meus-dados';
import {
  CameraLaunchError,
  CameraPermissionError,
  GalleryLaunchError,
  GalleryPermissionError,
  pickUserPhotoFromGallery,
  takeUserPhoto,
} from '@/utils/pick-user-photo';

type ChangePhotoModalProps = {
  visible: boolean;
  onClose: () => void;
};

type ModalStep = 'menu' | 'preview' | 'success';

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  white: '#FFFFFF',
  muted: '#5C6475',
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

export function ChangePhotoModal({ visible, onClose }: ChangePhotoModalProps) {
  const { user, authToken, patchUser } = useAuth();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState<ModalStep>('menu');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoAsset | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleClose() {
    if (isSaving) {
      return;
    }

    setStep('menu');
    setSelectedPhoto(null);
    onClose();
  }

  function ensureUserIdentified(): boolean {
    if (!user?.id) {
      void appAlert({
        title: 'Erro',
        message: 'Não foi possível identificar o usuário.',
      });
      return false;
    }

    return true;
  }

  async function handleTakePhoto() {
    if (!ensureUserIdentified()) {
      return;
    }

    try {
      const asset = await takeUserPhoto();

      if (asset) {
        setSelectedPhoto(asset);
        setStep('preview');
      }
    } catch (error) {
      handlePhotoPickerError(error);
    }
  }

  async function handleChooseFromGallery() {
    if (!ensureUserIdentified()) {
      return;
    }

    try {
      const asset = await pickUserPhotoFromGallery();

      if (asset) {
        setSelectedPhoto(asset);
        setStep('preview');
      }
    } catch (error) {
      handlePhotoPickerError(error);
    }
  }

  async function handleSavePhoto() {
    if (isSaving || !selectedPhoto) {
      return;
    }

    if (!user?.id || !authToken) {
      void appAlert({
        title: 'Erro',
        message: 'Não foi possível identificar o usuário.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const clubName = await resolveAcademiaNameById(user.academias_id);

      const photoUrl = await submitSolicitacaoFotoAlteracao({
        user,
        photoAsset: selectedPhoto,
        authToken,
        larguraPagina: Math.round(width),
        clubName,
      });

      patchUser({ foto: photoUrl });
      setStep('success');
    } catch (error) {
      void appAlert({ title: 'Erro', message: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }

  function handleChooseAnother() {
    if (isSaving) {
      return;
    }

    setSelectedPhoto(null);
    setStep('menu');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {step === 'menu' ? (
            <>
              <Text style={styles.title}>Alterar foto</Text>
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  A foto deve ser uma foto de perfil que possa te identificar. Outras fotos serão
                  descartadas.
                </Text>
              </View>
              <Text style={styles.analysisHint}>
                Escolha uma nova foto para o seu perfil. Ela será salva imediatamente.
              </Text>

              <Pressable
                style={styles.actionButton}
                onPress={handleTakePhoto}
                disabled={isSaving}>
                <Text style={styles.actionButtonText}>Tirar foto</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={handleChooseFromGallery}
                disabled={isSaving}>
                <Text style={styles.secondaryButtonText}>Escolher da galeria</Text>
              </Pressable>

              <Pressable style={styles.cancelButton} onPress={handleClose} disabled={isSaving}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </>
          ) : step === 'preview' ? (
            <>
              <Text style={styles.title}>Prévia da foto</Text>
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  A foto deve ser uma foto de perfil que possa te identificar. Outras fotos serão
                  descartadas.
                </Text>
              </View>
              <Text style={styles.analysisHint}>
                Confira a prévia e envie para atualizar seu perfil imediatamente.
              </Text>

              {selectedPhoto ? (
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  style={styles.preview}
                  resizeMode="cover"
                />
              ) : null}

              {isSaving ? (
                <View style={styles.savingRow}>
                  <ActivityIndicator size="small" color={COLORS.blue} />
                  <Text style={styles.savingText}>Enviando...</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.actionButton, isSaving && styles.disabledButton]}
                onPress={handleSavePhoto}
                disabled={isSaving}>
                <Text style={styles.actionButtonText}>
                  {isSaving ? 'Enviando...' : 'Enviar foto'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryButton, isSaving && styles.disabledButton]}
                onPress={handleChooseAnother}
                disabled={isSaving}>
                <Text style={styles.secondaryButtonText}>Escolher outra</Text>
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isSaving}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Foto atualizada</Text>
              <Text style={styles.successMessage}>{MEUS_DADOS_MESSAGES.photoSuccess}</Text>

              <Pressable style={styles.actionButton} onPress={handleClose}>
                <Text style={styles.actionButtonText}>OK</Text>
              </Pressable>
            </>
          )}
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
    paddingHorizontal: 20,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: HOME_MAX_BUTTON_WIDTH,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
    textAlign: 'center',
  },
  warningBox: {
    width: '100%',
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#E8B830',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    lineHeight: 22,
  },
  analysisHint: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: '#E0E0E0',
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
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  savingText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
