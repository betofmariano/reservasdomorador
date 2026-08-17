import { useCallback, useEffect, useMemo, useState } from 'react';

import { useUserContext } from '@/contexts/user-context';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { getAcademias, getAcademiasForConfiguration } from '@/services/academias-service';
import { getUserLocalAssociations } from '@/services/user-local-service';
import type { Academia } from '@/types/academia';
import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';
import {
  canManageAcademia,
  CLUB_ADMIN_MESSAGES,
  filterAcademiasForConfiguration,
  isUserAdministrador,
} from '@/utils/club-config';
import { filterActiveAcademias } from '@/utils/normalize-academia';

const LOAD_ACADEMIAS_ERROR = 'Não foi possível carregar os locais.';

async function loadManagedAcademias(authToken: string | null): Promise<Academia[]> {
  if (authToken) {
    return filterActiveAcademias(await getAcademiasForConfiguration(authToken));
  }

  return getAcademias();
}

type UseAcademiaAdminSelectionParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useAcademiaAdminSelection({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseAcademiaAdminSelectionParams) {
  const { effectiveAcademiasId, permissions, isLoading: isContextLoading } = useUserContext();
  const [availableAcademias, setAvailableAcademias] = useState<Academia[]>([]);
  const [associations, setAssociations] = useState<UserLocalAssociation[]>([]);
  const [selectedAcademiaId, setSelectedAcademiaId] = useState<number | null>(null);

  const [isLoadingAcademias, setIsLoadingAcademias] = useState(true);
  const [academiasLoadError, setAcademiasLoadError] = useState<string | null>(null);

  const isAdministrador = user?.administrador === true;

  const canManageSelectedAcademia = useMemo(() => {
    if (!user || !selectedAcademiaId) {
      return false;
    }

    if (permissions.administrador) {
      return true;
    }

    return (
      permissions.podeGerirLocal &&
      effectiveAcademiasId === selectedAcademiaId &&
      canManageAcademia(user, selectedAcademiaId, associations)
    );
  }, [associations, effectiveAcademiasId, permissions.administrador, permissions.podeGerirLocal, selectedAcademiaId, user]);

  // Admin escolhe o local sob demanda; com 1+ locais mostra o seletor (sem pré-seleção).
  const showAcademiaSelector = isAdministrador && availableAcademias.length > 0;

  const fetchAvailableAcademias = useCallback(async () => {
    if (!user || !authToken || isContextLoading) {
      setIsLoadingAcademias(isContextLoading);
      return;
    }

    setIsLoadingAcademias(true);
    setAcademiasLoadError(null);

    try {
      const academias = await loadManagedAcademias(authToken);

      if (isUserAdministrador(user)) {
        const filtered = filterAcademiasForConfiguration(user, academias, []);
        setAssociations([]);
        setAvailableAcademias(filtered);
        setSelectedAcademiaId((current) => {
          if (current && filtered.some((academia) => academia.id === current)) {
            return current;
          }

          return null;
        });
        return;
      }

      if (!effectiveAcademiasId || !permissions.podeGerirLocal) {
        setAssociations([]);
        setAvailableAcademias([]);
        setSelectedAcademiaId(null);
        return;
      }

      const userAssociations = await getUserLocalAssociations(user.id);
      const filtered = filterAcademiasForConfiguration(user, academias, userAssociations).filter(
        (academia) => academia.id === effectiveAcademiasId,
      );

      setAssociations(
        userAssociations.filter((association) => association.academias_id === effectiveAcademiasId),
      );
      setAvailableAcademias(filtered);
      setSelectedAcademiaId(filtered[0]?.id ?? null);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await onUnauthorized();
        return;
      }

      const message = getApiErrorMessage(error);
      setAcademiasLoadError(message.includes('conectar') ? message : LOAD_ACADEMIAS_ERROR);
      setAvailableAcademias([]);
      setSelectedAcademiaId(null);
    } finally {
      setIsLoadingAcademias(false);
    }
  }, [
    authToken,
    effectiveAcademiasId,
    isContextLoading,
    onUnauthorized,
    permissions.podeGerirLocal,
    user,
  ]);

  useEffect(() => {
    if (isAuthLoading || !user || !authToken) {
      return;
    }

    void fetchAvailableAcademias();
  }, [authToken, fetchAvailableAcademias, isAuthLoading, user]);

  function handleAcademiaChange(academiaId: number) {
    setSelectedAcademiaId(academiaId);
  }

  const academiaLoadError =
    selectedAcademiaId && !canManageSelectedAcademia && !isLoadingAcademias && !isContextLoading
      ? CLUB_ADMIN_MESSAGES.permission
      : null;

  return {
    availableAcademias,
    selectedAcademiaId,
    isLoadingAcademias: isContextLoading || isLoadingAcademias,
    academiasLoadError,
    academiaLoadError,
    isAdministrador,
    canManageSelectedAcademia,
    showAcademiaSelector,
    setSelectedAcademiaId: handleAcademiaChange,
    fetchAvailableAcademias,
  };
}
