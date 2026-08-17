import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useUserContext } from '@/contexts/user-context';
import { useGestorAcademiaScope } from '@/hooks/use-gestor-academia-scope';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { getAcademias } from '@/services/academias-service';
import { getAtividadesByAcademia, mapAtividadesToOptions } from '@/services/atividades-service';
import { getListaReservasAcademia } from '@/services/lista-reservas-service';
import { getReservasMensalPorSemanaLimiteSemanalUsuario } from '@/services/reservas-mensal-por-semana-service';
import type { Academia } from '@/types/academia';
import type { AtividadeOption } from '@/types/atividade';
import type { ListaReservaItem } from '@/types/lista-reserva';
import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';
import {
  filterListaReservasByAtividade,
  filterListaReservasByPeriod,
  resolveListaReservasAtividadeInicial,
  sortListaReservasAtividadeOptions,
} from '@/utils/lista-reservas';
import {
  canAccessAcademiaListaReservas,
  canExcluirReservaLista,
} from '@/utils/lista-reservas-permissao';
import {
  academiaOfereceMensalPorSemana,
  atividadeUsaMensalPorSemana,
} from '@/utils/atividade-programacao';
import { isModuloAtivoNaAcademia } from '@/utils/academia-permissoes-gestor';
import { getTodayDate, normalizeCalendarDate } from '@/utils/jogos-time';
import { filterActiveAcademias } from '@/utils/normalize-academia';
import { matchesSearchText } from '@/utils/search-text';

const LOAD_ERROR = 'Não foi possível carregar as reservas deste local.';
const CLUBS_ERROR = 'Não foi possível carregar o local.';
const ATIVIDADES_ERROR = 'Não foi possível carregar as atividades deste local.';
const NO_ACCESS_MESSAGE = 'Você não possui permissão para consultar reservas deste local.';
const NO_EFFECTIVE_LOCAL_MESSAGE = 'Selecione um local prioritário para continuar.';

const LISTA_RESERVAS_DEFAULT_PERIOD_DAYS = 7;

/** Limite inferior para admin/gestor consultar histórico na Lista de Reservas. */
export function getListaReservasHistoricoMinStartDate(): Date {
  return normalizeCalendarDate(new Date(2000, 0, 1));
}

function buildDefaultEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + LISTA_RESERVAS_DEFAULT_PERIOD_DAYS);

  return normalizeCalendarDate(endDate);
}

type UseListaReservasScreenParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export const LISTA_RESERVAS_MESSAGES = {
  loadError: LOAD_ERROR,
  clubsError: CLUBS_ERROR,
  atividadesError: ATIVIDADES_ERROR,
  noAccess: NO_ACCESS_MESSAGE,
  noEffectiveLocal: NO_EFFECTIVE_LOCAL_MESSAGE,
  noClubs: 'Nenhum local disponível para consultar reservas.',
  noAtividades: 'Nenhuma atividade cadastrada neste local.',
  empty: 'Nenhuma reserva encontrada para o período selecionado.',
} as const;

