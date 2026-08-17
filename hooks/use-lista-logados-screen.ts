import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { deleteLogado, getLogados } from '@/services/logados-service';
import type { LogadoClubeOption, LogadoGestorFilter, LogadoSortDirection, LogadoSortField } from '@/types/logado';
import {
  extractLogadoClubOptions,
  filterLogadosByClub,
  filterLogadosByGestor,
  matchesLogadoSearch,
  sortLogados,
} from '@/utils/logado-lista-format';

const LOAD_ERROR_MESSAGE = 'Não foi possível carregar a lista de logados.';
const DELETE_ERROR_MESSAGE = 'Não foi possível excluir o registro. Tente novamente.';
const PERMISSION_ERROR_MESSAGE = 'Você não tem permissão para acessar esta funcionalidade.';
const SEARCH_DEBOUNCE_MS = 400;

type FetchOptions = {
  refreshing?: boolean;
};

type UseListaLogadosScreenParams = {
  isAdministrador: boolean;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useListaLogadosScreen({
  isAdministrador,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseListaLogadosScreenParams) {
  const [logados, setLogados] = useState<Awaited<ReturnType<typeof getLogados>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [gestorFilter, setGestorFilter] = useState<LogadoGestorFilter>('all');
  const [sortField, setSortField] = useState<LogadoSortField>('data');
  const [sortDirection, setSortDirection] = useState<LogadoSortDirection>('desc');

  const [isDeleting, setIsDeleting] = useState(false);

  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const clubOptions = useMemo(() => extractLogadoClubOptions(logados), [logados]);

  const filteredLogados = useMemo(() => {
    const byClub = filterLogadosByClub(logados, selectedClubId);
    const byGestor = filterLogadosByGestor(byClub, gestorFilter);
    const searched = byGestor.filter((logado) => matchesLogadoSearch(logado, debouncedSearchQuery));
    return sortLogados(searched, sortField, sortDirection);
  }, [debouncedSearchQuery, gestorFilter, logados, selectedClubId, sortDirection, sortField]);

  const fetchLogados = useCallback(
    async (options?: FetchOptions) => {
      if (!isAdministrador || !authToken) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      const showFullLoading = !options?.refreshing;
      const showRefreshIndicator = options?.refreshing === true;

      console.log('Carregando lista de logados');

      if (showFullLoading) {
        setIsLoading(true);
      }

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }

      setLoadError(null);

      try {
        const data = await getLogados(authToken);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setLogados(data);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return;
        }

        const message = getApiErrorMessage(error);
        setLoadError(message.includes('conectar') ? message : LOAD_ERROR_MESSAGE);
        setLogados([]);
      } finally {
        if (showFullLoading) {
          setIsLoading(false);
        }

        if (showRefreshIndicator) {
          setIsRefreshing(false);
        }
      }
    },
    [authToken, isAdministrador, onUnauthorized],
  );

  const deleteLogadoRecord = useCallback(
    async (logadoId: number): Promise<string | null> => {
      if (!isAdministrador || !authToken) {
        return PERMISSION_ERROR_MESSAGE;
      }

      setIsDeleting(true);

      console.log('Exclusão solicitada');

      try {
        await deleteLogado(logadoId, authToken);
        setLogados((current) => current.filter((item) => item.id !== logadoId));
        return null;
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return DELETE_ERROR_MESSAGE;
        }

        const message = getApiErrorMessage(error);
        return message.includes('conectar') ? message : DELETE_ERROR_MESSAGE;
      } finally {
        setIsDeleting(false);
      }
    },
    [authToken, isAdministrador, onUnauthorized],
  );

  useEffect(() => {
    if (isAuthLoading || !isAdministrador || !authToken) {
      return;
    }

    void fetchLogados();
  }, [authToken, fetchLogados, isAdministrador, isAuthLoading]);

  function handleSortFieldChange(field: LogadoSortField) {
    if (field === sortField) {
      setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }

    setSortField(field);
    setSortDirection('desc');
  }

  return {
    logados: filteredLogados,
    clubOptions,
    isLoading,
    isRefreshing,
    loadError,
    searchQuery,
    selectedClubId,
    gestorFilter,
    sortField,
    sortDirection,
    isDeleting,
    setSearchQuery,
    setSelectedClubId,
    setGestorFilter,
    fetchLogados,
    handleSortFieldChange,
    deleteLogadoRecord,
  };
}

export const LISTA_LOGADOS_MESSAGES = {
  loadError: LOAD_ERROR_MESSAGE,
  empty: 'Não há registros de logados para exibir.',
  deleteSuccess: 'Registro excluído com sucesso.',
  deleteError: DELETE_ERROR_MESSAGE,
  permissionError: PERMISSION_ERROR_MESSAGE,
};
