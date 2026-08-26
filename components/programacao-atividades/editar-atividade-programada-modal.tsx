import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { AuthTextField } from '@/components/auth-text-field';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import type { AtividadeProgramada } from '@/types/atividade-programada';
import {
  formatarDataHoraMatchPlace,
  parseCapacidadeProgramada,
} from '@/utils/programacao-atividades';

type EditarAtividadeProgramadaModalProps = {
  visible: boolean;
  item: AtividadeProgramada | null;
  isSaving?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSave: (capacidade: number) => void | Promise<void>;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  white: '#FFFFFF',
  error: '#D64545',
  muted: '#5C6475',
};

export function EditarAtividadeProgramadaModal({
  visible,
  item,
  isSaving = false,
  errorMessage = null,
  onClose,
  onSave,
}: EditarAtividadeProgramadaModalProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= WEB_MAX_CONTENT_WIDTH;

  const [capacidade, setCapacidade] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !item) {
      return;
    }

    setCapacidade(item.vagas != null ? String(item.vagas) : '');
    setFieldError(null);
  }, [item, visible]);

  function handleClose() {
    if (isSaving) {
      return;
    }

    onClose();
  }

  async function handleSubmit() {
    if (isSaving || !item) {
      return;
    }

    const parsed = parseCapacidadeProgramada(capacidade, item.reservas);

    if (!parsed.ok) {
      setFieldError(parsed.error);
      return;
    }

    setFieldError(null);
    await onSave(parsed.value);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}>
          <Pressable
            style={[styles.card, isWide && styles.cardWide]}
            onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>Editar capacidade</Text>
            {item ? (
              <>
                <Text style={styles.subtitle}>{item.atividadeNome}</Text>
                <Text style={styles.meta}>
                  {formatarDataHoraMatchPlace(item.dataAtividade, { includeYear: true })}
                </Text>
                <Text style={[styles.meta, styles.metaLast]}>Reservas: {item.reservas}</Text>
              </>
            ) : null}

            <AuthTextField
              label="Capacidade (vagas)"
              value={capacidade}
              onChangeText={(text) => {
                setCapacidade(text.replace(/[^\d]/g, ''));
                if (fieldError) {
                  setFieldError(null);
                }
              }}
              keyboardType="number-pad"
              editable={!isSaving}
            />
            {fieldError ? <Text style={styles.fieldError}>{fieldError}</Text> : null}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.actions}>
              <AuthButton
                label="Cancelar"
                variant="outline"
                onPress={handleClose}
                disabled={isSaving}
              />
              <AuthButton
                label={isSaving ? 'Salvando...' : 'Salvar'}
                onPress={() => void handleSubmit()}
                disabled={isSaving || !item}
              />
            </View>

            {isSaving ? (
              <View style={styles.savingRow}>
                <ActivityIndicator size="small" color={COLORS.blue} />
              </View>
            ) : null}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
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
  keyboardAvoiding: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  cardWide: {
    maxWidth: 480,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 2,
  },
  metaLast: {
    marginBottom: 16,
  },
  fieldError: {
    marginTop: -8,
    marginBottom: 12,
    fontSize: 13,
    color: COLORS.error,
  },
  errorText: {
    marginBottom: 12,
    fontSize: 13,
    color: COLORS.error,
  },
  actions: {
    marginTop: 8,
    gap: 10,
  },
  savingRow: {
    marginTop: 12,
    alignItems: 'center',
  },
});
