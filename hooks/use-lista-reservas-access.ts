import { useUserContext } from '@/contexts/user-context';

export function useListaReservasAccess() {
  const { permissions, effectiveAcademiasId, isLoading } = useUserContext();

  return {
    canAccessListaReservas:
      !isLoading &&
      (permissions.administrador ||
        (permissions.podeAcessarListaReservas && effectiveAcademiasId != null)),
    isCheckingListaReservasAccess: isLoading,
  };
}
