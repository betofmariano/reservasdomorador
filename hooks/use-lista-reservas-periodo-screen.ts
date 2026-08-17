import { useCallback, useMemo, useRef, useState } from 'react';

import { useGestorAcademiaScope } from '@/hooks/use-gestor-academia-scope';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { consultarListaReservasPeriodoReport } from '@/services/lista-reservas-periodo-service';
import type {
  ListaReservasPeriodoResumo,
  ReservaPeriodoRelatorioItem,
} from '@/types/lista-reservas-periodo';
import type { User } from '@/types/user';
import { canAccessGestorScreen } from '@/utils/gestor-academia-access';
import {
  buildReservasPeriodoResumo,
  createDefaultPeriodoHoje,
  getEndOfDay,
  getStartOfDay,
  sortReservasPeriodoRelatorio,
  validateListaReservasPeriodoConsulta,
} from '@/utils/lista-reservas-periodo';

export const LISTA_RESERVAS_PERIODO_MESSAGES = {
  permission: 'Você não possui permissão para acessar este relatório.',
  noLocal: 'Selecione um local prioritário para continuar.',
  loadReservas: 'Gerando relatório...',
  consultaError: 'Não foi possível consultar as reservas por período. Tente novamente.',
  emptyConsulta: 'Nenhuma reserva foi encontrada para o período informado.',
} as const;

type UseListaReservasPeriodoScreenParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useListaReservasPeriodoScreen({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseListaReservasPeriodoScreenParams) {
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

  const [startDate, setStartDateState] = useState(defaultPeriodo.inicio);
  const [endDate, setEndDateState] = useState(defaultPeriodo.fim);
  const [consultaItems, setConsultaItems] = useState<ReservaPeriodoRelatorioItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConsultando, setIsConsultando] = useState(false);
  const [consultaError, setConsultaError] = useState<string | null>(null);
  const [hasConsultado, setHasConsultado] = useState(false);

  const consultaRequestIdRef = useRef(0);

  const canAccess = canAccessGestorScreen({
    isAdministrador,
    canManageSelectedAcademia,
    selectedAcademia,
    academiasId,
    permissions,
    permissionKey: 'podeAcessarListaReservasPeriodo',
  });

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

  const consultarReservas = useCallback(async () => {
    const validationMessage = validateListaReservasPeriodoConsulta({
      dataHoraInicial,
      dataHoraFinal,
    });

    if (validationMessage) {
      setValidationError(validationMessage);
      setConsultaError(null);
      return;
    }

    if (!authToken || !academiasId || !canAccess) {
      return;
    }

    const requestId = ++consultaRequestIdRef.current;
    setValidationError(null);
    setConsultaError(null);
    setIsConsultando(true);

    try {
      const items = await consultarListaReservasPeriodoReport(
        academiasId,
        {
          dataHoraInicial: dataHoraInicial.getTime(),
          dataHoraFinal: dataHoraFinal.getTime(),
        },
        authToken,
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
      setConsultaError(await handleApiError(error, LISTA_RESERVAS_PERIODO_MESSAGES.consultaError));
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
  ]);

  const reservas = useMemo(
    () => sortReservasPeriodoRelatorio(consultaItems, 'atividade_asc'),
    [consultaItems],
  );

  const resumo: ListaReservasPeriodoResumo = useMemo(
    () => buildReservasPeriodoResumo(consultaItems, reservas),
    [consultaItems, reservas],
  );

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
    startDate,
    endDate,
    dataHoraInicial,
    dataHoraFinal,
    reservas,
    resumo,
    validationError,
    isConsultando,
    consultaError,
    hasConsultado,
    setStartDate,
    setEndDate,
    consultarReservas,
  };
}
