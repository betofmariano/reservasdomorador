import { useUserContext } from '@/contexts/user-context';
import type { User } from '@/types/user';
import { canShowAdministracaoEntry, shouldShowUsuariosInHeaderMenu } from '@/utils/club-config';

export type AdministracaoMenuAccess = {
  canAccess: boolean;
  showAdministracaoEntry: boolean;
  isClubGestor: boolean;
  showUsuariosInHeaderMenu: boolean;
  isCheckingAccess: boolean;
};

export function useAdministracaoMenuAccess(_user?: User | null): AdministracaoMenuAccess {
  const { user, permissions, isLoading } = useUserContext();

  if (!user || isLoading) {
    return {
      canAccess: false,
      showAdministracaoEntry: false,
      isClubGestor: false,
      showUsuariosInHeaderMenu: false,
      isCheckingAccess: isLoading,
    };
  }

  const showAdministracaoEntry =
    permissions.administrador ||
    permissions.podeGerirLocal ||
    canShowAdministracaoEntry(user);
  const isClubGestor =
    (permissions.podeGerirLocal || user.gestor === true) && !permissions.administrador;

  return {
    canAccess: showAdministracaoEntry,
    showAdministracaoEntry,
    isClubGestor,
    showUsuariosInHeaderMenu: shouldShowUsuariosInHeaderMenu(user),
    isCheckingAccess: false,
  };
}

export function canShowAdministracaoMenu(user: User | null): boolean {
  if (!user) {
    return false;
  }

  return user.administrador === true || user.gestor === true;
}
