import { useUserContext } from '@/contexts/user-context';

export function useListaReservasAtividadeAccess() {
  const {
    permissions,
    effectiveAcademiasId,
    requiresLocalSelection,
    isLoading,
  } = useUserContext();

  return {
    canAccessListaReservasAtividade:
      !isLoading &&
      !requiresLocalSelection &&
      permissions.podeAcessarListaReservasAtividade &&
      effectiveAcademiasId != null,
    requiresLocalSelection: !isLoading && requiresLocalSelection,
    isCheckingAccess: isLoading,
  };
}
