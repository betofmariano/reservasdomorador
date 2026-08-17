import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useGestorAcademiaScope } from '@/hooks/use-gestor-academia-scope';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { deleteMapaDiarioItem, updateMapaDiarioItem } from '@/services/mapa-diario-service';
import { getProgramacaoAtividades } from '@/services/programacao-atividades-service';
import type { AtividadeProgramada } from '@/types/atividade-programada';
import type { User } from '@/types/user';
import { canAccessGestorScreen } from '@/utils/gestor-academia-access';
import {
  createDefaultProgramacaoStartDate,
  filterAtividadesProgramadasFromDate,
  filterAtividadesProgramadasBySearch,
  validateProgramacaoAtividadesConsulta,
} from '@/utils/programacao-atividades';

export const PROGRAMACAO_ATIVIDADES_MESSAGES = {
  permission: 'Você não possui permissão para acessar a Programação de Atividades.',
  noLocal: 'Selecione um local prioritário para continuar.',
  loading: 'Carregando programação de atividades...',
  loadError: 'Não foi possível carregar a programação de atividades.',
  empty: 'Não existem atividades programadas para este local.',
  emptyPeriodo: 'Nenhuma atividade programada a partir da data informada.',
  editError: 'Não foi possível atualizar a capacidade da atividade programada.',
  deleteConfirmTitle: 'Excluir atividade programada',
  deleteConfirmMessage: (item: AtividadeProgramada) =>
    `Deseja realmente excluir esta atividade programada?\n\n${item.atividadeNome}\n${formatDeleteSummary(item)}`,
  deleteError: 'Não foi possível excluir a atividade programada.',
} as const;

function formatDeleteSummary(item: AtividadeProgramada): string {
  const date = new Date(item.dataAtividade);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} - ${hours}:${minutes}\nReservas: ${item.reservas}`;
}

type UseProgramacaoAtividadesScreenParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useProgramacaoAtividadesScreen({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseProgramacaoAtividadesScreenParams) {
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

  const defaultStartDate = useMemo(() => createDefaultProgramacaoStartDate(), []);

  const [atividadesCarregadas, setAtividadesCarregadas] = useState<AtividadeProgramada[]>([]);
  const [filtro, setFiltro] = useState('');
  const [debouncedFiltro, setDebouncedFiltro] = useState('');
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [appliedStartDate, setAppliedStartDate] = useState<Date | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasConsultado, setHasConsultado] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<AtividadeProgramada | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [itemToEdit, setItemToEdit] = useState<AtividadeProgramada | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldAutoConsultRef = useRef(true);
  const defaultStartDateRef = useRef(defaultStartDate);

  const canAccess = canAccessGestorScreen({
    isAdministrador,
    canManageSelectedAcademia,
    selectedAcademia,
    academiasId,
    permissions,
    permissionKey: 'podeAcessarProgramacaoAtividades',
  });

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

  const consultarProgramacao = useCallback(() => {
    const validationMessage = validateProgramacaoAtividadesConsulta({
      dataInicial: startDate,
    });

    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    setValidationError(null);
    setAppliedStartDate(startDate);
    setHasConsultado(true);
  }, [startDate]);

  const loadAtividades = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (
        scopeIsLoading ||
        scopeRequiresLocalSelection ||
        !authToken ||
        !academiasId ||
        !canAccess
      ) {
        setAtividadesCarregadas([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const requestId = ++requestIdRef.current;

      if (options?.refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setLoadError(null);

      try {
        const data = await getProgramacaoAtividades(authToken, academiasId);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setAtividadesCarregadas(data);

        if (shouldAutoConsultRef.current) {
          shouldAutoConsultRef.current = false;
          setValidationError(null);
          setAppliedStartDate(defaultStartDateRef.current);
          setHasConsultado(true);
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setAtividadesCarregadas([]);
        setLoadError(await handleApiError(error, PROGRAMACAO_ATIVIDADES_MESSAGES.loadError));
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [
      authToken,
      canAccess,
      academiasId,
      handleApiError,
      scopeIsLoading,
      scopeRequiresLocalSelection,
    ],
  );

  useEffect(() => {
    void loadAtividades();
  }, [loadAtividades]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedFiltro(filtro);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filtro]);

  const atividadesNoPeriodo = useMemo(() => {
    if (!hasConsultado || appliedStartDate == null) {
      return [];
    }

    return filterAtividadesProgramadasFromDate(atividadesCarregadas, appliedStartDate);
  }, [appliedStartDate, atividadesCarregadas, hasConsultado]);

  const atividadesFiltradas = useMemo(
    () => filterAtividadesProgramadasBySearch(atividadesNoPeriodo, debouncedFiltro),
    [atividadesNoPeriodo, debouncedFiltro],
  );

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setItemToDelete(null);
    setDeleteError(null);
  }, [isDeleting]);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete || !authToken || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteMapaDiarioItem(itemToDelete.id, authToken);
      setItemToDelete(null);
      await loadAtividades({ refreshing: true });
    } catch (error) {
      setDeleteError(await handleApiError(error, PROGRAMACAO_ATIVIDADES_MESSAGES.deleteError));
    } finally {
      setIsDeleting(false);
    }
  }, [authToken, handleApiError, isDeleting, itemToDelete, loadAtividades]);

  const closeEditModal = useCallback(() => {
    if (isSavingEdit) {
      return;
    }

    setItemToEdit(null);
    setEditError(null);
  }, [isSavingEdit]);

  const confirmEdit = useCallback(
    async (capacidade: number) => {
      if (!itemToEdit || !authToken || isSavingEdit) {
        return;
      }

      setIsSavingEdit(true);
      setEditError(null);

      try {
        await updateMapaDiarioItem(itemToEdit.id, authToken, { capacidade });
        setItemToEdit(null);
        await loadAtividades({ refreshing: true });
      } catch (error) {
        setEditError(await handleApiError(error, PROGRAMACAO_ATIVIDADES_MESSAGES.editError));
      } finally {
        setIsSavingEdit(false);
      }
    },
    [authToken, handleApiError, isSavingEdit, itemToEdit, loadAtividades],
  );

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
    atividadesCarregadas,
    atividadesNoPeriodo,
    atividadesFiltradas,
    filtro,
    setFiltro,
    startDate,
    setStartDate,
    validationError,
    hasConsultado,
    isLoading,
    isRefreshing,
    loadError,
    itemToDelete,
    isDeleting,
    deleteError,
    setItemToDelete,
    closeDeleteModal,
    confirmDelete,
    itemToEdit,
    isSavingEdit,
    editError,
    setItemToEdit,
    closeEditModal,
    confirmEdit,
    consultarProgramacao,
    reload: () => loadAtividades({ refreshing: true }),
    retryLoad: () => loadAtividades(),
  };
}
