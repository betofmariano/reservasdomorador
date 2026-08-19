import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthTextField } from '@/components/auth-text-field';
import { UserAvatar } from '@/components/user-avatar';
import { HOME_MAX_BUTTON_WIDTH } from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { getApiErrorMessage } from '@/services/api-client';
import { getUserPhoto, updateUserPhoto } from '@/services/user-service';
import type { PhotoAsset } from '@/types/user-photo';
import type { UsuarioListItem } from '@/types/usuario';
import { appAlert } from '@/utils/app-dialog-bridge';
import { formatBrazilianMobilePhone } from '@/utils/phone-mask';
import {
  CameraLaunchError,
  CameraPermissionError,
  GalleryLaunchError,
  GalleryPermissionError,
  pickUserPhotoFromGallery,
  takeUserPhoto,
} from '@/utils/pick-user-photo';
import { getPortraitPhotoDimensions, normalizePhotoUrl, resolveUpdatedPhotoUrl } from '@/utils/user-photo';
import { buildWhatsAppUrl } from '@/utils/whatsapp-phone';

type UsuarioContatoModalProps = {
  visible: boolean;
  usuario: UsuarioListItem | null;
  onClose: () => void;
  photoSize?: number;
  showPhone?: boolean;
  allowPhotoChange?: boolean;
  authToken?: string | null;
  loadPhotoOnOpen?: boolean;
  onPhotoUpdated?: (photoUrl: string | null) => void;
  showComplementoField?: boolean;
  showSocioTituloField?: boolean;
  complemento?: string;
  socioTitulo?: string;
  allowFieldEdit?: boolean;
  onSaveExtraFields?: (values: {
    complemento?: string;
    socioTitulo?: string;
  }) => Promise<string | null>;
};

type PhotoStep = 'contact' | 'picker' | 'preview';

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  white: '#FFFFFF',
  border: '#D5DAE3',
  muted: '#5C6475',
  whatsapp: '#25D366',
  secondary: '#E8B830',
};

const INVALID_PHONE_MESSAGE = 'Este usuário não possui um telefone válido para WhatsApp.';
const OPEN_ERROR_MESSAGE = 'Não foi possível abrir o WhatsApp.';
const PHOTO_SAVE_ERROR_MESSAGE = 'Não foi possível atualizar a foto. Tente novamente.';
const FIELDS_SAVE_ERROR_MESSAGE = 'Não foi possível salvar as alterações. Tente novamente.';
const FIELDS_SAVE_SUCCESS_MESSAGE = 'Dados atualizados com sucesso.';

function handlePhotoPickerError(error: unknown) {
  if (error instanceof CameraPermissionError || error instanceof GalleryPermissionError) {
    void appAlert({ title: 'Permissão necessária', message: error.message });
    return;
  }

  if (error instanceof CameraLaunchError || error instanceof GalleryLaunchError) {
    void appAlert({ title: 'Erro', message: error.message });
  }
}

