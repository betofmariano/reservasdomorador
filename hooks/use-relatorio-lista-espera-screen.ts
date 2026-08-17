import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useGestorAcademiaScope } from '@/hooks/use-gestor-academia-scope';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import type { User } from '@/types/user';
import { canAccessGestorScreen } from '@/utils/gestor-academia-access';
import { getAtividadesLocalPrioritarioReport } from '@/services/lista-reservas-atividade-service';
import { deleteListaEsperaEntry } from '@/services/lista-espera-service';
import { getRelatorioListaEsperaByAcademia } from '@/services/relatorio-lista-espera-service';
import type { AtividadeOption } from '@/types/atividade';
import type { ListaEsperaRegistro } from '@/types/lista-espera';
import type { RelatorioListaEsperaOrdem } from '@/types/relatorio-lista-espera';
import {
  filterListaEsperaByAtividade,
  formatListaEsperaDeleteSummary,
  sortListaEsperaRegistros,
} from '@/utils/relatorio-lista-espera';

export const RELATORIO_LISTA_ESPERA_MESSAGES = {
  permission: 'Você não possui permissão para acessar a Lista de Espera.',
  unavailable: 'Lista de espera não está disponível neste local.',
  noLocal: 'Selecione um local prioritário para continuar.',
  loadingAtividades: 'Carregando atividades...',
  loadingRegistros: 'Carregando lista de espera...',
  atividadesError: 'Não foi possível carregar as atividades deste local.',
  loadError: 'Não foi possível carregar a lista de espera.',
  emptyAtividades: 'Não existem atividades cadastradas para este local.',
  selectAtividade: 'Selecione uma atividade para consultar a lista de espera.',
  empty: 'Não existem registros na lista de espera.',
  emptyAtividade: 'Não existem registros na lista de espera para a atividade selecionada.',
  deleteConfirmTitle: 'Excluir da lista de espera',
  deleteConfirmMessage: (item: ListaEsperaRegistro) =>
    `Deseja realmente excluir este registro da lista de espera?\n\n${formatListaEsperaDeleteSummary(item)}`,
  deleteError: 'Não foi possível excluir o registro da lista de espera.',
} as const;

type UseRelatorioListaEsperaScreenParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useRelatorioListaEsperaScreen({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseRelatorioListaEsperaScreenParams) {
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

  const [atividades, setAtividades] = useState<AtividadeOption[]>([]);
  const [selectedAtividadesId, setSelectedAtividadesId] = useState<number | null>(null);
  const [ordem, setOrdem] = useState<RelatorioListaEsperaOrdem>('entrada');
  const [registros, setRegistros] = useState<ListaEsperaRegistro[]>([]);
  const [isLoadingAtividades, setIsLoadingAtividades] = useState(true);
  const [isLoadingRegistros, setIsLoadingRegistros] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [atividadesError, setAtividadesError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ListaEsperaRegistro | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const atividadesRequestIdRef = useRef(0);
  const registrosRequestIdRef = useRef(0);

  const canAccess = canAccessGestorScreen({
    isAdministrador,
    canManageSelectedAcademia,
    selectedAcademia,
    academiasId,
    permissions,
    permissionKey: 'podeAcessarRelatorioListaEspera',
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
    if (
      scopeIsLoading ||
      scopeRequiresLocalSelection ||
      !authToken ||
      !academiasId ||
      !canAccess
    ) {
      setAtividades([]);
      setSelectedAtividadesId(null);
      setIsLoadingAtividades(false);
      return;
    }

    const requestId = ++atividadesRequestIdRef.current;
    setIsLoadingAtividades(true);
    setAtividadesError(null);

    try {
      const data = await getAtividadesLocalPrioritarioReport(academiasId, authToken);

      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      setAtividades(data);
      setSelectedAtividadesId((current) => {
        if (current != null && data.some((item) => item.id === current)) {
          return current;
        }

        return null;
      });
    } catch (error) {
      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      setAtividades([]);
      setSelectedAtividadesId(null);
      setAtividadesError(
        await handleApiError(error, RELATORIO_LISTA_ESPERA_MESSAGES.atividadesError),
      );
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

  const loadRegistros = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (
        scopeIsLoading ||
        scopeRequiresLocalSelection ||
        !authToken ||
        !academiasId ||
        !canAccess
      ) {
        setRegistros([]);
        setIsLoadingRegistros(false);
        setIsRefreshing(false);
        return;
      }

      const requestId = ++registrosRequestIdRef.current;

      if (options?.refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoadingRegistros(true);
      }

      setLoadError(null);

      try {
        const data = await getRelatorioListaEsperaByAcademia(academiasId, authToken, {
          incluirAvisados: true,
        });

        if (requestId !== registrosRequestIdRef.current) {
          return;
        }

        setRegistros(data);
      } catch (error) {
        if (requestId !== registrosRequestIdRef.current) {
          return;
        }

        setRegistros([]);
        setLoadError(await handleApiError(error, RELATORIO_LISTA_ESPERA_MESSAGES.loadError));
      } finally {
        if (requestId === registrosRequestIdRef.current) {
          setIsLoadingRegistros(false);
          setIsRefreshing(false);
        }
      }
    },
    [authToken, canAccess, academiasId, handleApiError, scopeIsLoading, scopeRequiresLocalSelection],
  );

  useEffect(() => {
    void loadAtividades();
  }, [loadAtividades]);

  useEffect(() => {
    void loadRegistros();
  }, [loadRegistros]);

  const registrosFiltrados = useMemo(
    () => sortListaEsperaRegistros(filterListaEsperaByAtividade(registros, selectedAtividadesId), ordem),
    [ordem, registros, selectedAtividadesId],
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
      await deleteListaEsperaEntry(itemToDelete.id, authToken);
      setItemToDelete(null);
      await loadRegistros({ refreshing: true });
    } catch (error) {
      setDeleteError(await handleApiError(error, RELATORIO_LISTA_ESPERA_MESSAGES.deleteError));
    } finally {
      setIsDeleting(false);
    }
  }, [authToken, handleApiError, isDeleting, itemToDelete, loadRegistros]);

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
    atividades,
    selectedAtividadesId,
    selectedAtividade,
    ordem,
    setOrdem,
    setSelectedAtividadesId,
    registrosFiltrados,
    isLoadingAtividades,
    isLoadingRegistros,
    isRefreshing,
    atividadesError,
    loadError,
    itemToDelete,
    isDeleting,
    deleteError,
    setItemToDelete,
    closeDeleteModal,
    confirmDelete,
    reloadAtividades: loadAtividades,
    reloadRegistros: () => loadRegistros({ refreshing: true }),
  };
}
