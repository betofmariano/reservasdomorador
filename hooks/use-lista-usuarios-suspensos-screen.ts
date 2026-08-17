import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useGestorAcademiaScope } from '@/hooks/use-gestor-academia-scope';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { getAtividadesLocalPrioritarioReport } from '@/services/lista-reservas-atividade-service';
import {
  deleteUsersBloqueadosRecord,
  getUsersBloqueadosByAcademia,
} from '@/services/users-bloqueados-service';
import type { AtividadeOption } from '@/types/atividade';
import type {
  ListaUsuariosSuspensosOrdem,
  ListaUsuariosSuspensosStatusFilter,
  UsersBloqueadoRegistro,
} from '@/types/users-bloqueados';
import type { User } from '@/types/user';
import { canAccessGestorScreen } from '@/utils/gestor-academia-access';
import {
  filterUsersBloqueadosByAtividade,
  filterUsersBloqueadosByStatus,
  sortUsersBloqueadosRegistros,
  formatUsersBloqueadoDeleteSummary,
} from '@/utils/lista-usuarios-suspensos';

export const LISTA_USUARIOS_SUSPENSOS_MESSAGES = {
  permission: 'Você não possui permissão para acessar a Lista de Usuários Suspensos.',
  noLocal: 'Selecione um local prioritário para continuar.',
  atividadesError: 'Não foi possível carregar as atividades deste local.',
  loadError: 'Não foi possível carregar as suspensões.',
  emptyAtividades: 'Não existem atividades cadastradas para este local.',
  empty: 'Não existem suspensões registradas.',
  emptyAtividade: 'Não existem suspensões para a atividade selecionada.',
  emptyStatus: 'Não existem suspensões para o filtro selecionado.',
  deleteConfirmTitle: 'Excluir suspensão',
  deleteConfirmMessage: (item: UsersBloqueadoRegistro) =>
    `Deseja realmente excluir esta suspensão?\n\n${formatUsersBloqueadoDeleteSummary(item)}`,
  deleteSuccess: 'Suspensão excluída com sucesso.',
  deleteError: 'Não foi possível excluir a suspensão.',
} as const;

type UseListaUsuariosSuspensosScreenParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useListaUsuariosSuspensosScreen({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseListaUsuariosSuspensosScreenParams) {
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
  const [statusFilter, setStatusFilter] = useState<ListaUsuariosSuspensosStatusFilter>('ativos');
  const [ordem, setOrdem] = useState<ListaUsuariosSuspensosOrdem>('data_final');
  const [registros, setRegistros] = useState<UsersBloqueadoRegistro[]>([]);
  const [isLoadingAtividades, setIsLoadingAtividades] = useState(true);
  const [isLoadingRegistros, setIsLoadingRegistros] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [atividadesError, setAtividadesError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<UsersBloqueadoRegistro | null>(null);
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
    permissionKey: 'podeGerirLocal',
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
        await handleApiError(error, LISTA_USUARIOS_SUSPENSOS_MESSAGES.atividadesError),
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
        const data = await getUsersBloqueadosByAcademia(academiasId, authToken);

        if (requestId !== registrosRequestIdRef.current) {
          return;
        }

        setRegistros(data);
      } catch (error) {
        if (requestId !== registrosRequestIdRef.current) {
          return;
        }

        setRegistros([]);
        setLoadError(await handleApiError(error, LISTA_USUARIOS_SUSPENSOS_MESSAGES.loadError));
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
    () =>
      sortUsersBloqueadosRegistros(
        filterUsersBloqueadosByStatus(
          filterUsersBloqueadosByAtividade(registros, selectedAtividadesId),
          statusFilter,
        ),
        ordem,
      ),
    [ordem, registros, selectedAtividadesId, statusFilter],
  );

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setItemToDelete(null);
    setDeleteError(null);
  }, [isDeleting]);

  const confirmDelete = useCallback(async (): Promise<boolean> => {
    if (!itemToDelete || !authToken || isDeleting) {
      return false;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteUsersBloqueadosRecord(itemToDelete.id, authToken);
      setItemToDelete(null);
      await loadRegistros({ refreshing: true });
      return true;
    } catch (error) {
      setDeleteError(await handleApiError(error, LISTA_USUARIOS_SUSPENSOS_MESSAGES.deleteError));
      return false;
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
    statusFilter,
    setStatusFilter,
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
