import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AcademiaSelector } from '@/components/academia-selector';
import { AtividadeSelector } from '@/components/atividade-selector';
import { HorarioSelect } from '@/components/lista-presenca/horario-select';
import { BotaoGerarPdf } from '@/components/lista-presenca/botao-gerar-pdf';
import type { Academia } from '@/types/academia';
import type { AtividadeOption } from '@/types/atividade';
import type { HorarioPresencaOption, ListaPresencaSortMode } from '@/types/presenca';
import type { GerarListaPresencaPdfInput } from '@/utils/gerar-lista-presenca-pdf';
import { LISTA_PRESENCA_MESSAGES } from '@/hooks/use-lista-presenca-screen';

type FiltrosListaPresencaProps = {
  academias: Academia[];
  selectedAcademiasId: number | null;
  onChangeAcademia: (academiasId: number) => void;
  showClubSelector: boolean;
  localNome?: string | null;
  isLoadingClubs: boolean;
  clubsError: string | null;
  onRetryClubs: () => void;
  atividades: AtividadeOption[];
  selectedAtividadesId: number | null;
  onChangeAtividade: (atividadesId: number) => void;
  showAtividadeSelector: boolean;
  isLoadingAtividades: boolean;
  atividadesError: string | null;
  onRetryAtividades: () => void;
  horarios: HorarioPresencaOption[];
  selectedHorario: HorarioPresencaOption | null;
  onChangeHorario: (horario: HorarioPresencaOption) => void;
  showHorarioSelector: boolean;
  isLoadingHorarios: boolean;
  horariosError: string | null;
  onRetryHorarios: () => void;
  sortMode: ListaPresencaSortMode;
  onChangeSortMode: (mode: ListaPresencaSortMode) => void;
  pdfInput?: GerarListaPresencaPdfInput | null;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  muted: '#5C6475',
  border: '#D5DAE3',
};

export function FiltrosListaPresenca({
  academias,
  selectedAcademiasId,
  onChangeAcademia,
  showClubSelector,
  localNome = null,
  isLoadingClubs,
  clubsError,
  onRetryClubs,
  atividades,
  selectedAtividadesId,
  onChangeAtividade,
  showAtividadeSelector,
  isLoadingAtividades,
  atividadesError,
  onRetryAtividades,
  horarios,
  selectedHorario,
  onChangeHorario,
  showHorarioSelector,
  isLoadingHorarios,
  horariosError,
  onRetryHorarios,
  sortMode,
  onChangeSortMode,
  pdfInput = null,
}: FiltrosListaPresencaProps) {
  const showSortOptions = useMemo(
    () => !!selectedHorario && horarios.length > 0,
    [horarios.length, selectedHorario],
  );

  return (
    <View style={styles.container}>
      {showClubSelector ? (
        <AcademiaSelector
          academias={academias}
          value={selectedAcademiasId}
          onChange={onChangeAcademia}
          isLoading={isLoadingClubs}
          error={clubsError}
          onRetry={onRetryClubs}
        />
      ) : localNome ? (
        <View style={styles.readonlyField}>
          <Text style={styles.readonlyLabel}>Local</Text>
          <Text style={styles.readonlyValue}>{localNome}</Text>
        </View>
      ) : null}

      {selectedAcademiasId ? (
        showAtividadeSelector || atividades.length === 0 || isLoadingAtividades ? (
          <AtividadeSelector
            atividades={atividades}
            value={selectedAtividadesId}
            onChange={onChangeAtividade}
            isLoading={isLoadingAtividades}
            error={atividadesError}
            onRetry={onRetryAtividades}
            emptyPlaceholder="Nenhuma atividade cadastrada neste local"
          />
        ) : selectedAtividadesId && atividades.length === 1 ? (
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyLabel}>Atividade</Text>
            <Text style={styles.readonlyValue}>{atividades[0]?.nome}</Text>
          </View>
        ) : null
      ) : null}

      {showHorarioSelector ? (
        <HorarioSelect
          horarios={horarios}
          value={selectedHorario}
          onChange={onChangeHorario}
          isLoading={isLoadingHorarios}
          error={horariosError}
          onRetry={onRetryHorarios}
        />
      ) : null}

      {isLoadingHorarios ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.blue} />
          <Text style={styles.loadingText}>{LISTA_PRESENCA_MESSAGES.loadHorarios}</Text>
        </View>
      ) : null}

      {!isLoadingHorarios &&
      selectedAtividadesId &&
      horarios.length === 0 &&
      !horariosError ? (
        <Text style={styles.emptyText}>{LISTA_PRESENCA_MESSAGES.semHorarios}</Text>
      ) : null}

      {showSortOptions ? (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Ordenar por</Text>
          <View style={styles.sortToolbar}>
            <View style={styles.sortOptions}>
              <SortOption
                label="Nome"
                selected={sortMode === 'nome'}
                onPress={() => onChangeSortMode('nome')}
              />
              <SortOption
                label="Reserva"
                selected={sortMode === 'reserva'}
                onPress={() => onChangeSortMode('reserva')}
              />
            </View>
            {pdfInput ? <BotaoGerarPdf input={pdfInput} inline /> : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

type SortOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function SortOption({ label, selected, onPress }: SortOptionProps) {
  return (
    <Pressable
      style={[styles.sortOption, selected && styles.sortOptionSelected]}
      onPress={onPress}>
      <Text style={[styles.sortOptionText, selected && styles.sortOptionTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  readonlyField: {
    marginBottom: 16,
  },
  readonlyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 8,
  },
  readonlyValue: {
    fontSize: 16,
    color: COLORS.navy,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: '#F8FAFD',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
  sortContainer: {
    marginBottom: 12,
  },
  sortLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 8,
  },
  sortToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 10,
    flexShrink: 1,
  },
  sortOption: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortOptionSelected: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  sortOptionTextSelected: {
    color: '#FFFFFF',
  },
});
