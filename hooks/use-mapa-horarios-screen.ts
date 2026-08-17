import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useClubAdminSelection } from '@/hooks/use-club-admin-selection';
import { useUserContext } from '@/contexts/user-context';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import {
  getAtividadesByAcademia,
  mapAtividadesToOptions,
} from '@/services/atividades-service';
import { getHorariosByAcademia } from '@/services/horarios-service';
import type { Atividade } from '@/types/atividade';
import type { Horario } from '@/types/horario';
import type { User } from '@/types/user';
import { buildMapaHorariosGrid } from '@/utils/mapa-horarios-grid';
import { sortHorarios } from '@/utils/horario-cadastro-form';

export const MAPA_HORARIOS_MESSAGES = {
  emptyList: 'Não há horários cadastrados para esta atividade.',
  noEffectiveLocal: 'Selecione um local prioritário para continuar.',
  selectLocal: 'Selecione um local para continuar.',
  loadError: 'Não foi possível carregar a grade de horários. Tente novamente.',
};

type UseMapaHorariosScreenParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useMapaHorariosScreen({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseMapaHorariosScreenParams) {
  const {
    effectiveAcademiasId,
    currentAcademia,
    isLoading: isContextLoading,
  } = useUserContext();
  const clubSelection = useClubAdminSelection({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized,
  });

  const isAdministrador = user?.administrador === true;
  const selectedClubId = isAdministrador ? clubSelection.selectedClubId : effectiveAcademiasId;
  const loadedClub = isAdministrador
    ? clubSelection.loadedClub
    : currentAcademia
      ? ({ id: currentAcademia.id, nome: currentAcademia.nome } as { id: number; nome: string })
      : null;
  const canViewSelectedClub = isAdministrador
    ? clubSelection.selectedClubId != null &&
      clubSelection.loadedClub != null &&
      !clubSelection.isLoadingClub &&
      !clubSelection.clubLoadError
    : effectiveAcademiasId != null;
  const showClubSelector = isAdministrador && clubSelection.showClubSelector;
  const isLoadingClubs = isAdministrador ? clubSelection.isLoadingClubs : isContextLoading;
  const isLoadingClub = isAdministrador ? clubSelection.isLoadingClub : false;
  const clubsLoadError = isAdministrador ? clubSelection.clubsLoadError : null;
  const clubLoadError = isAdministrador ? clubSelection.clubLoadError : null;

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [selectedAtividadeId, setSelectedAtividadeId] = useState<number | null>(null);
  const [isLoadingAtividades, setIsLoadingAtividades] = useState(false);
  const [atividadesLoadError, setAtividadesLoadError] = useState<string | null>(null);

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
  const [horariosLoadError, setHorariosLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const atividadesRequestIdRef = useRef(0);
  const horariosRequestIdRef = useRef(0);

  const gridData = useMemo(() => buildMapaHorariosGrid(horarios), [horarios]);

  const fetchAtividades = useCallback(async () => {
    if (!authToken || !selectedClubId || !canViewSelectedClub) {
      return;
    }

    const requestId = ++atividadesRequestIdRef.current;
    setIsLoadingAtividades(true);
    setAtividadesLoadError(null);
    setAtividades([]);
    setSelectedAtividadeId(null);

    try {
      const data = await getAtividadesByAcademia(selectedClubId, authToken);

      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      const options = mapAtividadesToOptions(data);
      setAtividades(data);

      if (options.length === 1) {
        setSelectedAtividadeId(options[0].id);
      }
    } catch (error) {
      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await onUnauthorized();
        return;
      }

      const message = getApiErrorMessage(error);
      setAtividadesLoadError(message.includes('conectar') ? message : MAPA_HORARIOS_MESSAGES.loadError);
    } finally {
      if (requestId === atividadesRequestIdRef.current) {
        setIsLoadingAtividades(false);
      }
    }
  }, [authToken, canViewSelectedClub, onUnauthorized, selectedClubId]);

  const fetchHorarios = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (!authToken || !selectedClubId || !canViewSelectedClub) {
        return;
      }

      if (!selectedAtividadeId) {
        setHorarios([]);
        setHorariosLoadError(null);
        return;
      }

      const requestId = ++horariosRequestIdRef.current;
      const refreshing = options?.refreshing === true;

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoadingHorarios(true);
      }

      setHorariosLoadError(null);
      setHorarios([]);

      try {
        const data = await getHorariosByAcademia(selectedClubId, authToken, selectedAtividadeId);

        if (requestId !== horariosRequestIdRef.current) {
          return;
        }

        setHorarios(sortHorarios(data));
      } catch (error) {
        if (requestId !== horariosRequestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return;
        }

        const message = getApiErrorMessage(error);
        setHorariosLoadError(message.includes('conectar') ? message : MAPA_HORARIOS_MESSAGES.loadError);
      } finally {
        if (requestId === horariosRequestIdRef.current) {
          setIsLoadingHorarios(false);
          setIsRefreshing(false);
        }
      }
    },
    [authToken, canViewSelectedClub, onUnauthorized, selectedAtividadeId, selectedClubId],
  );

  useEffect(() => {
    if (isAuthLoading || !user || !authToken || isContextLoading) {
      return;
    }

    if (isAdministrador && clubSelection.isLoadingClubs) {
      return;
    }

    if (!canViewSelectedClub) {
      setAtividades([]);
      setSelectedAtividadeId(null);
      setHorarios([]);
      setHorariosLoadError(null);
      return;
    }

    void fetchAtividades();
  }, [
    authToken,
    canViewSelectedClub,
    clubSelection.isLoadingClubs,
    fetchAtividades,
    isAdministrador,
    isAuthLoading,
    isContextLoading,
    user,
  ]);

  useEffect(() => {
    if (!canViewSelectedClub || !selectedAtividadeId) {
      setHorarios([]);
      setHorariosLoadError(null);
      return;
    }

    void fetchHorarios();
  }, [canViewSelectedClub, fetchHorarios, selectedAtividadeId]);

  return {
    availableClubs: isAdministrador ? clubSelection.availableClubs : [],
    selectedClubId,
    loadedClub,
    isLoadingClubs,
    clubsLoadError,
    isLoadingClub,
    clubLoadError,
    isAdministrador,
    canViewSelectedClub,
    showClubSelector,
    atividades: mapAtividadesToOptions(atividades),
    selectedAtividadeId,
    isLoadingAtividades,
    atividadesLoadError,
    horarios,
    gridData,
    isLoadingHorarios,
    horariosLoadError,
    isRefreshing,
    setSelectedClubId: clubSelection.setSelectedClubId,
    setSelectedAtividadeId,
    fetchAvailableClubs: clubSelection.fetchAvailableClubs,
    fetchClubDetails: clubSelection.fetchClubDetails,
    fetchAtividades,
    fetchHorarios,
  };
}
