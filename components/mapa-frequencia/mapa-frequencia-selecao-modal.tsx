import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AtividadeSelector } from '@/components/atividade-selector';
import { ClubSelectionModal } from '@/components/club-selection-modal';
import type { AtividadeOption } from '@/types/atividade';
import type { HorarioMapaFrequenciaOption } from '@/types/mapa-frequencia';

type MapaFrequenciaSelecaoModalProps = {
  visible: boolean;
  atividades: AtividadeOption[];
  horarios: HorarioMapaFrequenciaOption[];
  selectedAtividadesId: number | null;
  selectedHorario: HorarioMapaFrequenciaOption;
  isLoadingAtividades: boolean;
  isLoadingHorarios: boolean;
  isConfirming: boolean;
  atividadesError: string | null;
  horariosError: string | null;
  onChangeAtividade: (atividadesId: number) => void;
  onChangeHorario: (horario: HorarioMapaFrequenciaOption) => void;
  onRetryAtividades: () => void;
  onRetryHorarios: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  white: '#FFFFFF',
  muted: '#5C6475',
  border: '#C5C5C5',
};

export function MapaFrequenciaSelecaoModal({
  visible,
  atividades,
  horarios,
  selectedAtividadesId,
  selectedHorario,
  isLoadingAtividades,
  isLoadingHorarios,
  isConfirming,
  atividadesError,
  horariosError,
  onChangeAtividade,
  onChangeHorario,
  onRetryAtividades,
  onRetryHorarios,
  onCancel,
  onConfirm,
}: MapaFrequenciaSelecaoModalProps) {
  const canConfirm =
    selectedAtividadesId != null &&
    !isConfirming &&
    !isLoadingAtividades &&
    !isLoadingHorarios &&
    !atividadesError &&
    !horariosError;

  return (
    <ClubSelectionModal
      visible={visible}
      title="Mapa de Frequência"
      onClose={isConfirming ? () => undefined : onCancel}
      scrollable={false}
      contentStyle={styles.modalContent}>
      <AtividadeSelector
        atividades={atividades}
        value={selectedAtividadesId}
        onChange={onChangeAtividade}
        isLoading={isLoadingAtividades}
        error={atividadesError}
        onRetry={onRetryAtividades}
        disabled={isConfirming}
        placeholder="Selecione a atividade"
      />

      <HorarioMapaFrequenciaSelector
        horarios={horarios}
        value={selectedHorario}
        onChange={onChangeHorario}
        isLoading={isLoadingHorarios}
        error={horariosError}
        onRetry={onRetryHorarios}
        disabled={!selectedAtividadesId || isConfirming}
      />

      {!isLoadingHorarios &&
      selectedAtividadesId != null &&
      horarios.length <= 1 &&
      !horariosError ? (
        <Text style={styles.helperText}>
          Não existem horários cadastrados para esta atividade.
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isConfirming}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.confirmButton, !canConfirm && styles.buttonDisabled]}
          onPress={onConfirm}
          disabled={!canConfirm}>
          {isConfirming ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          )}
        </Pressable>
      </View>
    </ClubSelectionModal>
  );
}

type HorarioMapaFrequenciaSelectorProps = {
  horarios: HorarioMapaFrequenciaOption[];
  value: HorarioMapaFrequenciaOption;
  onChange: (horario: HorarioMapaFrequenciaOption) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
};

function HorarioMapaFrequenciaSelector({
  horarios,
  value,
  onChange,
  isLoading = false,
  error = null,
  onRetry,
  disabled = false,
}: HorarioMapaFrequenciaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Horário</Text>
      <Pressable
        style={[styles.selector, (disabled || isLoading || !!error) && styles.selectorDisabled]}
        onPress={() => setIsOpen(true)}
        disabled={disabled || isLoading || !!error}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.blue} />
            <Text style={styles.loadingText}>Carregando horários...</Text>
          </View>
        ) : (
          <Text style={styles.selectorText}>{value.label}</Text>
        )}
      </Pressable>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <ClubSelectionModal visible={isOpen} title="Selecione o horário" onClose={() => setIsOpen(false)}>
        {horarios.map((horario) => (
          <Pressable
            key={horario.id ?? 'all'}
            style={styles.option}
            onPress={() => {
              onChange(horario);
              setIsOpen(false);
            }}>
            <Text style={styles.optionText}>{horario.label}</Text>
          </Pressable>
        ))}
      </ClubSelectionModal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    maxWidth: 420,
    alignSelf: 'center',
  },
  selectorContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 8,
  },
  selector: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  selectorDisabled: {
    opacity: 0.7,
  },
  selectorText: {
    fontSize: 16,
    color: COLORS.navy,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.navy,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#9AA0A6',
  },
  confirmButton: {
    backgroundColor: COLORS.blue,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  errorContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#D64545',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  optionText: {
    fontSize: 15,
    color: COLORS.blue,
  },
});
