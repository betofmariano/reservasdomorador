import { useMemo } from 'react';

import { useUserContext } from '@/contexts/user-context';
import { useAcademiaAdminSelection } from '@/hooks/use-academia-admin-selection';
import type { Academia } from '@/types/academia';
import type { User } from '@/types/user';

type UseGestorAcademiaScopeParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useGestorAcademiaScope({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseGestorAcademiaScopeParams) {
  const {
    effectiveAcademiasId,
    currentAcademia,
    requiresLocalSelection,
    permissions,
    isLoading: isContextLoading,
  } = useUserContext();

  const selection = useAcademiaAdminSelection({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized,
  });

  const academiasId = selection.isAdministrador
    ? selection.selectedAcademiaId
    : effectiveAcademiasId;

  const selectedAcademia = useMemo((): Academia | null => {
    if (selection.isAdministrador) {
      return selection.availableAcademias.find((item) => item.id === academiasId) ?? null;
    }

    if (currentAcademia && currentAcademia.id === academiasId) {
      return currentAcademia as Academia;
    }

    return selection.availableAcademias.find((item) => item.id === academiasId) ?? null;
  }, [academiasId, currentAcademia, selection.availableAcademias, selection.isAdministrador]);

  const localNome = selectedAcademia?.nome ?? currentAcademia?.nome ?? null;
  const scopeRequiresLocalSelection = !selection.isAdministrador && requiresLocalSelection;
  const scopeIsLoading = isContextLoading || selection.isLoadingAcademias;

  return {
    ...selection,
    academiasId,
    selectedAcademia,
    localNome,
    scopeRequiresLocalSelection,
    scopeIsLoading,
    permissions,
    effectiveAcademiasId,
  };
}

export type GestorAcademiaScope = ReturnType<typeof useGestorAcademiaScope>;