export function UsuarioContatoModal({
  visible,
  usuario,
  onClose,
  photoSize = 88,
  showPhone = false,
  allowPhotoChange = false,
  authToken = null,
  loadPhotoOnOpen = false,
  onPhotoUpdated,
  showComplementoField = false,
  showSocioTituloField = false,
  complemento = '',
  socioTitulo = '',
  allowFieldEdit = false,
  onSaveExtraFields,
}: UsuarioContatoModalProps) {
  const { showToast } = useAppToast();
  const [isOpeningWhatsApp, setIsOpeningWhatsApp] = useState(false);
  const [photoStep, setPhotoStep] = useState<PhotoStep>('contact');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoAsset | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isSavingFields, setIsSavingFields] = useState(false);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const [displayPhotoUrl, setDisplayPhotoUrl] = useState<string | null>(null);
  const [complementoDraft, setComplementoDraft] = useState('');
  const [socioTituloDraft, setSocioTituloDraft] = useState('');

  const isBusy = isOpeningWhatsApp || isSavingPhoto || isSavingFields;
  const showExtraFields = showComplementoField || showSocioTituloField;
  const canEditExtraFields = allowFieldEdit && Boolean(onSaveExtraFields);
  const hasExtraFieldChanges = useMemo(() => {
    const complementoChanged =
      showComplementoField && complementoDraft.trim() !== complemento.trim();
    const socioTituloChanged =
      showSocioTituloField && socioTituloDraft.trim() !== socioTitulo.trim();

    return complementoChanged || socioTituloChanged;
  }, [
    complemento,
    complementoDraft,
    showComplementoField,
    showSocioTituloField,
    socioTitulo,
    socioTituloDraft,
  ]);

  useEffect(() => {
    if (!visible) {
      setPhotoStep('contact');
      setSelectedPhoto(null);
      setIsSavingPhoto(false);
      setIsSavingFields(false);
      setIsLoadingPhoto(false);
      setDisplayPhotoUrl(null);
      setComplementoDraft('');
      setSocioTituloDraft('');
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setComplementoDraft(complemento);
    setSocioTituloDraft(socioTitulo);
  }, [complemento, socioTitulo, visible]);

  useEffect(() => {
    if (!visible || !usuario) {
      return;
    }

    setPhotoStep('contact');
    setSelectedPhoto(null);

    if (!loadPhotoOnOpen) {
      setDisplayPhotoUrl(usuario.foto ?? null);
      return;
    }

    if (!authToken || !usuario.userslocalId) {
      setDisplayPhotoUrl(null);
      return;
    }

    let cancelled = false;
    setIsLoadingPhoto(true);
    setDisplayPhotoUrl(null);

    void getUserPhoto(usuario.userslocalId, authToken)
      .then((foto) => {
        if (!cancelled) {
          setDisplayPhotoUrl(foto);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDisplayPhotoUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPhoto(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authToken, loadPhotoOnOpen, usuario, visible]);

  function handleClose() {
    if (isBusy) {
      return;
    }

    setPhotoStep('contact');
    setSelectedPhoto(null);
    onClose();
  }

  function handleBackToContact() {
    if (isBusy) {
      return;
    }

    setPhotoStep('contact');
    setSelectedPhoto(null);
  }

  function handleOpenPhotoPicker() {
    if (!allowPhotoChange || isBusy) {
      return;
    }

    setPhotoStep('picker');
  }

  async function handleTakePhoto() {
    if (!usuario || isBusy) {
      return;
    }

    try {
      const asset = await takeUserPhoto();

      if (asset) {
        setSelectedPhoto(asset);
        setPhotoStep('preview');
      }
    } catch (error) {
      handlePhotoPickerError(error);
    }
  }

  async function handleChooseFromGallery() {
    if (!usuario || isBusy) {
      return;
    }

    try {
      const asset = await pickUserPhotoFromGallery();

      if (asset) {
        setSelectedPhoto(asset);
        setPhotoStep('preview');
      }
    } catch (error) {
      handlePhotoPickerError(error);
    }
  }

  async function handleSavePhoto() {
    if (!usuario || !selectedPhoto || isSavingPhoto) {
      return;
    }

    if (!authToken) {
      void appAlert({ title: 'Erro', message: PHOTO_SAVE_ERROR_MESSAGE });
      return;
    }

    setIsSavingPhoto(true);

    try {
      const response = await updateUserPhoto(usuario.id, selectedPhoto, authToken);
      const updatedPhotoUrl = resolveUpdatedPhotoUrl(response, selectedPhoto.uri);

      setDisplayPhotoUrl(updatedPhotoUrl);
      onPhotoUpdated?.(updatedPhotoUrl);
      setSelectedPhoto(null);
      setPhotoStep('contact');
      showToast('Foto atualizada com sucesso.', { variant: 'success' });
    } catch (error) {
      showToast(getApiErrorMessage(error) || PHOTO_SAVE_ERROR_MESSAGE, { variant: 'error' });
    } finally {
      setIsSavingPhoto(false);
    }
  }

  async function handleSaveExtraFields() {
    if (!usuario || !onSaveExtraFields || !canEditExtraFields || isSavingFields || !hasExtraFieldChanges) {
      return;
    }

    const payload: { complemento?: string; socioTitulo?: string } = {};

    if (showComplementoField && complementoDraft.trim() !== complemento.trim()) {
      payload.complemento = complementoDraft.trim();
    }

    if (showSocioTituloField && socioTituloDraft.trim() !== socioTitulo.trim()) {
      payload.socioTitulo = socioTituloDraft.trim();
    }

    if (!('complemento' in payload) && !('socioTitulo' in payload)) {
      return;
    }

    setIsSavingFields(true);

    try {
      const error = await onSaveExtraFields(payload);

      if (error) {
        showToast(error || FIELDS_SAVE_ERROR_MESSAGE, { variant: 'error' });
        return;
      }

      showToast(FIELDS_SAVE_SUCCESS_MESSAGE, { variant: 'success' });
    } catch (error) {
      showToast(getApiErrorMessage(error) || FIELDS_SAVE_ERROR_MESSAGE, { variant: 'error' });
    } finally {
      setIsSavingFields(false);
    }
  }

  async function handleOpenWhatsApp() {
    if (!usuario || isOpeningWhatsApp) {
      return;
    }

    const whatsappUrl = buildWhatsAppUrl(usuario.telefoneLimpo);

    if (!whatsappUrl) {
      showToast(INVALID_PHONE_MESSAGE, { variant: 'error' });
      return;
    }

    setIsOpeningWhatsApp(true);

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);

      if (!supported) {
        showToast(OPEN_ERROR_MESSAGE, { variant: 'error' });
        return;
      }

      await Linking.openURL(whatsappUrl);
    } catch {
      showToast(OPEN_ERROR_MESSAGE, { variant: 'error' });
    } finally {
      setIsOpeningWhatsApp(false);
    }
  }

  if (!usuario) {
    return null;
  }

  const telefoneFormatado = formatBrazilianMobilePhone(usuario.telefoneLimpo);
  const portraitPhoto = getPortraitPhotoDimensions(photoSize);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          <View style={styles.content}>
            {photoStep === 'contact' ? (
              <>
                <View style={styles.avatarContainer}>
                  <UserAvatar
                    name={usuario.nome}
                    photoUrl={displayPhotoUrl}
                    size={portraitPhoto.width}
                    shape="rounded-rect"
                    onPress={allowPhotoChange ? handleOpenPhotoPicker : undefined}
                    showEditBadge={allowPhotoChange}
                  />
                  {isLoadingPhoto ? (
                    <View
                      style={[
                        styles.avatarLoadingOverlay,
                        {
                          width: portraitPhoto.width,
                          height: portraitPhoto.height,
                          borderRadius: portraitPhoto.borderRadius,
                        },
                      ]}>
                      <ActivityIndicator size="small" color={COLORS.blue} />
                    </View>
                  ) : null}
                </View>

                {allowPhotoChange ? (
                  <Pressable
                    style={styles.changePhotoLink}
                    onPress={handleOpenPhotoPicker}
                    disabled={isBusy}>
                    <Text style={styles.changePhotoLinkText}>Alterar foto</Text>
                  </Pressable>
                ) : null}

                <Text style={styles.name}>{usuario.nome}</Text>

                {showPhone ? (
                  <Text style={styles.phone}>{telefoneFormatado || 'Telefone não informado'}</Text>
                ) : null}

                {showExtraFields ? (
                  <View style={styles.extraFieldsContainer}>
                    {showSocioTituloField ? (
                      <AuthTextField
                        label="Sócio"
                        value={socioTituloDraft}
                        onChangeText={setSocioTituloDraft}
                        autoCapitalize="characters"
                        placeholder="Número do sócio"
                        editable={canEditExtraFields && !isBusy}
                      />
                    ) : null}

                    {showComplementoField ? (
                      <AuthTextField
                        label="Complemento"
                        value={complementoDraft}
                        onChangeText={setComplementoDraft}
                        autoCapitalize="sentences"
                        placeholder="Ex.: bloco, apartamento ou casa"
                        editable={canEditExtraFields && !isBusy}
                      />
                    ) : null}

                    {canEditExtraFields && hasExtraFieldChanges ? (
                      <Pressable
                        style={[styles.primaryButton, isBusy && styles.buttonDisabled]}
                        onPress={() => void handleSaveExtraFields()}
                        disabled={isBusy}>
                        {isSavingFields ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <Text style={styles.primaryButtonText}>Salvar alterações</Text>
                        )}
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                <Pressable
                  style={[styles.whatsappButton, isBusy && styles.buttonDisabled]}
                  onPress={() => void handleOpenWhatsApp()}
                  disabled={isBusy}>
                  {isOpeningWhatsApp ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.whatsappButtonText}>Conversar pelo WhatsApp</Text>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.closeButton, isBusy && styles.buttonDisabled]}
                  onPress={handleClose}
                  disabled={isBusy}>
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </Pressable>
              </>
            ) : photoStep === 'picker' ? (
            <>
              <Text style={styles.sectionTitle}>Alterar foto</Text>
              <Text style={styles.sectionHint}>Escolha como deseja enviar a nova foto.</Text>

              <Pressable style={styles.primaryButton} onPress={() => void handleTakePhoto()}>
                <Text style={styles.primaryButtonText}>Tirar foto</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => void handleChooseFromGallery()}>
                <Text style={styles.secondaryButtonText}>Escolher da galeria</Text>
              </Pressable>

              <Pressable style={styles.closeButton} onPress={handleBackToContact}>
                <Text style={styles.closeButtonText}>Voltar</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Prévia da foto</Text>

              {selectedPhoto ? (
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  style={[
                    styles.preview,
                    {
                      width: portraitPhoto.width,
                      height: portraitPhoto.height,
                      borderRadius: portraitPhoto.borderRadius,
                    },
                  ]}
                  resizeMode="cover"
                />
              ) : null}

              {isSavingPhoto ? (
                <View style={styles.savingRow}>
                  <ActivityIndicator size="small" color={COLORS.blue} />
                  <Text style={styles.savingText}>Enviando...</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.primaryButton, isSavingPhoto && styles.buttonDisabled]}
                onPress={() => void handleSavePhoto()}
                disabled={isSavingPhoto}>
                <Text style={styles.primaryButtonText}>
                  {isSavingPhoto ? 'Enviando...' : 'Salvar foto'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryButton, isSavingPhoto && styles.buttonDisabled]}
                onPress={() => {
                  setSelectedPhoto(null);
                  setPhotoStep('picker');
                }}
                disabled={isSavingPhoto}>
                <Text style={styles.secondaryButtonText}>Escolher outra</Text>
              </Pressable>

              <Pressable
                style={[styles.closeButton, isSavingPhoto && styles.buttonDisabled]}
                onPress={handleBackToContact}
                disabled={isSavingPhoto}>
                <Text style={styles.closeButtonText}>Voltar</Text>
              </Pressable>
            </>
          )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: HOME_MAX_BUTTON_WIDTH,
    alignSelf: 'center',
  },
  avatarContainer: {
    marginBottom: 8,
    position: 'relative',
    alignItems: 'center',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  changePhotoLink: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  changePhotoLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  phone: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  extraFieldsContainer: {
    width: '100%',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  preview: {
    marginBottom: 16,
    backgroundColor: '#E0E0E0',
  },
  whatsappButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: COLORS.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  whatsappButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  primaryButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  closeButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EBF1',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
  },
  buttonDisabled: {
    opacity: 0.7,
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
});
