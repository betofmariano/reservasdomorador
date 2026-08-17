import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError, getApiErrorMessage } from '@/services/api-client';
import {
  approveUsuarioRecords,
  deleteUsersLocalRecord,
  setGestorUsuarioRecords,
  setProfessorUsuarioRecords,
  setUsersLocalBlocked,
  suspendUsuarioAtividadeRecords,
  updateUsersLocalRecord,
} from '@/services/usuario-gestor-service';
import { getUsuariosLocal, invalidateUsuariosLocalCache } from '@/services/usuarios-service';
import type { GestorUsuarioListItem, GestorUsuarioSortDirection, GestorUsuarioSortField, GestorUsuarioStatusFilter } from '@/types/usuario';
import type { User } from '@/types/user';
import {
  applyGestorUsuarioListPatches,
  filterGestorUsuarios,
  LISTA_USUARIOS_GESTOR_MESSAGES,
  mapUsersLocalToGestorList,
  sortGestorUsuarios,
} from '@/utils/usuario-gestor-lista';

const SEARCH_DEBOUNCE_MS = 400;
const LISTA_USUARIOS_GESTOR_POLL_INTERVAL_MS = 60_000;

type GestorUsuarioActionPatch = {
  userslocalId: number;
  fields: Partial<GestorUsuarioListItem>;
};

type UseListaUsuariosGestorScreenParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  isAdministrador: boolean;
  selectedClubId: number | null;
  canManageSelectedClub: boolean;
  isLoadingClubContext: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useListaUsuariosGestorScreen({
  user,
  authToken,
  isAuthLoading,
  isAdministrador,
  selectedClubId,
  canManageSelectedClub,
  isLoadingClubContext,
  onUnauthorized,
}: UseListaUsuariosGestorScreenParams) {
  const [usuarios, setUsuarios] = useState<GestorUsuarioListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GestorUsuarioStatusFilter>('todos');
  const [sortField, setSortField] = useState<GestorUsuarioSortField>('nome');
  const [sortDirection, setSortDirection] = useState<GestorUsuarioSortDirection>('asc');

  const [isActionRunning, setIsActionRunning] = useState(false);

  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActionRunningRef = useRef(isActionRunning);
  const localPatchesRef = useRef<Record<number, Partial<GestorUsuarioListItem>>>({});

  useEffect(() => {
    isActionRunningRef.current = isActionRunning;
  }, [isActionRunning]);

  const applyUsuariosWithLocalPatches = useCallback(
    (
      records: ReturnType<typeof mapUsersLocalToGestorList>,
      extraPreserve?: Record<number, Partial<GestorUsuarioListItem>>,
    ) => {
      for (const [idStr, patch] of Object.entries(localPatchesRef.current)) {
        const userslocalId = Number(idStr);
        const serverItem = records.find((item) => item.userslocalId === userslocalId);

        if (!serverItem) {
          continue;
        }

        const remainingEntries = Object.entries(patch).filter(([key, value]) => {
          return serverItem[key as keyof GestorUsuarioListItem] !== value;
        });

        if (remainingEntries.length === 0) {
          delete localPatchesRef.current[userslocalId];
        } else {
          localPatchesRef.current[userslocalId] = Object.fromEntries(
            remainingEntries,
          ) as Partial<GestorUsuarioListItem>;
        }
      }

      return applyGestorUsuarioListPatches(records, {
        ...localPatchesRef.current,
        ...extraPreserve,
      });
    },
    [],
  );

  const filteredUsuarios = useMemo(() => {
    const filtered = filterGestorUsuarios(usuarios, {
      statusFilter,
      searchQuery: debouncedSearchQuery,
    });

    return sortGestorUsuarios(filtered, sortField, sortDirection);
  }, [debouncedSearchQuery, sortDirection, sortField, statusFilter, usuarios]);

  useEffect(() => {
    setSortField('nome');
    setSortDirection('asc');
    localPatchesRef.current = {};
  }, [selectedClubId]);

  useEffect(() => {
    if (!isAdministrador) {
      setSortField('nome');
      setSortDirection('asc');
    }
  }, [isAdministrador]);

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

  function handleNomeSortPress() {
    if (!isAdministrador) {
      return;
    }

    if (sortField === 'nome') {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField('nome');
    setSortDirection('asc');
  }

  function handleUltimaEntradaSortPress() {
    if (!isAdministrador) {
      return;
    }

    if (sortField === 'ultimaEntrada') {
      setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }

    setSortField('ultimaEntrada');
    setSortDirection('desc');
  }

  const fetchUsuarios = useCallback(
    async (options?: {
      refreshing?: boolean;
      silent?: boolean;
      preserveByUserslocalId?: Record<number, Partial<GestorUsuarioListItem>>;
    }) => {
      if (
        !authToken ||
        !selectedClubId ||
        !canManageSelectedClub ||
        isLoadingClubContext
      ) {
        if (!options?.silent) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      const currentRequestId = ++requestIdRef.current;

      if (options?.silent) {
        try {
          const data = await getUsuariosLocal(authToken, selectedClubId, { force: true });

          if (currentRequestId !== requestIdRef.current) {
            return;
          }

          const mapped = applyUsuariosWithLocalPatches(
            mapUsersLocalToGestorList(data, selectedClubId),
            options?.preserveByUserslocalId,
          );
          setUsuarios(mapped);
        } catch (error) {
          if (currentRequestId !== requestIdRef.current) {
            return;
          }

          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            await onUnauthorized();
          }
        }

        return;
      }

      if (options?.refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setLoadError(null);

      try {
        const data = await getUsuariosLocal(authToken, selectedClubId, {
          force: options?.refreshing,
        });

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const mapped = applyUsuariosWithLocalPatches(
          mapUsersLocalToGestorList(data, selectedClubId),
          options?.preserveByUserslocalId,
        );
        setUsuarios(mapped);
        console.log('Quantidade de usuários:', mapped.length);
      } catch (error) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return;
        }

        const message = getApiErrorMessage(error);
        setLoadError(message.includes('conectar') ? message : LISTA_USUARIOS_GESTOR_MESSAGES.loadError);
        setUsuarios([]);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [
      applyUsuariosWithLocalPatches,
      authToken,
      canManageSelectedClub,
      isLoadingClubContext,
      onUnauthorized,
      selectedClubId,
    ],
  );

  useEffect(() => {
    if (isAuthLoading || !user || !authToken || isLoadingClubContext) {
      return;
    }

    if (!selectedClubId || !canManageSelectedClub) {
      setUsuarios([]);
      return;
    }

    void fetchUsuarios();
  }, [
    authToken,
    canManageSelectedClub,
    fetchUsuarios,
    isAuthLoading,
    isLoadingClubContext,
    selectedClubId,
    user,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (
        isAuthLoading ||
        !user ||
        !authToken ||
        isLoadingClubContext ||
        !selectedClubId ||
        !canManageSelectedClub
      ) {
        return;
      }

      const intervalId = setInterval(() => {
        if (isActionRunningRef.current) {
          return;
        }

        void fetchUsuarios({ silent: true });
      }, LISTA_USUARIOS_GESTOR_POLL_INTERVAL_MS);

      return () => clearInterval(intervalId);
    }, [
      authToken,
      canManageSelectedClub,
      fetchUsuarios,
      isAuthLoading,
      isLoadingClubContext,
      selectedClubId,
      user,
    ]),
  );

  const updateLocalUsuario = useCallback((updated: GestorUsuarioListItem) => {
    setUsuarios((current) =>
      current.map((item) => (item.userslocalId === updated.userslocalId ? updated : item)),
    );
  }, []);

  const removeLocalUsuario = useCallback((userslocalId: number) => {
    delete localPatchesRef.current[userslocalId];
    setUsuarios((current) => current.filter((item) => item.userslocalId !== userslocalId));
  }, []);

  const updateUsuarioFoto = useCallback((userslocalId: number, foto: string | null) => {
    setUsuarios((current) =>
      current.map((item) => (item.userslocalId === userslocalId ? { ...item, foto } : item)),
    );
  }, []);

  const runAction = useCallback(
    async (
      action: () => Promise<GestorUsuarioActionPatch | void>,
      options?: { skipRefresh?: boolean },
    ): Promise<string | null> => {
      if (isActionRunning || !authToken) {
        return LISTA_USUARIOS_GESTOR_MESSAGES.actionError;
      }

      setIsActionRunning(true);

      try {
        const patch = await action();

        if (patch) {
          localPatchesRef.current[patch.userslocalId] = {
            ...localPatchesRef.current[patch.userslocalId],
            ...patch.fields,
          };
        }

        invalidateUsuariosLocalCache();

        if (!options?.skipRefresh) {
          void fetchUsuarios({
            silent: true,
            preserveByUserslocalId: patch
              ? { [patch.userslocalId]: patch.fields }
              : undefined,
          });
        }

        return null;
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return LISTA_USUARIOS_GESTOR_MESSAGES.actionError;
        }

        const message = getApiErrorMessage(error);
        return message.includes('conectar') ? message : message || LISTA_USUARIOS_GESTOR_MESSAGES.actionError;
      } finally {
        setIsActionRunning(false);
      }
    },
    [authToken, fetchUsuarios, isActionRunning, onUnauthorized],
  );

  const approveUsuario = useCallback(
    async (usuario: GestorUsuarioListItem): Promise<string | null> => {
      if (!authToken) {
        return LISTA_USUARIOS_GESTOR_MESSAGES.actionError;
      }

      return runAction(async () => {
        const local = await approveUsuarioRecords(usuario.userslocalId, authToken);
        // PATCH bem-sucedido = aprovado; a resposta do Xano nem sempre traz o campo.
        const aprovado = true;
        const bloqueado = local?.bloqueado === true || usuario.bloqueado === true;

        updateLocalUsuario({
          ...usuario,
          aprovado,
          bloqueado,
        });

        return {
          userslocalId: usuario.userslocalId,
          fields: { aprovado, bloqueado },
        };
      });
    },
    [authToken, runAction, updateLocalUsuario],
  );

  const toggleBlockUsuario = useCallback(
    async (usuario: GestorUsuarioListItem): Promise<string | null> => {
      if (!authToken) {
        return LISTA_USUARIOS_GESTOR_MESSAGES.actionError;
      }

      const nextBlocked = !usuario.bloqueado;

      return runAction(async () => {
        const updated = await setUsersLocalBlocked(usuario.userslocalId, nextBlocked, authToken);
        const aprovado = updated?.aprovado ?? usuario.aprovado;

        updateLocalUsuario({
          ...usuario,
          aprovado,
          bloqueado: nextBlocked,
        });

        return {
          userslocalId: usuario.userslocalId,
          fields: { bloqueado: nextBlocked, aprovado },
        };
      });
    },
    [authToken, runAction, updateLocalUsuario],
  );

  const blockUsuarioTotal = useCallback(
    async (usuario: GestorUsuarioListItem): Promise<string | null> => {
      if (!authToken || usuario.bloqueado) {
        return LISTA_USUARIOS_GESTOR_MESSAGES.actionError;
      }

      return runAction(async () => {
        const updated = await setUsersLocalBlocked(usuario.userslocalId, true, authToken);
        const aprovado = updated?.aprovado ?? usuario.aprovado;

        updateLocalUsuario({
          ...usuario,
          aprovado,
          bloqueado: true,
        });

        return {
          userslocalId: usuario.userslocalId,
          fields: { bloqueado: true, aprovado },
        };
      });
    },
    [authToken, runAction, updateLocalUsuario],
  );

  const suspendUsuarioAtividade = useCallback(
    async (
      usuario: GestorUsuarioListItem,
      atividadesId: number,
      dias: number,
    ): Promise<string | null> => {
      if (!authToken) {
        return LISTA_USUARIOS_GESTOR_MESSAGES.actionError;
      }

      return runAction(async () => {
        await suspendUsuarioAtividadeRecords(
          usuario.userslocalId,
          usuario.usersId,
          atividadesId,
          dias,
          authToken,
        );
      });
    },
    [authToken, runAction],
  );

  const setGestorUsuario = useCallback(
    async (usuario: GestorUsuarioListItem, enableGestor: boolean): Promise<string | null> => {
      if (!authToken) {
        return LISTA_USUARIOS_GESTOR_MESSAGES.actionError;
      }

      return runAction(async () => {
        const local = await setGestorUsuarioRecords(
          usuario.userslocalId,
          enableGestor,
          authToken,
        );
        const gestor = local?.gestor ?? enableGestor;

        updateLocalUsuario({
          ...usuario,
          gestor,
        });

        return {
          userslocalId: usuario.userslocalId,
          fields: { gestor },
        };
      });
    },
    [authToken, runAction, updateLocalUsuario],
  );

  const setProfessorUsuario = useCallback(
    async (usuario: GestorUsuarioListItem, enableProfessor: boolean): Promise<string | null> => {
      if (!authToken) {
        return LISTA_USUARIOS_GESTOR_MESSAGES.actionError;
      }

      return runAction(async () => {
        const local = await setProfessorUsuarioRecords(
          usuario.userslocalId,
          enableProfessor,
          authToken,
        );
        const professor = local?.professor ?? enableProfessor;

        updateLocalUsuario({
          ...usuario,
          professor,
        });

        return {
          userslocalId: usuario.userslocalId,
          fields: { professor },
        };
      });
    },
    [authToken, runAction, updateLocalUsuario],
  );

  const deleteUsuario = useCallback(
    async (usuario: GestorUsuarioListItem): Promise<string | null> => {
      if (!authToken || !canManageSelectedClub) {
        return LISTA_USUARIOS_GESTOR_MESSAGES.actionError;
      }

      return runAction(async () => {
        await deleteUsersLocalRecord(usuario.userslocalId, authToken);
        removeLocalUsuario(usuario.userslocalId);
      }, { skipRefresh: true });
    },
    [authToken, canManageSelectedClub, removeLocalUsuario, runAction],
  );

  const updateUsuarioExtraFields = useCallback(
    async (
      usuario: GestorUsuarioListItem,
      fields: { complemento?: string; socioTitulo?: string },
    ): Promise<string | null> => {
      if (!authToken || !canManageSelectedClub) {
        return LISTA_USUARIOS_GESTOR_MESSAGES.actionError;
      }

      const hasComplementoUpdate = fields.complemento !== undefined;
      const hasSocioTituloUpdate = fields.socioTitulo !== undefined;

      if (!hasComplementoUpdate && !hasSocioTituloUpdate) {
        return null;
      }

      return runAction(async () => {
        const updates: Promise<unknown>[] = [];

        if (hasComplementoUpdate) {
          updates.push(
            updateUsersLocalRecord(
              usuario.userslocalId,
              { complemento: fields.complemento?.trim() ?? '' },
              authToken,
            ),
          );
        }

        if (hasSocioTituloUpdate) {
          updates.push(
            updateUsersLocalRecord(
              usuario.userslocalId,
              { socioTitulo: fields.socioTitulo?.trim() ?? '' },
              authToken,
            ),
          );
        }

        await Promise.all(updates);

        const patchFields: Partial<GestorUsuarioListItem> = {};

        if (hasComplementoUpdate) {
          patchFields.complemento = fields.complemento?.trim() ?? '';
        }

        if (hasSocioTituloUpdate) {
          patchFields.socio = fields.socioTitulo?.trim() ?? '';
        }

        updateLocalUsuario({
          ...usuario,
          ...patchFields,
        });

        return {
          userslocalId: usuario.userslocalId,
          fields: patchFields,
        };
      });
    },
    [authToken, canManageSelectedClub, runAction, updateLocalUsuario],
  );

  return {
    usuarios: filteredUsuarios,
    totalCount: filteredUsuarios.length,
    isLoading,
    isRefreshing,
    loadError,
    searchQuery,
    statusFilter,
    sortField,
    sortDirection,
    isActionRunning,
    setSearchQuery,
    setStatusFilter,
    handleNomeSortPress,
    handleUltimaEntradaSortPress,
    fetchUsuarios,
    approveUsuario,
    toggleBlockUsuario,
    blockUsuarioTotal,
    suspendUsuarioAtividade,
    setGestorUsuario,
    setProfessorUsuario,
    deleteUsuario,
    updateUsuarioFoto,
    updateUsuarioExtraFields,
  };
}

export { LISTA_USUARIOS_GESTOR_MESSAGES };
