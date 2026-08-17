import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useUserContext } from '@/contexts/user-context';
import { useGestorAcademiaScope } from '@/hooks/use-gestor-academia-scope';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { getAcademias } from '@/services/academias-service';
import {
  cancelarReservaPresenca,
  getAtividadesPresenca,
  getHorariosPresenca,
  getReservasAtividadeHora,
  togglePresencaReserva,
} from '@/services/presenca-service';
import type { Academia } from '@/types/academia';
import type { AtividadeOption } from '@/types/atividade';
import type {
  HorarioPresencaOption,
  ListaPresencaSortMode,
  ReservaPresenca,
} from '@/types/presenca';
import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';
import { canAccessAcademiaListaPresenca, canCancelReservaListaPresenca } from '@/utils/lista-presenca-permissao';
import { isModuloAtivoNaAcademia } from '@/utils/academia-permissoes-gestor';
import { sortReservasPresenca } from '@/utils/lista-presenca-sort';
import {
  mergeReservaPresencaFromToggleResponse,
  resolveTogglePresencaValue,
} from '@/utils/normalize-presenca';
import { filterActiveAcademias } from '@/utils/normalize-academia';

export const LISTA_PRESENCA_MESSAGES = {
  loadAtividades: 'Carregando atividades...',
  loadHorarios: 'Carregando horários...',
  loadReservas: 'Carregando lista de presença...',
  semHorarios:
    'Não existem aulas desta atividade entre as 24 horas anteriores e as 24 horas posteriores.',
  semReservas: 'Nenhuma reserva encontrada para esta aula.',
  loadError: 'Não foi possível carregar a lista de presença. Tente novamente.',
  clubsError: 'Não foi possível carregar o local.',
  atividadesError: 'Não foi possível carregar as atividades deste local.',
  horariosError: 'Não foi possível carregar os horários desta atividade.',
  presencaError: (nome: string) => `Não foi possível registrar a presença de ${nome}.`,
  cancelError: 'Não foi possível cancelar esta reserva. Tente novamente.',
  noAccess: 'Você não possui permissão para a lista de presença deste local.',
  listaPresencaDisabled: 'Lista de presença não está disponível neste local.',
  noClubs: 'Nenhum local disponível para lista de presença.',
  noEffectiveLocal: 'Selecione um local prioritário para continuar.',
} as const;

type UseListaPresencaScreenParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useListaPresencaScreen({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseListaPresencaScreenParams) {
  const scope = useGestorAcademiaScope({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized,
  });

  const {
    academiasId,
    localNome: scopeLocalNome,
    scopeRequiresLocalSelection,
    scopeIsLoading,
    permissions,
    isAdministrador,
    selectedAcademia: scopeSelectedAcademia,
    showAcademiaSelector,
    availableAcademias,
    selectedAcademiaId,
    setSelectedAcademiaId,
    isLoadingAcademias,
    academiasLoadError,
    fetchAvailableAcademias,
  } = scope;

  const { currentAcademia, currentUserLocal } = useUserContext();

  const [selectedAcademia, setSelectedAcademia] = useState<Academia | null>(null);
  const [associations, setAssociations] = useState<UserLocalAssociation[]>([]);
  const [selectedAtividadesId, setSelectedAtividadesId] = useState<number | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<HorarioPresencaOption | null>(null);
  const [atividades, setAtividades] = useState<AtividadeOption[]>([]);
  const [horarios, setHorarios] = useState<HorarioPresencaOption[]>([]);
  const [reservas, setReservas] = useState<ReservaPresenca[]>([]);
  const [sortMode, setSortMode] = useState<ListaPresencaSortMode>('nome');
  const [presencaError, setPresencaError] = useState<string | null>(null);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isLoadingAtividades, setIsLoadingAtividades] = useState(false);
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
  const [isLoadingReservas, setIsLoadingReservas] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clubsError, setClubsError] = useState<string | null>(null);
  const [atividadesError, setAtividadesError] = useState<string | null>(null);
  const [horariosError, setHorariosError] = useState<string | null>(null);
  const [reservasError, setReservasError] = useState<string | null>(null);
  const [updatingReservaIds, setUpdatingReservaIds] = useState<Set<number>>(new Set());

  const atividadesRequestIdRef = useRef(0);
  const horariosRequestIdRef = useRef(0);
  const reservasRequestIdRef = useRef(0);
  const updatingReservaIdsRef = useRef<Set<number>>(new Set());

  const selectedAcademiasId = academiasId;
  const canAccessSelectedAcademia = isAdministrador
    ? scopeSelectedAcademia != null &&
      canAccessAcademiaListaPresenca(scopeSelectedAcademia, [], user)
    : permissions.podeAcessarListaPresenca && selectedAcademiasId != null;
  const showClubSelector = showAcademiaSelector;
  const localNome = scopeLocalNome ?? selectedAcademia?.nome ?? null;
  const selectorAcademias = showClubSelector ? availableAcademias : selectedAcademia ? [selectedAcademia] : [];
  const showAtividadeSelector = canAccessSelectedAcademia && atividades.length > 1;
  const showHorarioSelector = canAccessSelectedAcademia && !!selectedAtividadesId;
  const canCancelReservas = canCancelReservaListaPresenca(
    user,
    selectedAcademiasId ?? 0,
    associations,
  );

  const reservasOrdenadas = useMemo(
    () => sortReservasPresenca(reservas, sortMode),
    [reservas, sortMode],
  );

  const resumo = useMemo(() => {
    const total = reservas.length;
    const presentes = reservas.filter((item) => item.presente === true).length;

    return {
      total,
      presentes,
      ausentes: total - presentes,
    };
  }, [reservas]);

  const handleApiError = useCallback(
    async (error: unknown, fallbackMessage: string) => {
      if (error instanceof ApiError && error.status === 401) {
        await onUnauthorized();
        return fallbackMessage;
      }

      return getApiErrorMessage(error) || fallbackMessage;
    },
    [onUnauthorized],
  );

  const loadLocalContext = useCallback(async () => {
    if (scopeIsLoading || scopeRequiresLocalSelection) {
      return;
    }

    if (isAdministrador) {
      if (!authToken || !selectedAcademiasId) {
        setSelectedAcademia(null);
        setAssociations([]);
        setIsLoadingClubs(false);
        return;
      }

      setIsLoadingClubs(true);
      setClubsError(null);

      const academia = scopeSelectedAcademia;

      if (!academia) {
        setSelectedAcademia(null);
        setAssociations([]);
        setClubsError(LISTA_PRESENCA_MESSAGES.noAccess);
        setIsLoadingClubs(false);
        return;
      }

      if (!canAccessAcademiaListaPresenca(academia, [], user)) {
        setSelectedAcademia(null);
        setAssociations([]);
        setClubsError(
          !isModuloAtivoNaAcademia(academia, 'listaPresenca')
            ? LISTA_PRESENCA_MESSAGES.listaPresencaDisabled
            : LISTA_PRESENCA_MESSAGES.noAccess,
        );
        setIsLoadingClubs(false);
        return;
      }

      setSelectedAcademia(academia);
      setAssociations([]);
      setIsLoadingClubs(false);
      return;
    }

    if (!authToken || !selectedAcademiasId || !permissions.podeAcessarListaPresenca) {
      setSelectedAcademia(null);
      setAssociations([]);
      setIsLoadingClubs(false);
      return;
    }

    setIsLoadingClubs(true);
    setClubsError(null);

    try {
      const clubs = filterActiveAcademias(await getAcademias());
      const academia =
        clubs.find((club) => club.id === selectedAcademiasId) ??
        (currentAcademia
          ? ({
              id: currentAcademia.id,
              nome: currentAcademia.nome,
              permissoesGestor: currentAcademia.permissoesGestor,
              permissoesProfessor: currentAcademia.permissoesProfessor,
            } as Academia)
          : null);

      if (!academia) {
        setSelectedAcademia(null);
        setAssociations([]);
        setClubsError(LISTA_PRESENCA_MESSAGES.noAccess);
        return;
      }

      const associationList = currentUserLocal ? [currentUserLocal] : [];

      if (!canAccessAcademiaListaPresenca(academia, associationList, user)) {
        setSelectedAcademia(null);
        setAssociations([]);
        setClubsError(
          !isModuloAtivoNaAcademia(academia, 'listaPresenca')
            ? LISTA_PRESENCA_MESSAGES.listaPresencaDisabled
            : LISTA_PRESENCA_MESSAGES.noAccess,
        );
        return;
      }

      setSelectedAcademia(academia);
      setAssociations(associationList);
    } catch (error) {
      setClubsError(await handleApiError(error, LISTA_PRESENCA_MESSAGES.clubsError));
      setSelectedAcademia(null);
      setAssociations([]);
    } finally {
      setIsLoadingClubs(false);
    }
  }, [
    authToken,
    currentAcademia,
    currentUserLocal,
    handleApiError,
    isAdministrador,
    permissions.podeAcessarListaPresenca,
    scopeIsLoading,
    scopeRequiresLocalSelection,
    scopeSelectedAcademia,
    selectedAcademiasId,
    user,
  ]);

  const loadAtividades = useCallback(async () => {
    if (!authToken || !selectedAcademiasId || !canAccessSelectedAcademia) {
      setAtividades([]);
      setSelectedAtividadesId(null);
      return;
    }

    const requestId = ++atividadesRequestIdRef.current;
    setIsLoadingAtividades(true);
    setAtividadesError(null);

    try {
      const items = await getAtividadesPresenca(selectedAcademiasId, authToken);

      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      setAtividades(items);
      setSelectedAtividadesId((current) => {
        if (current && items.some((item) => item.id === current)) {
          return current;
        }

        return items.length === 1 ? items[0].id : null;
      });
    } catch (error) {
      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      setAtividades([]);
      setSelectedAtividadesId(null);
      setAtividadesError(await handleApiError(error, LISTA_PRESENCA_MESSAGES.atividadesError));
    } finally {
      if (requestId === atividadesRequestIdRef.current) {
        setIsLoadingAtividades(false);
      }
    }
  }, [authToken, canAccessSelectedAcademia, handleApiError, selectedAcademiasId]);

  const loadHorarios = useCallback(async () => {
    if (!authToken || !selectedAcademiasId || !selectedAtividadesId || !canAccessSelectedAcademia) {
      setHorarios([]);
      setSelectedHorario(null);
      return;
    }

    const requestId = ++horariosRequestIdRef.current;
    setIsLoadingHorarios(true);
    setHorariosError(null);
    setSelectedHorario(null);
    setReservas([]);

    try {
      const items = await getHorariosPresenca(
        selectedAcademiasId,
        selectedAtividadesId,
        authToken,
      );

      if (requestId !== horariosRequestIdRef.current) {
        return;
      }

      setHorarios(items);
    } catch (error) {
      if (requestId !== horariosRequestIdRef.current) {
        return;
      }

      setHorarios([]);
      setHorariosError(await handleApiError(error, LISTA_PRESENCA_MESSAGES.horariosError));
    } finally {
      if (requestId === horariosRequestIdRef.current) {
        setIsLoadingHorarios(false);
      }
    }
  }, [
    authToken,
    canAccessSelectedAcademia,
    handleApiError,
    selectedAcademiasId,
    selectedAtividadesId,
  ]);

  const loadReservas = useCallback(async (options?: { silent?: boolean }) => {
    if (!authToken || !selectedHorario || !selectedAcademiasId || !selectedAtividadesId) {
      setReservas([]);
      return;
    }

    const requestId = ++reservasRequestIdRef.current;

    if (!options?.silent) {
      setIsLoadingReservas(true);
    }

    setReservasError(null);

    try {
      const response = await getReservasAtividadeHora(
        {
          academiasId: selectedAcademiasId,
          atividadesId: selectedAtividadesId,
          dataAtividade: selectedHorario.dataAtividade,
          mapadiarioId: selectedHorario.mapaDiarioId,
        },
        authToken,
      );

      if (requestId !== reservasRequestIdRef.current) {
        return;
      }

      setReservas(response.reservas);
    } catch (error) {
      if (requestId !== reservasRequestIdRef.current) {
        return;
      }

      if (!options?.silent) {
        setReservas([]);
      }

      setReservasError(await handleApiError(error, LISTA_PRESENCA_MESSAGES.loadError));
    } finally {
      if (requestId === reservasRequestIdRef.current && !options?.silent) {
        setIsLoadingReservas(false);
      }
    }
  }, [authToken, handleApiError, selectedAcademiasId, selectedAtividadesId, selectedHorario]);

  const handleSelectAtividade = useCallback((atividadesId: number) => {
    setSelectedAtividadesId(atividadesId);
    setSelectedHorario(null);
    setHorarios([]);
    setReservas([]);
    setPresencaError(null);
  }, []);

  const handleSelectHorario = useCallback((horario: HorarioPresencaOption) => {
    setSelectedHorario(horario);
    setReservas([]);
    setPresencaError(null);
  }, []);

  const handleTogglePresenca = useCallback(
    async (reserva: ReservaPresenca) => {
      const reservaId = reserva.reservaId;

      if (!authToken || updatingReservaIdsRef.current.has(reservaId)) {
        return;
      }

      updatingReservaIdsRef.current.add(reservaId);
      setUpdatingReservaIds(new Set(updatingReservaIdsRef.current));

      const currentPresente = reserva.presente === true;
      const nextPresente = resolveTogglePresencaValue(currentPresente);
      let previousReservas: ReservaPresenca[] = [];

      setReservas((current) => {
        previousReservas = current;

        return current.map((item) =>
          item.reservaId === reservaId
            ? mergeReservaPresencaFromToggleResponse(
                item,
                { presente: nextPresente },
                nextPresente,
              )
            : item,
        );
      });

      setPresencaError(null);

      try {
        const response = await togglePresencaReserva(
          {
            reservaId,
            presente: nextPresente,
          },
          authToken,
        );

        setReservas((current) =>
          current.map((item) =>
            item.reservaId === reservaId
              ? mergeReservaPresencaFromToggleResponse(item, response, nextPresente)
              : item,
          ),
        );

        await loadReservas({ silent: true });
      } catch (error) {
        setReservas(previousReservas);
        setPresencaError(
          error instanceof ApiError && error.message
            ? error.message
            : LISTA_PRESENCA_MESSAGES.presencaError(reserva.nomeUsuario),
        );
      } finally {
        updatingReservaIdsRef.current.delete(reservaId);
        setUpdatingReservaIds(new Set(updatingReservaIdsRef.current));
      }
    },
    [authToken, loadReservas],
  );

  const handleCancelReserva = useCallback(
    async (reserva: ReservaPresenca) => {
      if (!authToken || !user?.id) {
        return;
      }

      const selectedAtividade =
        atividades.find((atividade) => atividade.id === selectedAtividadesId) ?? null;

      const slot =
        selectedAcademiasId && selectedAtividadesId && selectedHorario
          ? {
              academias_id: selectedAcademiasId,
              atividades_id: selectedAtividadesId,
              dataAtividade: selectedHorario.dataAtividade,
              mapadiario_id: selectedHorario.mapaDiarioId,
              atividade: selectedAtividade?.nome ?? reserva.atividadeNome,
            }
          : undefined;

      await cancelarReservaPresenca(
        reserva.reservaId,
        reserva.usuarioId,
        user.id,
        user.nome,
        authToken,
        slot,
      );

      setReservas((current) => current.filter((item) => item.reservaId !== reserva.reservaId));
      await loadReservas({ silent: true });
    },
    [
      atividades,
      authToken,
      loadReservas,
      selectedAcademiasId,
      selectedAtividadesId,
      selectedHorario,
      user?.id,
      user?.nome,
    ],
  );

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await loadLocalContext();

      if (selectedAcademiasId) {
        await loadAtividades();
      }

      if (selectedAtividadesId) {
        await loadHorarios();
      }

      if (selectedHorario) {
        await loadReservas();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [
    loadAtividades,
    loadHorarios,
    loadLocalContext,
    loadReservas,
    selectedAcademiasId,
    selectedAtividadesId,
    selectedHorario,
  ]);

  useEffect(() => {
    void loadLocalContext();
  }, [loadLocalContext]);

  useEffect(() => {
    void loadAtividades();
  }, [loadAtividades]);

  useEffect(() => {
    void loadHorarios();
  }, [loadHorarios]);

  useEffect(() => {
    void loadReservas();
  }, [loadReservas]);

  return {
    academias: selectorAcademias,
    selectedAcademiasId,
    selectedAcademia,
    selectedAtividadesId,
    selectedAtividade: atividades.find((atividade) => atividade.id === selectedAtividadesId) ?? null,
    selectedHorario,
    atividades,
    horarios,
    reservas: reservasOrdenadas,
    resumo,
    sortMode,
    presencaError,
    isLoadingClubs: scopeIsLoading || isLoadingClubs,
    isLoadingAtividades,
    isLoadingHorarios,
    isLoadingReservas,
    isRefreshing,
    clubsError,
    atividadesError,
    horariosError,
    reservasError,
    showClubSelector,
    showAcademiaSelector,
    availableAcademias,
    selectedAcademiaId,
    setSelectedAcademiaId,
    isLoadingAcademias,
    academiasLoadError,
    fetchAvailableAcademias,
    requiresLocalSelection: scopeRequiresLocalSelection,
    localNome,
    showAtividadeSelector,
    showHorarioSelector,
    canAccessSelectedAcademia,
    canCancelReservas,
    updatingReservaIds,
    setSelectedAtividadesId: handleSelectAtividade,
    setSelectedHorario: handleSelectHorario,
    setSortMode,
    handleTogglePresenca,
    handleCancelReserva,
    loadClubs: loadLocalContext,
    loadAtividades,
    loadHorarios,
    loadReservas,
    refreshAll,
  };
}
