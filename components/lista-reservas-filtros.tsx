import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ClubSelectionModal } from '@/components/club-selection-modal';
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { RelatorioPeriodoFields } from '@/components/relatorio-periodo-fields';

type ListaReservasFiltrosProps = {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  nomeFiltro: string;
  onNomeFiltroChange: (value: string) => void;
  /** Limite inferior da data inicial. Sem valor, o picker usa hoje. */
  minimumStartDate?: Date;
  hideYear?: boolean;
  topContent?: ReactNode;
};

type ActiveDateField = 'start' | 'end' | null;

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  border: '#E2E6EE',
  muted: '#5C6475',
};

export function ListaReservasFiltros({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  nomeFiltro,
  onNomeFiltroChange,
  minimumStartDate,
  hideYear = true,
  topContent,
}: ListaReservasFiltrosProps) {
  const [activeField, setActiveField] = useState<ActiveDateField>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const hasNomeFiltro = nomeFiltro.trim().length > 0;

  return (
    <View style={styles.container}>
      {topContent}

      <View style={styles.periodSearchRow}>
        <View style={styles.periodWrap}>
          <RelatorioPeriodoFields
            startDate={startDate}
            endDate={endDate}
            onPressStartDate={() => setActiveField('start')}
            onPressEndDate={() => setActiveField('end')}
            hideYear={hideYear}
            layout="de-a"
          />
        </View>

        <Pressable
          style={styles.searchButton}
          onPress={() => setIsSearchOpen(true)}
          accessibilityLabel="Filtrar por nome"
          accessibilityRole="button">
          <Ionicons
            name={hasNomeFiltro ? 'funnel' : 'funnel-outline'}
            size={24}
            color={hasNomeFiltro ? COLORS.blue : COLORS.navy}
          />
          {hasNomeFiltro ? <View style={styles.searchActiveDot} /> : null}
        </Pressable>
      </View>

      <ClubSelectionModal
        visible={isSearchOpen}
        title="Filtrar por nome"
        onClose={() => setIsSearchOpen(false)}
        scrollable={false}
        maxHeight={220}>
        <TextInput
          value={nomeFiltro}
          onChangeText={onNomeFiltroChange}
          placeholder="Digite o nome"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus
          style={styles.nomeInput}
          returnKeyType="search"
          onSubmitEditing={() => setIsSearchOpen(false)}
        />
        <View style={styles.searchActions}>
          {hasNomeFiltro ? (
            <Pressable
              onPress={() => onNomeFiltroChange('')}
              style={styles.clearButton}
              accessibilityLabel="Limpar filtro">
              <Text style={styles.clearButtonText}>Limpar</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable
            onPress={() => setIsSearchOpen(false)}
            style={styles.applyButton}
            accessibilityLabel="Fechar pesquisa">
            <Text style={styles.applyButtonText}>OK</Text>
          </Pressable>
        </View>
      </ClubSelectionModal>

      <DatePickerSheet
        visible={activeField === 'start'}
        value={startDate}
        minimumDate={minimumStartDate}
        onConfirm={onStartDateChange}
        onClose={() => setActiveField(null)}
      />

      <DatePickerSheet
        visible={activeField === 'end'}
        value={endDate}
        minimumDate={startDate}
        onConfirm={onEndDateChange}
        onClose={() => setActiveField(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    gap: 8,
  },
  periodSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodWrap: {
    flex: 1,
    minWidth: 0,
  },
  searchButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  searchActiveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.blue,
  },
  nomeInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.navy,
    backgroundColor: '#FFFFFF',
  },
  searchActions: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B8C4D8',
    backgroundColor: '#DDE3EE',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  applyButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.blue,
  },
});