export function useListaReservasScreen({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseListaReservasScreenParams) {
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
  const [atividades, setAtividades] = useState<AtividadeOption[]>([]);
  const [reservas, setReservas] = useState<ListaReservaItem[]>([]);
  const [startDate, setStartDate] = useState(() => getTodayDate());
  const [endDate, setEndDate] = useState(() => buildDefaultEndDate(getTodayDate()));
  const [nomeFiltro, setNomeFiltro] = useState('');
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isLoadingAtividades, setIsLoadingAtividades] = useState(false);
  const [isLoadingReservas, setIsLoadingReservas] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clubsError, setClubsError] = useState<string | null>(null);
  const [atividadesError, setAtividadesError] = useState<string | null>(null);
  const [reservasError, setReservasError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const atividadesRequestIdRef = useRef(0);
  const hasUserPickedAtividadeRef = useRef(false);
  const lastAtividadeAcademiaIdRef = useRef<number | null>(null);

  const selectedAcademiasId = academiasId;
  const usaMensalPorSemana = academiaOfereceMensalPorSemana({ atividades });
  const canAccessSelectedAcademia = isAdministrador
    ? scopeSelectedAcademia != null &&
      canAccessAcademiaListaReservas(scopeSelectedAcademia, [], user)
    : permissions.podeAcessarListaReservas && selectedAcademiasId != null;
  const showClubSelector = showAcademiaSelector;
  const localNome = scopeLocalNome ?? selectedAcademia?.nome ?? null;
  const selectorAcademias = showClubSelector ? availableAcademias : selectedAcademia ? [selectedAcademia] : [];
  const selectedAtividade = useMemo(
    () => atividades.find((atividade) => atividade.id === selectedAtividadesId) ?? null,
    [atividades, selectedAtividadesId],
  );
  const showAtividadeSelector =
    usaMensalPorSemana && canAccessSelectedAcademia && atividades.length > 1;
  const canDeleteReservas = canExcluirReservaLista(
    user,
    selectedAcademiasId ?? 0,
    associations,
  );
  const showResponsavelColumn = isModuloAtivoNaAcademia(
    { permissoesGestor: selectedAcademia?.permissoesGestor ?? {} },
    'reservarParaTerceiro',
  );

  const reservasFiltradas = useMemo(() => {
    let items = filterListaReservasByPeriod(reservas, startDate, endDate);

    if (usaMensalPorSemana && selectedAtividadesId) {
      items = filterListaReservasByAtividade(items, selectedAtividadesId);
    }

    if (nomeFiltro.trim()) {
      items = items.filter((item) => matchesSearchText(item.usuarioNome, nomeFiltro));
    }

    return items;
  }, [endDate, nomeFiltro, reservas, selectedAtividadesId, startDate, usaMensalPorSemana]);

  const showUnidadeColumn = useMemo(() => {
    if (!usaMensalPorSemana) {
      return false;
    }

    if (selectedAtividade) {
      return selectedAtividade.temUnidades === true;
    }

    // Fallback enquanto a atividade não carrega / só uma atividade.
    return reservasFiltradas.some(
      (item) => item.atividadeunidade_id != null && item.atividadeunidade_id > 0,
    );
  }, [reservasFiltradas, selectedAtividade, usaMensalPorSemana]);

  const handleStartDateChange = useCallback((date: Date) => {
    const normalized = normalizeCalendarDate(date);

    setStartDate(normalized);
    setEndDate((current) =>
      current.getTime() < normalized.getTime() ? buildDefaultEndDate(normalized) : current,
    );
  }, []);

  const handleEndDateChange = useCallback((date: Date) => {
    setEndDate(normalizeCalendarDate(date));
  }, []);

  const handleAtividadeChange = useCallback((atividadeId: number | null) => {
    hasUserPickedAtividadeRef.current = true;
    setSelectedAtividadesId(atividadeId);
    setNomeFiltro('');
  }, []);

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
        setClubsError(LISTA_RESERVAS_MESSAGES.noAccess);
        setIsLoadingClubs(false);
        return;
      }

      const hasAccess = canAccessAcademiaListaReservas(academia, [], user);

      setSelectedAcademia(academia);
      setAssociations([]);

      if (!hasAccess) {
        setClubsError(LISTA_RESERVAS_MESSAGES.noAccess);
      }

      setIsLoadingClubs(false);
      return;
    }

    if (!authToken || !selectedAcademiasId || !permissions.podeAcessarListaReservas) {
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
              mensalSemana: currentAcademia.mensalSemana,
              permissoesGestor: currentAcademia.permissoesGestor,
              permissoesProfessor: currentAcademia.permissoesProfessor,
              permissoesUsuario: currentAcademia.permissoesUsuario,
            } as Academia)
          : null);

      if (!academia) {
        setSelectedAcademia(null);
        setAssociations([]);
        setClubsError(LISTA_RESERVAS_MESSAGES.noAccess);
        return;
      }

      const associationList = currentUserLocal ? [currentUserLocal] : [];
      const hasAccess = canAccessAcademiaListaReservas(academia, associationList, user);

      setSelectedAcademia(academia);
      setAssociations(associationList);

      if (!hasAccess) {
        setClubsError(LISTA_RESERVAS_MESSAGES.noAccess);
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await onUnauthorized();
        return;
      }

      setClubsError(CLUBS_ERROR);
      setSelectedAcademia(null);
      setAssociations([]);
    } finally {
      setIsLoadingClubs(false);
    }
  }, [
    authToken,
    currentAcademia,
    currentUserLocal,
    isAdministrador,
    onUnauthorized,
    permissions.podeAcessarListaReservas,
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
      setIsLoadingAtividades(false);
      setAtividadesError(null);
      return;
    }

    if (lastAtividadeAcademiaIdRef.current !== selectedAcademiasId) {
      lastAtividadeAcademiaIdRef.current = selectedAcademiasId;
      hasUserPickedAtividadeRef.current = false;
    }

    const requestId = ++atividadesRequestIdRef.current;

    setIsLoadingAtividades(true);
    setAtividadesError(null);

    try {
      const data = await getAtividadesByAcademia(selectedAcademiasId, authToken);
      // Lista só carrega MensalPorSemana; opções Diária no seletor escondiam reservas.
      const options = sortListaReservasAtividadeOptions(
        mapAtividadesToOptions(data).filter((item) => atividadeUsaMensalPorSemana(item)),
      );

      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      setAtividades(options);

      let habitoReservas: Array<{ atividades_id: number; cancelado?: boolean }> = [];

      if (user?.id) {
        try {
          habitoReservas = await getReservasMensalPorSemanaLimiteSemanalUsuario(
            user.id,
            selectedAcademiasId,
            authToken,
          );
        } catch {
          habitoReservas = [];
        }
      }

      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      const atividadeInicial = resolveListaReservasAtividadeInicial(options, habitoReservas);

      setSelectedAtividadesId((current) => {
        if (
          hasUserPickedAtividadeRef.current &&
          current != null &&
          options.some((item) => item.id === current)
        ) {
          return current;
        }

        if (
          hasUserPickedAtividadeRef.current &&
          current == null &&
          options.length > 0
        ) {
          // Usuário escolheu "Todas as atividades".
          return null;
        }

        return atividadeInicial;
      });
    } catch (error) {
      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await onUnauthorized();
        return;
      }

      setAtividadesError(ATIVIDADES_ERROR);
      setAtividades([]);
      setSelectedAtividadesId(null);
    } finally {
      if (requestId === atividadesRequestIdRef.current) {
        setIsLoadingAtividades(false);
      }
    }
  }, [
    authToken,
    canAccessSelectedAcademia,
    onUnauthorized,
    selectedAcademiasId,
    user?.id,
  ]);

  const fetchReservas = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (
        !authToken ||
        !selectedAcademiasId ||
        scopeIsLoading ||
        scopeRequiresLocalSelection ||
        isLoadingClubs ||
        !canAccessSelectedAcademia
      ) {
        setIsLoadingReservas(false);
        setIsRefreshing(false);

        if (!canAccessSelectedAcademia) {
          setReservas([]);
        }

        return;
      }

      const requestId = ++requestIdRef.current;
      const refreshing = options?.refreshing === true;

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoadingReservas(true);
      }

      setReservasError(null);

      try {
        const data = await getListaReservasAcademia(selectedAcademiasId, authToken, {
          localNome,
          startDate,
          endDate,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setReservas(data);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return;
        }

        const message = getApiErrorMessage(error);
        setReservasError(message.includes('conectar') ? message : LOAD_ERROR);
        setReservas([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoadingReservas(false);
          setIsRefreshing(false);
        }
      }
    },
    [
      authToken,
      canAccessSelectedAcademia,
      endDate,
      isLoadingClubs,
      localNome,
      onUnauthorized,
      scopeIsLoading,
      scopeRequiresLocalSelection,
      selectedAcademiasId,
      startDate,
    ],
  );

  useEffect(() => {
    void loadLocalContext();
  }, [loadLocalContext]);

  useEffect(() => {
    void loadAtividades();
  }, [loadAtividades]);

  useEffect(() => {
    void fetchReservas();
  }, [fetchReservas]);

  const canSelectPastDates = isAdministrador || permissions.gestor === true;
  const minimumStartDate = canSelectPastDates
    ? getListaReservasHistoricoMinStartDate()
    : getTodayDate();

  return {
    academias: selectorAcademias,
    selectedAcademiasId,
    selectedAcademia,
    selectedAtividadesId,
    atividades,
    reservas: reservasFiltradas,
    startDate,
    endDate,
    minimumStartDate,
    canSelectPastDates,
    isAdministrador,
    isLoadingClubs: scopeIsLoading || isLoadingClubs,
    isLoadingAtividades,
    isLoadingReservas,
    isRefreshing,
    clubsError,
    atividadesError,
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
    selectedAtividade,
    usaMensalPorSemana,
    canAccessSelectedAcademia,
    setSelectedAtividadesId: handleAtividadeChange,
    setStartDate: handleStartDateChange,
    setEndDate: handleEndDateChange,
    nomeFiltro,
    setNomeFiltro,
    loadClubs: loadLocalContext,
    loadAtividades,
    fetchReservas,
    canDeleteReservas,
    showResponsavelColumn,
    showUnidadeColumn,
  };
}
