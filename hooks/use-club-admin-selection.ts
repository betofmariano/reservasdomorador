import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useUserContext } from '@/contexts/user-context';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { getAcademiaById, getAcademias } from '@/services/clubes-service';
import { getUserLocalAssociations } from '@/services/user-local-service';
import type { Club } from '@/types/club';
import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';
import {
  canManageAcademia,
  CLUB_ADMIN_MESSAGES,
  filterAcademiasForConfiguration,
} from '@/utils/club-config';

const LOAD_CLUBS_ERROR = 'Não foi possível carregar os clubes.';

type UseClubAdminSelectionParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useClubAdminSelection({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseClubAdminSelectionParams) {
  const { effectiveAcademiasId, permissions, isLoading: isContextLoading } = useUserContext();
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);
  const [associations, setAssociations] = useState<UserLocalAssociation[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [loadedClub, setLoadedClub] = useState<Club | null>(null);

  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [clubsLoadError, setClubsLoadError] = useState<string | null>(null);

  const [isLoadingClub, setIsLoadingClub] = useState(false);
  const [clubLoadError, setClubLoadError] = useState<string | null>(null);

  const clubRequestIdRef = useRef(0);

  const isAdministrador = user?.administrador === true;

  const canManageSelectedClub = useMemo(() => {
    if (!user || !loadedClub) {
      return false;
    }

    if (permissions.administrador) {
      return true;
    }

    return (
      permissions.podeGerirLocal &&
      effectiveAcademiasId === loadedClub.id &&
      canManageAcademia(user, loadedClub.id, associations)
    );
  }, [associations, effectiveAcademiasId, loadedClub, permissions.administrador, permissions.podeGerirLocal, user]);

  const showClubSelector = isAdministrador && availableClubs.length > 0;

  const fetchAvailableClubs = useCallback(async () => {
    if (!user || !authToken || isContextLoading) {
      setIsLoadingClubs(isContextLoading);
      return;
    }

    setIsLoadingClubs(true);
    setClubsLoadError(null);

    try {
      const clubs = await getAcademias();

      if (isAdministrador) {
        const filtered = filterAcademiasForConfiguration(user, clubs, []);
        setAssociations([]);
        setAvailableClubs(filtered as unknown as Club[]);
        setSelectedClubId((current) => {
          if (current && filtered.some((club) => club.id === current)) {
            return current;
          }

          return null;
        });

        return;
      }

      if (!effectiveAcademiasId || !permissions.podeGerirLocal) {
        setAssociations([]);
        setAvailableClubs([]);
        setSelectedClubId(null);
        return;
      }

      const userAssociations = await getUserLocalAssociations(user.id);
      const filtered = filterAcademiasForConfiguration(user, clubs, userAssociations).filter(
        (club) => club.id === effectiveAcademiasId,
      );

      setAssociations(
        userAssociations.filter((association) => association.academias_id === effectiveAcademiasId),
      );
      setAvailableClubs(filtered as unknown as Club[]);
      setSelectedClubId(filtered[0]?.id ?? null);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await onUnauthorized();
        return;
      }

      const message = getApiErrorMessage(error);
      setClubsLoadError(message.includes('conectar') ? message : LOAD_CLUBS_ERROR);
      setAvailableClubs([]);
    } finally {
      setIsLoadingClubs(false);
    }
  }, [
    authToken,
    effectiveAcademiasId,
    isAdministrador,
    isContextLoading,
    onUnauthorized,
    permissions.podeGerirLocal,
    user,
  ]);

  const fetchClubDetails = useCallback(
    async (clubId: number) => {
      if (!user || !authToken) {
        return;
      }

      const requestId = ++clubRequestIdRef.current;

      setIsLoadingClub(true);
      setClubLoadError(null);
      setLoadedClub(null);

      try {
        const club = await getAcademiaById(clubId, authToken);

        if (requestId !== clubRequestIdRef.current) {
          return;
        }

        if (!canManageAcademia(user, club.id, associations) && !permissions.administrador) {
          setClubLoadError(CLUB_ADMIN_MESSAGES.permission);
          return;
        }

        setLoadedClub(club as unknown as Club);
      } catch (error) {
        if (requestId !== clubRequestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return;
        }

        const message = getApiErrorMessage(error);
        setClubLoadError(message.includes('conectar') ? message : CLUB_ADMIN_MESSAGES.loadError);
      } finally {
        if (requestId === clubRequestIdRef.current) {
          setIsLoadingClub(false);
        }
      }
    },
    [associations, authToken, onUnauthorized, permissions.administrador, user],
  );

  useEffect(() => {
    if (isAuthLoading || !user || !authToken) {
      return;
    }

    void fetchAvailableClubs();
  }, [authToken, fetchAvailableClubs, isAuthLoading, user]);

  useEffect(() => {
    if (!selectedClubId || isLoadingClubs) {
      return;
    }

    void fetchClubDetails(selectedClubId);
  }, [fetchClubDetails, isLoadingClubs, selectedClubId]);

  function handleClubChange(clubId: number) {
    setSelectedClubId(clubId);
  }

  function resetClubData() {
    setLoadedClub(null);
    setClubLoadError(null);
  }

  return {
    availableClubs,
    selectedClubId,
    loadedClub,
    isLoadingClubs: isContextLoading || isLoadingClubs,
    clubsLoadError,
    isLoadingClub,
    clubLoadError,
    isAdministrador,
    canManageSelectedClub,
    showClubSelector,
    setSelectedClubId: handleClubChange,
    fetchAvailableClubs,
    fetchClubDetails,
    resetClubData,
  };
}
