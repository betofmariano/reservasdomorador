import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MATCHPOINT_COLORS } from '@/constants/theme';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAuth } from '@/contexts/auth-context';
import { useUserContext } from '@/contexts/user-context';
import { usePickerSheetLayout } from '@/hooks/use-picker-sheet-layout';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { getAtividadesByAcademia } from '@/services/atividades-service';
import type { ReservaAtividadeOption } from '@/types/mapa-diario-futuro';
import { sortAtividadesByNomePriority } from '@/utils/atividade-nome-priority';

type SelecionarAtividadeReservaModalProps = {
  visible: boolean;
  userId: number | undefined;
  onClose: () => void;
  onSelect: (atividade: ReservaAtividadeOption) => void;
  onAddLocal?: () => void;
};

const COLORS = {
  navy: MATCHPOINT_COLORS.navy,
  blue: MATCHPOINT_COLORS.blue,
  muted: MATCHPOINT_COLORS.muted,
  error: MATCHPOINT_COLORS.error,
  white: '#FFFFFF',
};

const LOAD_ERROR = 'Não foi possível carregar os dados dos seus locais.';
const EMPTY_LOCALS_MESSAGE = 'Selecione um local prioritário para reservar horários.';
const EMPTY_ACTIVITIES_MESSAGE = 'Não há atividades disponíveis neste local.';

export function SelecionarAtividadeReservaModal({
  visible,
  userId,
  onClose,
  onSelect,
  onAddLocal,
}: SelecionarAtividadeReservaModalProps) {
  const { authToken } = useAuth();
  const { effectiveAcademiasId, currentAcademia, permissions, isLoading: isContextLoading } = useUserContext();
  const [atividades, setAtividades] = useState<ReservaAtividadeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { overlayStyle, cardStyle } = usePickerSheetLayout({ maxWidth: WEB_MAX_CONTENT_WIDTH });

  const selectedLocalId = effectiveAcademiasId;

  const atividadesDoLocal = useMemo(() => {
    if (!selectedLocalId) {
      return [];
    }

    return sortAtividadesByNomePriority(
      atividades.filter((atividade) => atividade.academias_id === selectedLocalId),
    );
  }, [atividades, selectedLocalId]);

  const loadData = useCallback(async () => {
    if (!userId || isContextLoading) {
      if (!isContextLoading) {
        setAtividades([]);
        setErrorMessage('Não foi possível identificar o usuário.');
      }
      setIsLoading(isContextLoading);
      return;
    }

    if (!effectiveAcademiasId || !permissions.podeUsarLocal || !authToken) {
      setAtividades([]);
      setErrorMessage(EMPTY_LOCALS_MESSAGE);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const atividadesDoCondominio = await getAtividadesByAcademia(effectiveAcademiasId, authToken);
      const localNome = currentAcademia?.nome?.trim() || `Local #${effectiveAcademiasId}`;

      setAtividades(
        atividadesDoCondominio
          .filter((atividade) => atividade.academias_id === effectiveAcademiasId)
          .map((atividade) => ({
            id: atividade.id,
            nome: atividade.atividade,
            academias_id: atividade.academias_id,
            localNome,
            observacao: atividade.observacao,
          })),
      );
    } catch (error) {
      if (error instanceof ApiError && error.message) {
        setErrorMessage(error.message.includes('conectar') ? error.message : LOAD_ERROR);
      } else {
        setErrorMessage(getApiErrorMessage(error) || LOAD_ERROR);
      }

      setAtividades([]);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, currentAcademia?.nome, effectiveAcademiasId, isContextLoading, permissions.podeUsarLocal, userId]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    void loadData();
  }, [loadData, visible]);

  function handleClose() {
    onClose();
  }

  function handleSelect(atividade: ReservaAtividadeOption) {
    handleClose();
    onSelect(atividade);
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <Pressable style={[styles.overlay, overlayStyle]} onPress={handleClose}>
        <Pressable
          style={[styles.card, cardStyle]}
          onPress={(event) => event.stopPropagation()}>
          <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={COLORS.navy} />
          </Pressable>

          {isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={COLORS.blue} />
            </View>
          ) : errorMessage ? (
            <View style={styles.centerContent}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadData()}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
              {onAddLocal && errorMessage === EMPTY_LOCALS_MESSAGE ? (
                <Pressable style={styles.retryButton} onPress={onAddLocal}>
                  <Text style={styles.retryText}>Gerenciar meus locais</Text>
                </Pressable>
              ) : null}
            </View>
          ) : atividadesDoLocal.length === 0 ? (
            <View style={styles.centerContent}>
              <Text style={styles.emptyText}>{EMPTY_ACTIVITIES_MESSAGE}</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}>
              {atividadesDoLocal.map((atividade) => (
                <Pressable
                  key={atividade.id}
                  style={styles.activityButton}
                  onPress={() => handleSelect(atividade)}>
                  <Text style={styles.activityButtonText}>{atividade.nome}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    maxHeight: '80%',
    paddingTop: 44,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    padding: 4,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 24,
    minHeight: 120,
  },
  list: {
    maxHeight: 420,
  },
  listContent: {
    gap: 12,
    paddingBottom: 4,
  },
  activityButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  activityButtonText: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
});
