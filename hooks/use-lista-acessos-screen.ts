import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError, getApiErrorMessage } from '@/services/api-client';
import {
  apagarAcessos24Horas as apagarAcessos24HorasRequest,
  deleteAcesso as deleteAcessoRequest,
  getAcessos,
  getAcessosLogins,
} from '@/services/acessos-service';
import type { Acesso, AcessoSortDirection, AcessoSortField } from '@/types/acesso';
import { matchesAcessoSearch, sortAcessos } from '@/utils/acesso-format';

const DELETE_ERROR_MESSAGE = 'Não foi possível excluir o registro. Tente novamente.';
const CLEAR_ACESSOS_ERROR_MESSAGE = 'Não foi possível limpar os acessos antigos. Tente novamente.';
const PERMISSION_ERROR_MESSAGE = 'Você não tem permissão para acessar esta funcionalidade.';
const SEARCH_DEBOUNCE_MS = 400;
const LISTA_REGISTROS_POLL_INTERVAL_MS = 60_000;

export type ListaRegistrosVariant = 'acessos' | 'logins';

const VARIANT_CONFIG = {
  acessos: {
    loadLog: 'Carregando lista de acessos',
    loadError: 'Não foi possível carregar a lista de acessos.',
    empty: 'Não há registros de acesso para exibir.',
    fetch: getAcessos,
  },
  logins: {
    loadLog: 'Carregando lista de logins',
    loadError: 'Não foi possível carregar a lista de logins.',
    empty: 'Não há registros de login para exibir.',
    fetch: getAcessosLogins,
  },
} as const;

type FetchOptions = {
  refreshing?: boolean;
  silent?: boolean;
};

