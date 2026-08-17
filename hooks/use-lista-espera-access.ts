import { useUserContext } from '@/contexts/user-context';

export function useListaEsperaAccess() {
  const { permissions, effectiveAcademiasId, isLoading } = useUserContext();

  return {
    canAccessListaEspera:
      !isLoading && permissions.podeAcessarListaEspera && effectiveAcademiasId != null,
    canAccessListaEsperaNaHome:
      !isLoading && permissions.podeVerListaEsperaNaHome && effectiveAcademiasId != null,
    isCheckingListaEsperaAccess: isLoading,
  };
}
