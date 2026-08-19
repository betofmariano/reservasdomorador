import { useAuth } from '@/contexts/auth-context';
import { useUserContext } from '@/contexts/user-context';
import { SelecionarLocalPrioritarioModal } from '@/components/selecionar-local-prioritario-modal';
import { getActiveRouteName, isAuthRoute, shouldSkipLocalSelection } from '@/utils/route-access';
import { useSegments } from 'expo-router';

export function UserLocalSelectionGate() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    requiresLocalSelection,
    permissions,
    isLoading: isUserContextLoading,
    selectableUserLocals,
    selectLocalPrioritario,
    isSelectingLocal,
    selectLocalError,
  } = useUserContext();
  const segments = useSegments();
  const inAuthGroup = isAuthRoute(segments);
  const skipLocalSelection = shouldSkipLocalSelection(getActiveRouteName(segments));

  const visible =
    isAuthenticated &&
    !isAuthLoading &&
    !isUserContextLoading &&
    !inAuthGroup &&
    !skipLocalSelection &&
    !permissions.administrador &&
    requiresLocalSelection &&
    selectableUserLocals.length > 1;

  return (
    <SelecionarLocalPrioritarioModal
      visible={visible}
      userLocals={selectableUserLocals}
      isSubmitting={isSelectingLocal}
      errorMessage={selectLocalError}
      onConfirm={(academiasId) => {
        void selectLocalPrioritario(academiasId);
      }}
    />
  );
}
