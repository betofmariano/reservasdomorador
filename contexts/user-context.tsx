import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { buildUserContextRefreshKey } from '@/utils/user-context-refresh-key';

import { useAuth } from '@/contexts/auth-context';
import {
  buildUserContextFromRecords,
  loadUserContextRecords,
} from '@/services/user-context-service';
import { registerLogadoForAuthenticatedUser } from '@/services/logados-service';
import { persistUserLocalPrioritario } from '@/services/user-local-prioritario-service';
import type { UserContextState } from '@/types/user-context';
import { EMPTY_USER_CONTEXT_PERMISSIONS } from '@/types/user-context';
import type { User } from '@/types/user';
import { isLocalPrioritarioValid } from '@/utils/user-local-validation';

type UserContextValue = UserContextState & {
  refreshUserContext: (
    sessionAcademiasIdOverride?: number | null,
    userOverride?: User,
  ) => Promise<void>;
  setSessionAcademiasId: (academiasId: number | null) => void;
  selectLocalPrioritario: (academiasId: number) => Promise<void>;
  isSelectingLocal: boolean;
  selectLocalError: string | null;
};

const EMPTY_STATE: UserContextState = {
  user: null,
  currentUserLocal: null,
  currentAcademia: null,
  userLocals: [],
  selectableUserLocals: [],
  permissions: EMPTY_USER_CONTEXT_PERMISSIONS,
  effectiveAcademiasId: null,
  requiresLocalSelection: false,
  isLoading: false,
  error: null,
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserContextProvider({ children }: { children: ReactNode }) {
  const { user, authToken, isAuthenticated, isLoading: isAuthLoading, patchUser } = useAuth();
  const [state, setState] = useState<UserContextState>(EMPTY_STATE);
  const [sessionAcademiasId, setSessionAcademiasId] = useState<number | null>(null);
  const [isSelectingLocal, setIsSelectingLocal] = useState(false);
  const [selectLocalError, setSelectLocalError] = useState<string | null>(null);
  const autoPersistAttemptedRef = useRef<number | null>(null);
  const userRef = useRef(user);

  userRef.current = user;

  const userContextRefreshKey = useMemo(() => buildUserContextRefreshKey(user), [user]);

  const refreshUserContext = useCallback(
    async (sessionAcademiasIdOverride?: number | null, userOverride?: User) => {
      const currentUser = userOverride ?? userRef.current;

      if (!isAuthenticated || !currentUser?.id || !authToken) {
        setState(EMPTY_STATE);
        setSessionAcademiasId(null);
        autoPersistAttemptedRef.current = null;
        return;
      }

      const resolvedUser = currentUser;
      const resolvedSessionAcademiasId =
        sessionAcademiasIdOverride !== undefined ? sessionAcademiasIdOverride : sessionAcademiasId;

      if (sessionAcademiasIdOverride !== undefined) {
        setSessionAcademiasId(sessionAcademiasIdOverride);
      }

      setState((current) => ({ ...current, isLoading: true, error: null }));

      try {
        const { associations, academias } = await loadUserContextRecords(resolvedUser, authToken);
        const nextState = buildUserContextFromRecords({
          user: resolvedUser,
          associations,
          academias,
          sessionAcademiasId: resolvedSessionAcademiasId,
        });

        setState(nextState);

        const logadoAcademiasId =
          nextState.effectiveAcademiasId ??
          resolvedUser.localPrioritario ??
          resolvedUser.academias_id ??
          nextState.userLocals[0]?.academias_id ??
          null;

        if (resolvedUser.id > 0 && logadoAcademiasId != null && logadoAcademiasId > 0) {
          void registerLogadoForAuthenticatedUser(authToken, {
            sessionAcademiasId:
              resolvedSessionAcademiasId ?? nextState.effectiveAcademiasId ?? logadoAcademiasId,
          }).catch((error) => {
            console.warn('Não foi possível registrar em /logados:', error);
          });
        }

        const shouldAutoPersist =
          nextState.selectableUserLocals.length === 1 &&
          !isLocalPrioritarioValid(
            resolvedUser.localPrioritario,
            associations,
            academias,
            resolvedUser,
          );
        const autoPersistAcademiasId = nextState.selectableUserLocals[0]?.academias_id ?? null;

        if (
          shouldAutoPersist &&
          autoPersistAcademiasId != null &&
          autoPersistAttemptedRef.current !== autoPersistAcademiasId
        ) {
          autoPersistAttemptedRef.current = autoPersistAcademiasId;
          const associationId = nextState.selectableUserLocals[0]?.id ?? null;

          void persistUserLocalPrioritario({
            userId: resolvedUser.id,
            academiasId: autoPersistAcademiasId,
            authToken,
            usersLocalId: associationId,
          })
            .then(() => {
              patchUser({
                localPrioritario: autoPersistAcademiasId,
                academias_id: autoPersistAcademiasId,
              });
            })
            .catch(() => {
              autoPersistAttemptedRef.current = null;
            });
        }
      } catch {
        setState({
          ...EMPTY_STATE,
          user: resolvedUser,
          isLoading: false,
          error: 'Não foi possível carregar o contexto do local.',
        });
      }
    },
    [authToken, isAuthenticated, patchUser, sessionAcademiasId],
  );

  const selectLocalPrioritario = useCallback(
    async (academiasId: number) => {
      if (!user?.id || !authToken) {
        setSelectLocalError('Não foi possível identificar o usuário.');
        return;
      }

      const selectedLocal = state.selectableUserLocals.find(
        (item) => item.academias_id === academiasId,
      );

      if (!selectedLocal) {
        setSelectLocalError('Local selecionado não está disponível.');
        return;
      }

      setIsSelectingLocal(true);
      setSelectLocalError(null);
      setSessionAcademiasId(academiasId);

      const updatedUser: User = {
        ...user,
        localPrioritario: academiasId,
        academias_id: academiasId,
      };

      patchUser({
        localPrioritario: academiasId,
        academias_id: academiasId,
      });

      try {
        await persistUserLocalPrioritario({
          userId: user.id,
          academiasId,
          authToken,
          usersLocalId: selectedLocal.id,
        });
      } catch {
        setSelectLocalError(
          'Local definido nesta sessão. Não foi possível salvar no servidor — tente novamente mais tarde.',
        );
      }

      await refreshUserContext(academiasId, updatedUser);
      setIsSelectingLocal(false);
    },
    [authToken, patchUser, refreshUserContext, state.selectableUserLocals, user],
  );

  useEffect(() => {
    if (isAuthLoading || !userContextRefreshKey) {
      return;
    }

    void refreshUserContext();
  }, [isAuthLoading, refreshUserContext, userContextRefreshKey]);

  useEffect(() => {
    if (!state.effectiveAcademiasId) {
      return;
    }

    setSessionAcademiasId((current) => current ?? state.effectiveAcademiasId);
  }, [state.effectiveAcademiasId]);

  const value = useMemo<UserContextValue>(
    () => ({
      ...state,
      refreshUserContext,
      setSessionAcademiasId,
      selectLocalPrioritario,
      isSelectingLocal,
      selectLocalError,
    }),
    [isSelectingLocal, refreshUserContext, selectLocalError, selectLocalPrioritario, state],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextValue {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUserContext deve ser usado dentro de UserContextProvider.');
  }

  return context;
}
