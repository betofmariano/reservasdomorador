import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError, getApiErrorMessage } from '@/services/api-client';
import {
  approveGestorMorador,
  getGestorMoradores,
  setGestorMoradorBloqueio,
  setGestorMoradorGestor,
  deleteGestorMorador,
} from '@/services/gestor-moradores-service';
import type { GestorUsuarioListItem, GestorUsuarioStatusFilter } from '@/types/usuario';
import {
  LISTA_USUARIOS_GESTOR_MESSAGES,
  matchesGestorUsuarioStatusFilter,
} from '@/utils/usuario-gestor-lista';
import { matchesSearchText } from '@/utils/search-text';

type GestorMoradorActionResult =
  | { ok: true; mensagem: string }
  | { ok: false; mensagem: string };

const SEARCH_DEBOUNCE_MS = 400;

type UseListaUsuariosGestorScreenParams = {
  authToken: string | null;
  academiasId: number | null;
  isAuthLoading: boolean;
  canAccess: boolean;
  isContextLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

function filterGestorMoradores(
  usuarios: GestorUsuarioListItem[],
  statusFilter: GestorUsuarioStatusFilter,
  searchQuery: string,
): GestorUsuarioListItem[] {
  return usuarios.filter((usuario) => {
    if (!matchesGestorUsuarioStatusFilter(usuario, statusFilter)) {
      return false;
    }

    if (!searchQuery.trim()) {
      return true;
    }

    return (
      matchesSearchText(usuario.nome, searchQuery) ||
      matchesSearchText(usuario.telefone, searchQuery) ||
      matchesSearchText(usuario.telefoneLimpo, searchQuery) ||
      matchesSearchText(usuario.endereco, searchQuery)
    );
  });
}

export function useListaUsuariosGestorScreen({
  authToken,
  academiasId,
  isAuthLoading,
  canAccess,
  isContextLoading,
  onUnauthorized,
}: UseListaUsuariosGestorScreenParams) {
  const [usuarios, setUsuarios] = useState<GestorUsuarioListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GestorUsuarioStatusFilter>('todos');
  const [actingUserslocalId, setActingUserslocalId] = useState<number | null>(null);

  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actingRef = useRef<number | null>(null);

  const isActionRunning = actingUserslocalId != null;

  const filteredUsuarios = useMemo(
    () => filterGestorMoradores(usuarios, statusFilter, debouncedSearchQuery),
    [debouncedSearchQuery, statusFilter, usuarios],
  );

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

  const fetchUsuarios = useCallback(
    async (options?: { refreshing?: boolean; silent?: boolean }) => {
      if (!authToken || !academiasId || academiasId <= 0 || !canAccess || isContextLoading) {
        if (!options?.silent) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      const currentRequestId = ++requestIdRef.current;

      if (!options?.silent) {
        if (options?.refreshing) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setLoadError(null);
      }

      try {
        const data = await getGestorMoradores(academiasId, authToken);

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setUsuarios(data);
        setLoadError(null);
      } catch (error) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          await onUnauthorized();
          return;
        }

        setLoadError(getApiErrorMessage(error) || LISTA_USUARIOS_GESTOR_MESSAGES.loadError);
        setUsuarios([]);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [academiasId, authToken, canAccess, isContextLoading, onUnauthorized],
  );

  useEffect(() => {
    if (isAuthLoading || isContextLoading) {
      return;
    }

    if (!canAccess || !authToken || !academiasId) {
      setUsuarios([]);
      return;
    }

    void fetchUsuarios();
  }, [academiasId, authToken, canAccess, fetchUsuarios, isAuthLoading, isContextLoading]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthLoading || isContextLoading || !canAccess || !authToken || !academiasId) {
        return;
      }

      void fetchUsuarios({ silent: true });
    }, [academiasId, authToken, canAccess, fetchUsuarios, isAuthLoading, isContextLoading]),
  );

  const runAction = useCallback(
    async (userslocalId: number, action: () => Promise<string>): Promise<GestorMoradorActionResult> => {
      if (actingRef.current != null || !authToken) {
        return { ok: false, mensagem: LISTA_USUARIOS_GESTOR_MESSAGES.actionError };
      }

      actingRef.current = userslocalId;
      setActingUserslocalId(userslocalId);

      try {
        const mensagem = await action();
        await fetchUsuarios({ silent: true });
        return { ok: true, mensagem };
      } catch (error) {
        const message = getApiErrorMessage(error);

        if (error instanceof ApiError && error.status === 401) {
          await onUnauthorized();
          return { ok: false, mensagem: message || LISTA_USUARIOS_GESTOR_MESSAGES.actionError };
        }

        return { ok: false, mensagem: message || LISTA_USUARIOS_GESTOR_MESSAGES.actionError };
      } finally {
        actingRef.current = null;
        setActingUserslocalId(null);
      }
    },
    [authToken, fetchUsuarios, onUnauthorized],
  );

  const approveUsuario = useCallback(
    async (usuario: GestorUsuarioListItem): Promise<GestorMoradorActionResult> => {
      if (!authToken) {
        return { ok: false, mensagem: LISTA_USUARIOS_GESTOR_MESSAGES.actionError };
      }

      return runAction(usuario.userslocalId, () =>
        approveGestorMorador(usuario.userslocalId, authToken),
      );
    },
    [authToken, runAction],
  );

  const setBloqueioUsuario = useCallback(
    async (usuario: GestorUsuarioListItem, bloqueio: boolean): Promise<GestorMoradorActionResult> => {
      if (!authToken) {
        return { ok: false, mensagem: LISTA_USUARIOS_GESTOR_MESSAGES.actionError };
      }

      return runAction(usuario.userslocalId, () =>
        setGestorMoradorBloqueio(usuario.userslocalId, bloqueio, authToken),
      );
    },
    [authToken, runAction],
  );

  const setGestorUsuario = useCallback(
    async (usuario: GestorUsuarioListItem, gestor: boolean): Promise<GestorMoradorActionResult> => {
      if (!authToken) {
        return { ok: false, mensagem: LISTA_USUARIOS_GESTOR_MESSAGES.actionError };
      }

      return runAction(usuario.userslocalId, () =>
        setGestorMoradorGestor(usuario.userslocalId, gestor, authToken),
      );
    },
    [authToken, runAction],
  );

  const deleteUsuario = useCallback(
    async (usuario: GestorUsuarioListItem): Promise<GestorMoradorActionResult> => {
      if (!authToken) {
        return { ok: false, mensagem: LISTA_USUARIOS_GESTOR_MESSAGES.actionError };
      }

      return runAction(usuario.userslocalId, () =>
        deleteGestorMorador(usuario.userslocalId, authToken),
      );
    },
    [authToken, runAction],
  );

  return {
    usuarios: filteredUsuarios,
    totalCount: filteredUsuarios.length,
    isLoading,
    isRefreshing,
    loadError,
    searchQuery,
    statusFilter,
    isActionRunning,
    actingUserslocalId,
    setSearchQuery,
    setStatusFilter,
    fetchUsuarios,
    approveUsuario,
    setBloqueioUsuario,
    setGestorUsuario,
    deleteUsuario,
  };
}

export { LISTA_USUARIOS_GESTOR_MESSAGES };