type UseListaRegistrosScreenParams = {
  variant: ListaRegistrosVariant;
  isAdministrador: boolean;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useListaRegistrosScreen({
  variant,
  isAdministrador,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseListaRegistrosScreenParams) {
  const config = VARIANT_CONFIG[variant];

  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortField, setSortField] = useState<AcessoSortField>('id');
  const [sortDirection, setSortDirection] = useState<AcessoSortDirection>('desc');

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isClearingRecentAcessos, setIsClearingRecentAcessos] = useState(false);

  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBusyRef = useRef(false);

  useEffect(() => {
    isBusyRef.current = isDeleting || isClearingRecentAcessos;
  }, [isClearingRecentAcessos, isDeleting]);

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

  const filteredAcessos = useMemo(() => {
    const searched = acessos.filter((acesso) => matchesAcessoSearch(acesso, debouncedSearchQuery));
    return sortAcessos(searched, sortField, sortDirection);
  }, [acessos, debouncedSearchQuery, sortDirection, sortField]);

  const fetchAcessos = useCallback(
    async (options?: FetchOptions) => {
      if (!isAdministrador || !authToken) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      const showFullLoading = !options?.refreshing && !options?.silent;
      const showRefreshIndicator = options?.refreshing === true && !options?.silent;

      if (!options?.silent) {
        console.log(config.loadLog);
      }

      if (options?.silent) {
        try {
          const data = await config.fetch(authToken);

          if (requestId !== requestIdRef.current) {
            return;
          }

          setAcessos(data);
        } catch (error) {
          if (requestId !== requestIdRef.current) {
            return;
          }

          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            await onUnauthorized();
          }
        }

        return;
      }

      if (showFullLoading) {
        setIsLoading(true);
      }

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }

      setLoadError(null);

      try {
        const data = await config.fetch(authToken);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setAcessos(data);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return;
        }

        const message = getApiErrorMessage(error);
        setLoadError(message.includes('conectar') ? message : config.loadError);
        setAcessos([]);
      } finally {
        if (showFullLoading) {
          setIsLoading(false);
        }

        if (showRefreshIndicator) {
          setIsRefreshing(false);
        }
      }
    },
    [authToken, config, isAdministrador, onUnauthorized],
  );

  const deleteAcesso = useCallback(
    async (acessoId: number): Promise<string | null> => {
      if (!isAdministrador || !authToken) {
        return PERMISSION_ERROR_MESSAGE;
      }

      setIsDeleting(true);
      setDeleteError(null);

      console.log('Exclusão solicitada');

      try {
        await deleteAcessoRequest(acessoId, authToken);
        setAcessos((current) => current.filter((item) => item.id !== acessoId));
        return null;
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return DELETE_ERROR_MESSAGE;
        }

        const message = getApiErrorMessage(error);
        const errorMessage = message.includes('conectar') ? message : DELETE_ERROR_MESSAGE;
        setDeleteError(errorMessage);
        return errorMessage;
      } finally {
        setIsDeleting(false);
      }
    },
    [authToken, isAdministrador, onUnauthorized],
  );

  const deleteAcessosEmLote = useCallback(
    async (acessoIds: number[]): Promise<string | null> => {
      if (!isAdministrador || !authToken) {
        return PERMISSION_ERROR_MESSAGE;
      }

      if (acessoIds.length === 0) {
        return null;
      }

      setIsDeleting(true);
      setDeleteError(null);

      try {
        const results = await Promise.allSettled(
          acessoIds.map((acessoId) => deleteAcessoRequest(acessoId, authToken)),
        );

        const deletedIds: number[] = [];
        let hasAuthError = false;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            deletedIds.push(acessoIds[index]);
            return;
          }

          const error = result.reason;

          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            hasAuthError = true;
          }
        });

        if (deletedIds.length > 0) {
          setAcessos((current) => current.filter((item) => !deletedIds.includes(item.id)));
        }

        if (hasAuthError) {
          await onUnauthorized();
          return DELETE_ERROR_MESSAGE;
        }

        const failedCount = acessoIds.length - deletedIds.length;

        if (failedCount > 0) {
          const errorMessage =
            failedCount === acessoIds.length
              ? DELETE_ERROR_MESSAGE
              : `Não foi possível excluir ${failedCount} registro(s).`;
          setDeleteError(errorMessage);
          return errorMessage;
        }

        return null;
      } finally {
        setIsDeleting(false);
      }
    },
    [authToken, isAdministrador, onUnauthorized],
  );

  const limparAcessos24Horas = useCallback(async (): Promise<string | null> => {
    if (variant !== 'acessos') {
      return PERMISSION_ERROR_MESSAGE;
    }

    if (!isAdministrador || !authToken) {
      return PERMISSION_ERROR_MESSAGE;
    }

    setIsClearingRecentAcessos(true);

    try {
      await apagarAcessos24HorasRequest(authToken);
      await fetchAcessos({ refreshing: true });
      return null;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await onUnauthorized();
        return CLEAR_ACESSOS_ERROR_MESSAGE;
      }

      const message = getApiErrorMessage(error);
      return message.includes('conectar') ? message : CLEAR_ACESSOS_ERROR_MESSAGE;
    } finally {
      setIsClearingRecentAcessos(false);
    }
  }, [authToken, fetchAcessos, isAdministrador, onUnauthorized, variant]);

  useEffect(() => {
    if (isAuthLoading || !isAdministrador || !authToken) {
      return;
    }

    void fetchAcessos();
  }, [authToken, fetchAcessos, isAdministrador, isAuthLoading]);

  useEffect(() => {
    if (isAuthLoading || !isAdministrador || !authToken) {
      return;
    }

    const intervalId = setInterval(() => {
      if (isBusyRef.current) {
        return;
      }

      void fetchAcessos({ silent: true });
    }, LISTA_REGISTROS_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [authToken, fetchAcessos, isAdministrador, isAuthLoading]);

  function handleSortFieldChange(field: AcessoSortField) {
    if (field === sortField) {
      setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }

    setSortField(field);
    setSortDirection('desc');
  }

  return {
    acessos: filteredAcessos,
    isLoading,
    isRefreshing,
    loadError,
    searchQuery,
    sortField,
    sortDirection,
    isDeleting,
    isClearingRecentAcessos,
    deleteError,
    setSearchQuery,
    fetchAcessos,
    handleSortFieldChange,
    deleteAcesso,
    deleteAcessosEmLote,
    limparAcessos24Horas,
    clearDeleteError: () => setDeleteError(null),
    messages: {
      loadError: config.loadError,
      empty: config.empty,
      deleteSuccess: 'Registro excluído com sucesso.',
      deleteError: DELETE_ERROR_MESSAGE,
      clearAcessosSuccess: 'Acessos anteriores às últimas 24 horas excluídos com sucesso.',
      clearAcessosError: CLEAR_ACESSOS_ERROR_MESSAGE,
      clearAcessosConfirmTitle: 'Limpar Acessos 24 hs',
      clearAcessosConfirmMessage:
        'Deseja apagar os registros de acesso anteriores às últimas 24 horas?',
      batchDeleteConfirmTitle: 'Excluir registros filtrados',
      batchDeleteConfirmMessage: (count: number) =>
        `Deseja excluir ${count} registro(s) exibido(s) pelo filtro atual?`,
      batchDeleteError: DELETE_ERROR_MESSAGE,
      permissionError: PERMISSION_ERROR_MESSAGE,
    },
  };
}

export function useListaAcessosScreen(
  params: Omit<UseListaRegistrosScreenParams, 'variant'>,
) {
  return useListaRegistrosScreen({ ...params, variant: 'acessos' });
}

export const LISTA_ACESSOS_MESSAGES = {
  loadError: VARIANT_CONFIG.acessos.loadError,
  empty: VARIANT_CONFIG.acessos.empty,
  deleteSuccess: 'Registro excluído com sucesso.',
  deleteError: DELETE_ERROR_MESSAGE,
  clearAcessosSuccess: 'Acessos anteriores às últimas 24 horas excluídos com sucesso.',
  clearAcessosError: CLEAR_ACESSOS_ERROR_MESSAGE,
  clearAcessosConfirmTitle: 'Limpar Acessos 24 hs',
  clearAcessosConfirmMessage:
    'Deseja apagar os registros de acesso anteriores às últimas 24 horas?',
  permissionError: PERMISSION_ERROR_MESSAGE,
};

export const LISTA_LOGINS_MESSAGES = {
  loadError: VARIANT_CONFIG.logins.loadError,
  empty: VARIANT_CONFIG.logins.empty,
  deleteSuccess: 'Registro excluído com sucesso.',
  deleteError: DELETE_ERROR_MESSAGE,
  permissionError: PERMISSION_ERROR_MESSAGE,
};
