import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ClubSelectionModal } from '@/components/club-selection-modal';
import { UserAvatar } from '@/components/user-avatar';
import { getAtividadesByAcademia } from '@/services/atividades-service';
import type { Atividade } from '@/types/atividade';
import type { GestorUsuarioListItem } from '@/types/usuario';

type UsuarioSuspensaoAtividadeModalProps = {
  visible: boolean;
  usuario: GestorUsuarioListItem | null;
  academiasId: number | null;
  authToken: string | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (params: { atividadesId: number; dias: number }) => void;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  white: '#FFFFFF',
  error: '#D64545',
  muted: '#5C6475',
  border: '#D5DAE3',
};

const DEFAULT_DIAS = '7';

export function UsuarioSuspensaoAtividadeModal({
  visible,
  usuario,
  academiasId,
  authToken,
  isSubmitting = false,
  errorMessage = null,
  onClose,
  onConfirm,
}: UsuarioSuspensaoAtividadeModalProps) {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [isLoadingAtividades, setIsLoadingAtividades] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAtividadeId, setSelectedAtividadeId] = useState<number | null>(null);
  const [dias, setDias] = useState(DEFAULT_DIAS);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isActivityPickerOpen, setIsActivityPickerOpen] = useState(false);

  const selectedAtividade = useMemo(
    () => atividades.find((item) => item.id === selectedAtividadeId) ?? null,
    [atividades, selectedAtividadeId],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedAtividadeId(null);
    setDias(DEFAULT_DIAS);
    setValidationError(null);
    setLoadError(null);
    setAtividades([]);
  }, [usuario?.userslocalId, visible]);

  useEffect(() => {
    if (!visible || !authToken || !academiasId) {
      return;
    }

    let cancelled = false;

    setIsLoadingAtividades(true);
    setLoadError(null);

    void getAtividadesByAcademia(academiasId, authToken)
      .then((lista) => {
        if (cancelled) {
          return;
        }

        setAtividades(lista);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Não foi possível carregar as atividades.');
          setAtividades([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingAtividades(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [academiasId, authToken, visible]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  function handleConfirm() {
    if (!selectedAtividadeId) {
      setValidationError('Escolha a atividade.');
      return;
    }

    const parsedDias = Number(dias.trim());

    if (!Number.isFinite(parsedDias) || parsedDias <= 0) {
      setValidationError('Informe a quantidade de dias.');
      return;
    }

    setValidationError(null);
    onConfirm({
      atividadesId: selectedAtividadeId,
      dias: Math.trunc(parsedDias),
    });
  }

  const displayError = validationError ?? errorMessage;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
            {usuario ? (
              <View style={styles.avatarWrap}>
                <UserAvatar name={usuario.nome} photoUrl={usuario.foto} size={96} shape="rounded-rect" />
              </View>
            ) : null}

            <View style={styles.nameBox}>
              <Text style={styles.nameText}>{usuario?.nome ?? '—'}</Text>
            </View>

            <Pressable
              style={[styles.selector, (isSubmitting || isLoadingAtividades) && styles.selectorDisabled]}
              onPress={() => setIsActivityPickerOpen(true)}
              disabled={isSubmitting || isLoadingAtividades || !!loadError || atividades.length === 0}>
              {isLoadingAtividades ? (
                <ActivityIndicator size="small" color={COLORS.blue} />
              ) : (
                <>
                  <Text
                    style={[
                      styles.selectorText,
                      !selectedAtividade && styles.selectorPlaceholder,
                    ]}
                    numberOfLines={1}>
                    {selectedAtividade?.atividade ?? 'Escolha a atividade'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.navy} />
                </>
              )}
            </Pressable>

            {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

            <View style={styles.diasRow}>
              <Text style={styles.diasLabel}>Quantidade{'\n'}de dias</Text>
              <TextInput
                style={styles.diasInput}
                value={dias}
                onChangeText={(value) => {
                  setDias(value.replace(/\D/g, '').slice(0, 3));
                  if (validationError) {
                    setValidationError(null);
                  }
                }}
                keyboardType="number-pad"
                editable={!isSubmitting}
              />
            </View>

            {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

            <View style={styles.footerActions}>
              <Pressable
                style={[styles.footerButton, styles.closeButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleClose}
                disabled={isSubmitting}>
                <Ionicons name="arrow-back" size={18} color={COLORS.white} />
                <Text style={styles.footerButtonText}>Fechar</Text>
              </Pressable>

              <Pressable
                style={[styles.footerButton, styles.confirmButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleConfirm}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.footerButtonText}>Suspender</Text>
                    <Ionicons name="checkmark" size={18} color={COLORS.white} />
                  </>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ClubSelectionModal
        visible={isActivityPickerOpen}
        title="Escolha a atividade"
        maxHeight="60%"
        onClose={() => setIsActivityPickerOpen(false)}>
        {atividades.map((atividade) => (
          <Pressable
            key={atividade.id}
            style={styles.activityOption}
            onPress={() => {
              setSelectedAtividadeId(atividade.id);
              setValidationError(null);
              setIsActivityPickerOpen(false);
            }}>
            <Text
              style={[
                styles.activityOptionText,
                atividade.id === selectedAtividadeId && styles.activityOptionTextActive,
              ]}>
              {atividade.atividade}
            </Text>
          </Pressable>
        ))}
      </ClubSelectionModal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nameBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  selector: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectorDisabled: {
    opacity: 0.7,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.navy,
    marginRight: 8,
  },
  selectorPlaceholder: {
    color: COLORS.muted,
  },
  diasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  diasLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    lineHeight: 20,
  },
  diasInput: {
    width: 72,
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.navy,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  footerButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  closeButton: {
    backgroundColor: COLORS.navy,
  },
  confirmButton: {
    backgroundColor: COLORS.blue,
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  activityOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F6',
  },
  activityOptionText: {
    fontSize: 15,
    color: COLORS.navy,
  },
  activityOptionTextActive: {
    color: COLORS.blue,
    fontWeight: '700',
  },
});
