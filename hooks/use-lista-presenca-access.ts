import { useUserContext } from '@/contexts/user-context';

export function useListaPresencaAccess() {
  const { permissions, effectiveAcademiasId, isLoading } = useUserContext();

  return {
    canAccessListaPresenca:
      !isLoading && permissions.podeAcessarListaPresenca && effectiveAcademiasId != null,
    canAccessListaPresencaNaHome:
      !isLoading && permissions.podeVerListaPresencaNaHome && effectiveAcademiasId != null,
    isCheckingListaPresencaAccess: isLoading,
  };
}
