import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ClubSelectionModal } from '@/components/club-selection-modal';
import type { LogadoClubeOption } from '@/types/logado';
import { sortByClubNome } from '@/utils/club-sort';

type LogadoClubeFilterProps = {
  clubs: LogadoClubeOption[];
  selectedClubId: number | null;
  onChange: (clubId: number | null) => void;
  disabled?: boolean;
};

const COLORS = {
  navy: '#3A2154',
  muted: '#5C6475',
  border: '#D5DAE3',
};

export function LogadoClubeFilter({
  clubs,
  selectedClubId,
  onChange,
  disabled = false,
}: LogadoClubeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sortedClubs = useMemo(() => sortByClubNome(clubs), [clubs]);
  const selectedClub = clubs.find((club) => club.id === selectedClubId);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => setIsOpen(true)}
        disabled={disabled}>
        <Text style={[styles.selectorText, !selectedClub && styles.placeholder]}>
          {selectedClub?.nome ?? 'Escolha o local'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.navy} />
      </Pressable>

      <ClubSelectionModal
        visible={isOpen}
        title="Escolha o local"
        maxHeight="70%"
        onClose={() => setIsOpen(false)}>
        <Pressable
          style={styles.option}
          onPress={() => {
            onChange(null);
            setIsOpen(false);
          }}>
          <Text style={styles.optionText}>Todos os locais</Text>
        </Pressable>

        {sortedClubs.map((club) => (
          <Pressable
            key={club.id}
            style={styles.option}
            onPress={() => {
              onChange(club.id);
              setIsOpen(false);
            }}>
            <Text style={styles.optionText}>{club.nome}</Text>
          </Pressable>
        ))}
      </ClubSelectionModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
    backgroundColor: '#FFFFFF',
  },
  selectorDisabled: {
    opacity: 0.6,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.navy,
    marginRight: 8,
  },
  placeholder: {
    color: COLORS.muted,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F6',
  },
  optionText: {
    fontSize: 15,
    color: COLORS.navy,
  },
});
