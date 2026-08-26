import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AtividadeSelector } from '@/components/atividade-selector';
import { ClubSelectionModal } from '@/components/club-selection-modal';
import type { AtividadeOption } from '@/types/atividade';
import type {
  ListaUsuariosSuspensosOrdem,
  ListaUsuariosSuspensosStatusFilter,
} from '@/types/users-bloqueados';
import {
  LISTA_USUARIOS_SUSPENSOS_ORDEM_OPTIONS,
  LISTA_USUARIOS_SUSPENSOS_STATUS_OPTIONS,
} from '@/utils/lista-usuarios-suspensos';

type ListaUsuariosSuspensosFiltrosProps = {
  atividades: AtividadeOption[];
  selectedAtividadesId: number | null;
  onChangeAtividade: (atividadesId: number | null) => void;
  isLoadingAtividades: boolean;
  atividadesError: string | null;
  onRetryAtividades: () => void;
  statusFilter: ListaUsuariosSuspensosStatusFilter;
  onChangeStatus: (status: ListaUsuariosSuspensosStatusFilter) => void;
  ordem: ListaUsuariosSuspensosOrdem;
  onChangeOrdem: (ordem: ListaUsuariosSuspensosOrdem) => void;
  onGerarPdf: () => void;
  pdfDisabled?: boolean;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
};

export function ListaUsuariosSuspensosFiltros({
  atividades,
  selectedAtividadesId,
  onChangeAtividade,
  isLoadingAtividades,
  atividadesError,
  onRetryAtividades,
  statusFilter,
  onChangeStatus,
  ordem,
  onChangeOrdem,
  onGerarPdf,
  pdfDisabled = false,
}: ListaUsuariosSuspensosFiltrosProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isOrdemOpen, setIsOrdemOpen] = useState(false);

  const selectedStatus =
    LISTA_USUARIOS_SUSPENSOS_STATUS_OPTIONS.find((item) => item.value === statusFilter) ??
    LISTA_USUARIOS_SUSPENSOS_STATUS_OPTIONS[0];
  const selectedOrdem =
    LISTA_USUARIOS_SUSPENSOS_ORDEM_OPTIONS.find((item) => item.value === ordem) ??
    LISTA_USUARIOS_SUSPENSOS_ORDEM_OPTIONS[0];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.selectorSlot}>
          <AtividadeSelector
            atividades={atividades}
            value={selectedAtividadesId}
            onChange={onChangeAtividade}
            isLoading={isLoadingAtividades}
            error={atividadesError}
            onRetry={onRetryAtividades}
            hideLabel
            allowAll
            allLabel="Todas as atividades"
            onSelectAll={() => onChangeAtividade(null)}
            placeholder="Todas as atividades"
          />
        </View>

        <Pressable
          style={[styles.pdfButton, pdfDisabled && styles.pdfButtonDisabled]}
          onPress={onGerarPdf}
          disabled={pdfDisabled}>
          <Text style={styles.pdfButtonText}>PDF</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Situação :</Text>
        <Pressable style={styles.filterSelector} onPress={() => setIsStatusOpen(true)}>
          <Text style={styles.filterValue}>{selectedStatus.label}</Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.navy} />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Ordem :</Text>
        <Pressable style={styles.filterSelector} onPress={() => setIsOrdemOpen(true)}>
          <Text style={styles.filterValue}>{selectedOrdem.label}</Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.navy} />
        </Pressable>
      </View>

      <ClubSelectionModal
        visible={isStatusOpen}
        title="Situação"
        onClose={() => setIsStatusOpen(false)}>
        {LISTA_USUARIOS_SUSPENSOS_STATUS_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={styles.option}
            onPress={() => {
              onChangeStatus(option.value);
              setIsStatusOpen(false);
            }}>
            <Text style={styles.optionText}>{option.label}</Text>
          </Pressable>
        ))}
      </ClubSelectionModal>

      <ClubSelectionModal
        visible={isOrdemOpen}
        title="Ordem de exibição"
        onClose={() => setIsOrdemOpen(false)}>
        {LISTA_USUARIOS_SUSPENSOS_ORDEM_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={styles.option}
            onPress={() => {
              onChangeOrdem(option.value);
              setIsOrdemOpen(false);
            }}>
            <Text style={styles.optionText}>{option.label}</Text>
          </Pressable>
        ))}
      </ClubSelectionModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  selectorSlot: {
    flex: 1,
    minWidth: 0,
  },
  pdfButton: {
    minWidth: 72,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pdfButtonDisabled: {
    opacity: 0.6,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
  filterSelector: {
    minWidth: 220,
    height: 40,
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  filterValue: {
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '600',
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
