import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AtividadeSelector } from '@/components/atividade-selector';
import { ClubSelectionModal } from '@/components/club-selection-modal';
import type { AtividadeOption } from '@/types/atividade';
import type { RelatorioListaEsperaOrdem } from '@/types/relatorio-lista-espera';
import { RELATORIO_LISTA_ESPERA_ORDEM_OPTIONS } from '@/utils/relatorio-lista-espera';

type RelatorioListaEsperaFiltrosProps = {
  atividades: AtividadeOption[];
  selectedAtividadesId: number | null;
  onChangeAtividade: (atividadesId: number | null) => void;
  isLoadingAtividades: boolean;
  atividadesError: string | null;
  onRetryAtividades: () => void;
  ordem: RelatorioListaEsperaOrdem;
  onChangeOrdem: (ordem: RelatorioListaEsperaOrdem) => void;
  onGerarPdf: () => void;
  pdfDisabled?: boolean;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  muted: '#5C6475',
};

export function RelatorioListaEsperaFiltros({
  atividades,
  selectedAtividadesId,
  onChangeAtividade,
  isLoadingAtividades,
  atividadesError,
  onRetryAtividades,
  ordem,
  onChangeOrdem,
  onGerarPdf,
  pdfDisabled = false,
}: RelatorioListaEsperaFiltrosProps) {
  const [isOrdemOpen, setIsOrdemOpen] = useState(false);
  const selectedOrdem =
    RELATORIO_LISTA_ESPERA_ORDEM_OPTIONS.find((item) => item.value === ordem) ??
    RELATORIO_LISTA_ESPERA_ORDEM_OPTIONS[0];

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

      <View style={styles.ordemRow}>
        <Text style={styles.ordemLabel}>Ordem :</Text>
        <Pressable style={styles.ordemSelector} onPress={() => setIsOrdemOpen(true)}>
          <Text style={styles.ordemValue}>{selectedOrdem.label}</Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.navy} />
        </Pressable>
      </View>

      <ClubSelectionModal
        visible={isOrdemOpen}
        title="Ordem de exibição"
        onClose={() => setIsOrdemOpen(false)}>
        {RELATORIO_LISTA_ESPERA_ORDEM_OPTIONS.map((option) => (
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
  ordemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ordemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
  ordemSelector: {
    minWidth: 180,
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
  ordemValue: {
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
