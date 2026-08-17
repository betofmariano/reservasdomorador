import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useGestorAcademiaScope } from '@/hooks/use-gestor-academia-scope';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import {
  getAtividadesLocalPrioritarioReport,
  getReservasAtividadePeriodoReport,
} from '@/services/lista-reservas-atividade-service';
import type { AtividadeOption } from '@/types/atividade';
import type {
  ListaReservasAtividadeResumo,
  ReservaAtividadeRelatorioItem,
} from '@/types/lista-reservas-atividade';
import type { User } from '@/types/user';
import { canAccessGestorScreen } from '@/utils/gestor-academia-access';
import {
  createDefaultPeriodoHoje,
  getEndOfDay,
  getStartOfDay,
  sortReservasAtividadeRelatorio,
  validateListaReservasAtividadeConsulta,
} from '@/utils/lista-reservas-atividade';

export const LISTA_RESERVAS_ATIVIDADE_MESSAGES = {
  permission: 'Você não possui permissão para acessar este relatório.',
  noLocal: 'Selecione um local prioritário para continuar.',
  loadAtividades: 'Carregando atividades...',
  loadReservas: 'Carregando reservas...',
  atividadesError: 'Não foi possível carregar as atividades deste local.',
  consultaError: 'Não foi possível consultar as reservas. Tente novamente.',
  emptyAtividades: 'Não existem atividades cadastradas para este local.',
  emptyConsulta: 'Nenhuma reserva foi encontrada para a atividade e o período informados.',
} as const;

type UseListaReservasAtividadeScreenParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useListaReservasAtividadeScreen({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseListaReservasAtividadeScreenParams) {
  const scope = useGestorAcademiaScope({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized,
  });

  const {
    academiasId,
    localNome,
    scopeRequiresLocalSelection,
    scopeIsLoading,
    permissions,
    isAdministrador,
    canManageSelectedAcademia,
    selectedAcademia,
    showAcademiaSelector,
    availableAcademias,
    selectedAcademiaId,
    setSelectedAcademiaId,
    isLoadingAcademias,
    academiasLoadError,
    fetchAvailableAcademias,
  } = scope;

  const defaultPeriodo = useMemo(() => createDefaultPeriodoHoje(), []);

  const [atividades, setAtividades] = useState<AtividadeOption[]>([]);
  const [selectedAtividadesId, setSelectedAtividadesId] = useState<number | null>(null);
  const [startDate, setStartDateState] = useState(defaultPeriodo.inicio);
  const [endDate, setEndDateState] = useState(defaultPeriodo.fim);
  const [consultaItems, setConsultaItems] = useState<ReservaAtividadeRelatorioItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoadingAtividades, setIsLoadingAtividades] = useState(true);
  const [isConsultando, setIsConsultando] = useState(false);
  const [atividadesError, setAtividadesError] = useState<string | null>(null);
  const [consultaError, setConsultaError] = useState<string | null>(null);
  const [hasConsultado, setHasConsultado] = useState(false);

  const atividadesRequestIdRef = useRef(0);
  const consultaRequestIdRef = useRef(0);

  const canAccess = canAccessGestorScreen({
    isAdministrador,
    canManageSelectedAcademia,
    selectedAcademia,
    academiasId,
    permissions,
    permissionKey: 'podeAcessarListaReservasAtividade',
  });
  const selectedAtividade = atividades.find((item) => item.id === selectedAtividadesId) ?? null;

  const dataHoraInicial = useMemo(() => getStartOfDay(startDate), [startDate]);
  const dataHoraFinal = useMemo(() => getEndOfDay(endDate), [endDate]);

  const setStartDate = useCallback((date: Date) => {
    setStartDateState(getStartOfDay(date));
  }, []);

  const setEndDate = useCallback((date: Date) => {
    setEndDateState(getEndOfDay(date));
  }, []);

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

  const loadAtividades = useCallback(async () => {
    if (scopeIsLoading || scopeRequiresLocalSelection || !authToken || !academiasId || !canAccess) {
      setAtividades([]);
      setSelectedAtividadesId(null);
      setIsLoadingAtividades(false);
      return;
    }

    const requestId = ++atividadesRequestIdRef.current;
    setIsLoadingAtividades(true);
    setAtividadesError(null);

    try {
      const items = await getAtividadesLocalPrioritarioReport(academiasId, authToken);

      if (requestId !== atividadesRequestIdRef.current) {
        return;
      }

      setAtividades(items);
      setSelectedAtividadesId((current) => {
        if (current != null && items.some((item) => item.id === current)) {
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
      setAtividadesError(await handleApiError(error, LISTA_RESERVAS_ATIVIDADE_MESSAGES.atividadesError));
    } finally {
      if (requestId === atividadesRequestIdRef.current) {
        setIsLoadingAtividades(false);
      }
    }
  }, [
    authToken,
    canAccess,
    academiasId,
    handleApiError,
    scopeIsLoading,
    scopeRequiresLocalSelection,
  ]);

  useEffect(() => {
    void loadAtividades();
  }, [loadAtividades]);

  const consultarReservas = useCallback(async () => {
    const validationMessage = validateListaReservasAtividadeConsulta({
      atividadesId: selectedAtividadesId,
      dataHoraInicial,
      dataHoraFinal,
    });

    if (validationMessage) {
      setValidationError(validationMessage);
      setConsultaError(null);
      return;
    }

    if (!authToken || !academiasId || !selectedAtividadesId || !canAccess) {
      return;
    }

    const requestId = ++consultaRequestIdRef.current;
    setValidationError(null);
    setConsultaError(null);
    setIsConsultando(true);

    try {
      const items = await getReservasAtividadePeriodoReport(
        academiasId,
        {
          atividadesId: selectedAtividadesId,
          dataHoraInicial: dataHoraInicial.getTime(),
          dataHoraFinal: dataHoraFinal.getTime(),
        },
        authToken,
        selectedAtividade?.nome ?? '',
      );

      if (requestId !== consultaRequestIdRef.current) {
        return;
      }

      setConsultaItems(items);
      setHasConsultado(true);
    } catch (error) {
      if (requestId !== consultaRequestIdRef.current) {
        return;
      }

      setConsultaItems([]);
      setHasConsultado(true);
      setConsultaError(await handleApiError(error, LISTA_RESERVAS_ATIVIDADE_MESSAGES.consultaError));
    } finally {
      if (requestId === consultaRequestIdRef.current) {
        setIsConsultando(false);
      }
    }
  }, [
    authToken,
    canAccess,
    dataHoraFinal,
    dataHoraInicial,
    academiasId,
    handleApiError,
    selectedAtividade?.nome,
    selectedAtividadesId,
  ]);

  const reservas = useMemo(
    () => sortReservasAtividadeRelatorio(consultaItems, 'data_asc'),
    [consultaItems],
  );

  const resumo: ListaReservasAtividadeResumo = useMemo(() => {
    const presentes = consultaItems.filter((item) => item.presencaStatus === 'presente').length;
    const ausentes = consultaItems.filter((item) => item.presencaStatus !== 'presente').length;

    return {
      totalConsulta: consultaItems.length,
      totalExibindo: consultaItems.length,
      presentes,
      ausentes,
    };
  }, [consultaItems]);

  return {
    canAccess,
    requiresLocalSelection: scopeRequiresLocalSelection,
    isContextLoading: scopeIsLoading,
    localNome,
    showAcademiaSelector,
    availableAcademias,
    selectedAcademiaId,
    setSelectedAcademiaId,
    isLoadingAcademias,
    academiasLoadError,
    fetchAvailableAcademias,
    atividades,
    selectedAtividadesId,
    selectedAtividade,
    startDate,
    endDate,
    dataHoraInicial,
    dataHoraFinal,
    reservas,
    resumo,
    validationError,
    isLoadingAtividades,
    isConsultando,
    atividadesError,
    consultaError,
    hasConsultado,
    setSelectedAtividadesId,
    setStartDate,
    setEndDate,
    loadAtividades,
    consultarReservas,
  };
}
