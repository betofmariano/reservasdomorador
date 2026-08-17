import { useUserContext } from '@/contexts/user-context';

export function useClubConfigMenuAccess(): boolean {
  const { permissions, isLoading } = useUserContext();

  if (isLoading) {
    return false;
  }

  return permissions.administrador || permissions.podeGerirLocal;
}
