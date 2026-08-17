import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useGestorAcademiaScope } from '@/hooks/use-gestor-academia-scope';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import type { User } from '@/types/user';
import { canAccessGestorScreen } from '@/utils/gestor-academia-access';
import { getAtividadesByAcademia, mapAtividadesToOptions } from '@/services/atividades-service';
import { gerarMapaFrequencia } from '@/services/mapa-frequencia-service';
import { getHorariosByAcademia } from '@/services/horarios-service';
import type { AtividadeOption } from '@/types/atividade';
import type {
  HorarioMapaFrequenciaOption,
  MapaFrequenciaGeracaoEtapa,
  MapaFrequenciaRelatorio,
} from '@/types/mapa-frequencia';
import { filterAlunosMapaFrequenciaByNome, getDefaultHorarioMapaFrequencia, mapHorariosToMapaFrequenciaOptions, resolveMapaFrequenciaApiError } from '@/utils/mapa-frequencia';

export const MAPA_FREQUENCIA_MESSAGES = {
  permission: 'Você não possui permissão para acessar o Mapa de Frequência.',
  noLocal: 'Selecione um local prioritário para continuar.',
  loadAtividades: 'Não foi possível carregar as atividades.',
  loadHorarios: 'Não foi possível carregar os horários da atividade.',
  emptyAtividades: 'Não existem atividades com controle de presença neste local.',
  emptyHorarios: 'Não existem horários cadastrados para esta atividade.',
  prepareError: 'Não foi possível preparar o Mapa de Frequência.',
  buildError: 'Não foi possível montar o Mapa de Frequência.',
  loadError: 'Não foi possível carregar os dados do Mapa de Frequência.',
  headerError: 'Não foi possível identificar o cabeçalho do Mapa de Frequência.',
  emptyAlunos: 'Nenhum aluno encontrado para esta atividade.',
  generating: 'Montando Mapa de Frequência...',
} as const;

const ETAPA_LABELS: Record<MapaFrequenciaGeracaoEtapa, string> = {
  excluir: 'Preparando dados...',
  inicializar: 'Gerando estrutura inicial...',
  montar: 'Montando frequência...',
  carregar: 'Carregando relatório...',
  processar: 'Processando relatório...',
};

type UseMapaFrequenciaScreenParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useMapaFrequenciaScreen({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseMapaFrequenciaScreenParams) {
  const scope = useGestorAcademiaScope({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized,
  });

  const {
    academiasId,
    localNome,
    scopeRequiresLocalSelection,
    scopeIsLoading,
    permissions,
    isAdministrador,
    canManageSelectedAcademia,
    selectedAcademia,
    showAcademiaSelector,
    availableAcademias,
    selectedAcademiaId,
    setSelectedAcademiaId,
    isLoadingAcademias,
    academiasLoadError,
    fetchAvailableAcademias,
  } = scope;

  const [showModal, setShowModal] = useState(true);
  const [atividades, setAtividades] = useState<AtividadeOption[]>([]);
  const [horarios, setHorarios] = useState<HorarioMapaFrequenciaOption[]>([
    { id: null, label: 'Todos os horários', hora: null, minutos: null },
  ]);
  const [selectedAtividadesId, setSelectedAtividadesId] = useState<number | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<HorarioMapaFrequenciaOption>(
    horarios[0],
  );
  const [relatorio, setRelatorio] = useState<MapaFrequenciaRelatorio | null>(null);
  const [filtroNome, setFiltroNome] = useState('');
  const [debouncedFiltroNome, setDebouncedFiltroNome] = useState('');
  const [isLoadingAtividades, setIsLoadingAtividades] = useState(true);
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationEtapa, setGenerationEtapa] = useState<MapaFrequenciaGeracaoEtapa | null>(null);
  const [atividadesError, setAtividadesError] = useState<string | null>(null);
  const [horariosError, setHorariosError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const atividadesRequestIdRef = useRef(0);
  const horariosRequestIdRef = useRef(0);
  const generationRequestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canAccess = canAccessGestorScreen({
    isAdministrador,
    canManageSelectedAcademia,
    selectedAcademia,
    academiasId,
    permissions,
    permissionKey: 'podeAcessarMapaFrequencia',
  });
  const selectedAtividade = atividades.find((item) => item.id === selectedAtividadesId) ?? null;

  const handleApiError = useCallback(
    async (error: unknown, fallbackMessage: string) => {
      if (error instanceof ApiError && error.status === 401) {
        await onUnauthorized();
        return fallbackMessage;
      }

      return getApiErrorMessage(error) || fallbackMessage;
    },
    [onUnauthorized],
  );

  const loadAtividades = useCallback(async () => {
    if (scopeIsLoading || scopeRequiresLocalSelection || !authToken || !academiasId || !canAccess) {
      setAtividades([]);
      setSelectedAtividadesId(null);
      setIsLoadingAtividades(false);
      return;
    }

    const requestId = ++atividadesRequestIdRef.current;
    setIsLoadingAtividades(true);
    setAtividadesError(null);

    try {
      const data = await getAtividadesByAcademia(academiasId, authToken);
      const filtered = mapAtividadesToOptions(
        data.filter((item) => item.controlePresenca === true),
      ).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      setAtividades(filtered);
      setSelectedAtividadesId((current) =>
        current != null && filtered.some((item) => item.id === current) ? current : null,
      );
    } catch (error) {
      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      setAtividades([]);
      setSelectedAtividadesId(null);
      setAtividadesError(await handleApiError(error, MAPA_FREQUENCIA_MESSAGES.loadAtividades));
    } finally {
      if (requestId === atividadesRequestIdRef.current) {
        setIsLoadingAtividades(false);
      }
    }
  }, [
    authToken,
    canAccess,
    academiasId,
    handleApiError,
    scopeIsLoading,
    scopeRequiresLocalSelection,
  ]);

  const loadHorarios = useCallback(
    async (atividadesId: number) => {
      if (!authToken || !academiasId) {
        return;
      }

      const requestId = ++horariosRequestIdRef.current;
      setIsLoadingHorarios(true);
      setHorariosError(null);

      try {
        const data = await getHorariosByAcademia(academiasId, authToken, atividadesId);
        const options = mapHorariosToMapaFrequenciaOptions(data);

        if (requestId !== horariosRequestIdRef.current) {
          return;
        }

        setHorarios(options);
        setSelectedHorario(getDefaultHorarioMapaFrequencia(options));
      } catch (error) {
        if (requestId !== horariosRequestIdRef.current) {
          return;
        }

        const fallback = { id: null, label: 'Todos os horários', hora: null, minutos: null };
        setHorarios([fallback]);
        setSelectedHorario(fallback);
        setHorariosError(await handleApiError(error, MAPA_FREQUENCIA_MESSAGES.loadHorarios));
      } finally {
        if (requestId === horariosRequestIdRef.current) {
          setIsLoadingHorarios(false);
        }
      }
    },
    [authToken, academiasId, handleApiError],
  );

  useEffect(() => {
    setRelatorio(null);
    setFiltroNome('');
    setDebouncedFiltroNome('');
    setGenerationError(null);
    void loadAtividades();
  }, [academiasId, loadAtividades]);

  useEffect(() => {
    if (selectedAtividadesId == null) {
      const fallback = { id: null, label: 'Todos os horários', hora: null, minutos: null };
      setHorarios([fallback]);
      setSelectedHorario(fallback);
      return;
    }

    void loadHorarios(selectedAtividadesId);
  }, [loadHorarios, selectedAtividadesId]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedFiltroNome(filtroNome);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filtroNome]);

  const confirmarConsulta = useCallback(async () => {
    if (
      !authToken ||
      !academiasId ||
      !selectedAtividadesId ||
      !selectedAtividade ||
      isGenerating
    ) {
      return;
    }

    const requestId = ++generationRequestIdRef.current;
    setShowModal(false);
    setIsGenerating(true);
    setGenerationEtapa('excluir');
    setGenerationError(null);
    setRelatorio(null);
    setFiltroNome('');
    setDebouncedFiltroNome('');

    try {
      const nextRelatorio = await gerarMapaFrequencia({
        academiasId: academiasId,
        atividadeId: selectedAtividadesId,
        atividadeNome: selectedAtividade.nome,
        horario: selectedHorario,
        authToken,
        onEtapa: (etapa) => {
          if (requestId === generationRequestIdRef.current) {
            setGenerationEtapa(etapa);
          }
        },
      });

      if (requestId !== generationRequestIdRef.current) {
        return;
      }

      setRelatorio(nextRelatorio);
    } catch (error) {
      if (requestId !== generationRequestIdRef.current) {
        return;
      }

      const message = error instanceof Error ? error.message : '';
      let fallback: string = resolveMapaFrequenciaApiError(error, 'carregar');

      if (message.includes('cabeçalho')) {
        fallback = MAPA_FREQUENCIA_MESSAGES.headerError;
      } else if (generationEtapa === 'excluir') {
        fallback = MAPA_FREQUENCIA_MESSAGES.prepareError;
      } else if (generationEtapa === 'inicializar') {
        fallback = resolveMapaFrequenciaApiError(error, 'inicializar');
      } else if (generationEtapa === 'montar') {
        fallback = resolveMapaFrequenciaApiError(error, 'montar');
      }

      setGenerationError(await handleApiError(error, fallback));
      setShowModal(true);
    } finally {
      if (requestId === generationRequestIdRef.current) {
        setIsGenerating(false);
        setGenerationEtapa(null);
      }
    }
  }, [
    authToken,
    academiasId,
    generationEtapa,
    handleApiError,
    isGenerating,
    selectedAtividade,
    selectedAtividadesId,
    selectedHorario,
  ]);

  const alunosFiltrados = useMemo(() => {
    if (!relatorio) {
      return [];
    }

    return filterAlunosMapaFrequenciaByNome(relatorio.alunos, debouncedFiltroNome);
  }, [debouncedFiltroNome, relatorio]);

  const generationLabel = generationEtapa
    ? ETAPA_LABELS[generationEtapa]
    : MAPA_FREQUENCIA_MESSAGES.generating;

  const cancelarGeracao = useCallback(() => {
    ++generationRequestIdRef.current;
    setIsGenerating(false);
    setGenerationEtapa(null);
    setGenerationError(null);
    setShowModal(true);
  }, []);

  return {
    canAccess,
    requiresLocalSelection: scopeRequiresLocalSelection,
    isContextLoading: scopeIsLoading,
    localNome,
    showAcademiaSelector,
    availableAcademias,
    selectedAcademiaId,
    setSelectedAcademiaId,
    isLoadingAcademias,
    academiasLoadError,
    fetchAvailableAcademias,
    showModal,
    setShowModal,
    atividades,
    horarios,
    selectedAtividadesId,
    setSelectedAtividadesId,
    selectedHorario,
    setSelectedHorario,
    selectedAtividade,
    relatorio,
    alunosFiltrados,
    filtroNome,
    setFiltroNome,
    isLoadingAtividades,
    isLoadingHorarios,
    isGenerating,
    generationLabel,
    atividadesError,
    horariosError,
    generationError,
    loadAtividades,
    loadHorarios,
    confirmarConsulta,
    abrirNovaConsulta: () => setShowModal(true),
    cancelarGeracao,
    retryGeneration: () => void confirmarConsulta(),
  };
}
