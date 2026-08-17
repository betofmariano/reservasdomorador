import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { getAtividadeById } from '@/services/atividades-service';
import { getAtividadeUnidadesByAtividade } from '@/services/atividade-unidade-service';
import {
  carregarMapaReservaHorario,
  confirmarReservaHorario,
  resolveAcademiaForReserva,
} from '@/services/reserva-horario-flow-service';
import { getProximaDataLiberacao } from '@/services/proxima-data-liberacao-service';
import { getReservasMensalPorSemanaLimiteSemanalUsuario } from '@/services/reservas-mensal-por-semana-service';
import type { Academia } from '@/types/academia';
import type { Atividade } from '@/types/atividade';
import type { AtividadeUnidade } from '@/types/atividade-unidade';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import type { CriarReservaResponse, ReservaResponsavelActor } from '@/types/reserva';
import type { ReservaUsuario } from '@/types/reserva-usuario';
import {
  resolveLimiteReservasSemana,
  resolveUsaMensalPorSemana,
} from '@/utils/atividade-programacao';
import {
  buildMapaAtividadeUnidadeTabs,
  filterMapaDiarioByAtividadeUnidade,
  resolveInitialAtividadeUnidadeTabId,
  type MapaAtividadeUnidadeTab,
} from '@/utils/mapa-diario-atividade-unidade';
import {
  buildMapaMensalPorSemanaSemanaOptionsWithLimit,
  filterMapaDiarioFuturoBySemana,
  isSemanaMensalPorSemanaLimiteAtingido,
  type MapaMensalPorSemanaSemanaOption,
} from '@/utils/mapa-mensal-por-semana-opcoes';
import {
  CAPACIDADE_ESGOTADA_MESSAGE,
  filterMapaDiarioFuturoExibiveis,
  filterMapaDiarioFuturoReservaveis,
  getProximaDataLiberacaoFromMapaItems,
  getProximaLiberacaoTimestamp,
  mapaDiarioFuturoTemCapacidadeDisponivel,
  sortMapaDiarioFuturoAsc,
  type MapaDiarioFuturoFilters,
} from '@/utils/mapa-diario-futuro';
import { getServerDate, getServerNow } from '@/utils/server-time';

const LOAD_ERROR = 'Não foi possível carregar os horários disponíveis.';
const EMPTY_MESSAGE = 'Não há horários liberados para reserva nesta atividade.';
const EMPTY_SEMANA_MESSAGE = 'Não há semanas disponíveis para reserva nesta atividade.';
const LIBERACAO_REFRESH_DELAY_MS = 100;
/** Mesmo intervalo do MatchPoint (`use-mapa-reservas-screen`). */
const MAPA_POLL_INTERVAL_MS = 3_000;

type FetchHorariosOptions = {
  refreshing?: boolean;
  silent?: boolean;
  force?: boolean;
};

type UseReservarHorarioScreenParams = {
  userId: number | null;
  reservationTargetUserId?: number | null;
  academiasId: number | null;
  atividadesId: number | null;
  authToken: string | null;
  onUnauthorized: () => void | Promise<void>;
};

export function useReservarHorarioScreen({
  userId,
  reservationTargetUserId = null,
  academiasId,
  atividadesId,
  authToken,
  onUnauthorized,
}: UseReservarHorarioScreenParams) {
  const [allHorarios, setAllHorarios] = useState<MapaDiarioFuturoItem[]>([]);
  const [reservasMensalPorSemana, setReservasMensalPorSemana] = useState<ReservaUsuario[]>([]);
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [atividadeUnidades, setAtividadeUnidades] = useState<AtividadeUnidade[]>([]);
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<number | null>(null);
  const [selectedSemana, setSelectedSemana] = useState<number | null>(null);
  const [referenceDate, setReferenceDate] = useState(() => getServerDate());
  const [apiProximaLiberacao, setApiProximaLiberacao] = useState<number | null>(null);
  const [hasApiProximaLiberacao, setHasApiProximaLiberacao] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const isFetchingRef = useRef(false);
  const academiaRef = useRef<Academia | null>(null);
  const atividadeRef = useRef<Atividade | null>(null);
  const reservasMensalPorSemanaRef = useRef<ReservaUsuario[]>([]);
  const allHorariosRef = useRef<MapaDiarioFuturoItem[]>([]);

  reservasMensalPorSemanaRef.current = reservasMensalPorSemana;
  allHorariosRef.current = allHorarios;

  const isReady = academiasId != null && atividadesId != null;

  const limiteSemanalUserId = reservationTargetUserId ?? userId;
  const usaMensalPorSemana = resolveUsaMensalPorSemana({ atividade });
  const limiteReservasSemana = resolveLimiteReservasSemana({ atividade });

  const filters = useMemo<MapaDiarioFuturoFilters | null>(() => {
    if (!isReady) {
      return null;
    }

    return {
      academias_id: academiasId,
      atividades_id: atividadesId,
    };
  }, [academiasId, atividadesId, isReady]);

  const horariosReservaveis = useMemo(() => {
    if (!filters) {
      return [];
    }

    return filterMapaDiarioFuturoReservaveis(allHorarios, filters, referenceDate);
  }, [allHorarios, filters, referenceDate]);

  const horariosExibiveis = useMemo(() => {
    if (!filters) {
      return [];
    }

    return filterMapaDiarioFuturoExibiveis(allHorarios, filters, referenceDate);
  }, [allHorarios, filters, referenceDate]);

  const temHorarioLiberado = horariosExibiveis.length > 0;

  // Semanas só com horários já liberados — sem liberação, não mostra o seletor.
  const semanaOptions = useMemo<MapaMensalPorSemanaSemanaOption[]>(() => {
    if (!usaMensalPorSemana || !filters || !temHorarioLiberado) {
      return [];
    }

    return buildMapaMensalPorSemanaSemanaOptionsWithLimit(
      horariosExibiveis,
      filters,
      reservasMensalPorSemana,
      limiteReservasSemana,
      referenceDate,
    );
  }, [
    filters,
    horariosExibiveis,
    limiteReservasSemana,
    referenceDate,
    reservasMensalPorSemana,
    temHorarioLiberado,
    usaMensalPorSemana,
  ]);

  const horariosDaSemana = useMemo(() => {
    if (!usaMensalPorSemana) {
      return horariosReservaveis;
    }

    if (selectedSemana == null) {
      return [];
    }

    return sortMapaDiarioFuturoAsc(
      filterMapaDiarioFuturoBySemana(horariosExibiveis, selectedSemana),
    );
  }, [horariosExibiveis, horariosReservaveis, selectedSemana, usaMensalPorSemana]);

  const unidadesById = useMemo(() => {
    const map = new Map<number, AtividadeUnidade>();

    for (const unidade of atividadeUnidades) {
      map.set(unidade.id, unidade);
    }

    return map;
  }, [atividadeUnidades]);

  const unidadeTabs = useMemo<MapaAtividadeUnidadeTab[]>(() => {
    if (!usaMensalPorSemana) {
      return [];
    }

    const source = selectedSemana != null ? horariosDaSemana : allHorarios;

    return buildMapaAtividadeUnidadeTabs(source, unidadesById);
  }, [allHorarios, horariosDaSemana, selectedSemana, unidadesById, usaMensalPorSemana]);

  const horarios = useMemo(() => {
    if (!usaMensalPorSemana || unidadeTabs.length === 0) {
      return horariosDaSemana;
    }

    return filterMapaDiarioByAtividadeUnidade(horariosDaSemana, selectedUnidadeId);
  }, [horariosDaSemana, selectedUnidadeId, unidadeTabs.length, usaMensalPorSemana]);

  const proximaLiberacaoFromMapa = useMemo(() => {
    if (!filters) {
      return null;
    }

    const source =
      usaMensalPorSemana && selectedSemana != null
        ? filterMapaDiarioFuturoBySemana(allHorarios, selectedSemana)
        : allHorarios;

    return (
      getProximaLiberacaoTimestamp(source, filters, referenceDate) ??
      getProximaDataLiberacaoFromMapaItems(source, filters, referenceDate)
    );
  }, [allHorarios, filters, referenceDate, selectedSemana, usaMensalPorSemana]);

  const proximaLiberacao =
    hasApiProximaLiberacao && apiProximaLiberacao != null
      ? apiProximaLiberacao
      : proximaLiberacaoFromMapa;

  /** Sem horário liberado: não mostra semanas; countdown quando houver dataLiberacao futura. */
  const isAguardandoLiberacao = !temHorarioLiberado;

  const fetchHorarios = useCallback(
    async (options?: FetchHorariosOptions) => {
      if (!authToken || !filters) {
        if (!options?.silent) {
          setAllHorarios([]);
          setReservasMensalPorSemana([]);
          setAcademia(null);
          setAtividade(null);
          setAtividadeUnidades([]);
          setSelectedUnidadeId(null);
          academiaRef.current = null;
          atividadeRef.current = null;
          setSelectedSemana(null);
          setApiProximaLiberacao(null);
          setHasApiProximaLiberacao(false);
          setLoadError(null);
          setIsLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      if (options?.silent && isFetchingRef.current && !options?.force) {
        return;
      }

      const isSilent = options?.silent === true;
      const requestId = isSilent ? null : ++requestIdRef.current;
      const refreshing = options?.refreshing === true;
      const showFullLoading = !isSilent && !refreshing;
      const showRefreshIndicator = !isSilent && refreshing;

      isFetchingRef.current = true;

      if (showFullLoading) {
        setIsLoading(true);
        setSelectedSemana(null);
      }

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }

      if (!isSilent) {
        setLoadError(null);
        setHasApiProximaLiberacao(false);
      }

      try {
        let resolvedAcademia = academiaRef.current;
        let resolvedAtividade = atividadeRef.current;

        if (!isSilent || !resolvedAcademia || !resolvedAtividade) {
          [resolvedAcademia, resolvedAtividade] = await Promise.all([
            resolveAcademiaForReserva(filters.academias_id),
            getAtividadeById(filters.atividades_id, authToken),
          ]);

          if (!isSilent && requestId !== requestIdRef.current) {
            return;
          }

          academiaRef.current = resolvedAcademia;
          atividadeRef.current = resolvedAtividade;
          setAcademia(resolvedAcademia);
          setAtividade(resolvedAtividade);
        }

        setReferenceDate(getServerDate());

        const usaMensalPorSemana = resolveUsaMensalPorSemana({
          atividade: resolvedAtividade,
        });
        const flowOptions = { usaMensalPorSemana };

        const liberacaoPromise = getProximaDataLiberacao(
          authToken,
          filters.atividades_id,
        ).then(
          (value) => ({ ok: true as const, value }),
          () => ({ ok: false as const, value: null }),
        );

        let resolvedUnidades: AtividadeUnidade[] = [];

        if (usaMensalPorSemana) {
          try {
            resolvedUnidades = await getAtividadeUnidadesByAtividade(
              filters.atividades_id,
              authToken,
            );
          } catch {
            resolvedUnidades = [];
          }

          if (!isSilent && requestId !== requestIdRef.current) {
            return;
          }

          setAtividadeUnidades(resolvedUnidades);
        }

        if (usaMensalPorSemana && limiteSemanalUserId) {
          const [data, reservas, liberacaoResult] = await Promise.all([
            carregarMapaReservaHorario(authToken, filters, resolvedAcademia, flowOptions),
            getReservasMensalPorSemanaLimiteSemanalUsuario(limiteSemanalUserId, filters.academias_id, authToken),
            liberacaoPromise,
          ]);

          if (!isSilent && requestId !== requestIdRef.current) {
            return;
          }

          setAllHorarios(data);
          setReservasMensalPorSemana(reservas);

          if (liberacaoResult.ok) {
            setApiProximaLiberacao(liberacaoResult.value);
            setHasApiProximaLiberacao(true);
          }

          return;
        }

        const [data, liberacaoResult] = await Promise.all([
          carregarMapaReservaHorario(authToken, filters, resolvedAcademia, flowOptions),
          liberacaoPromise,
        ]);

        if (!isSilent && requestId !== requestIdRef.current) {
          return;
        }

        setAllHorarios(data);
        setReservasMensalPorSemana([]);
        setAtividadeUnidades([]);

        if (liberacaoResult.ok) {
          setApiProximaLiberacao(liberacaoResult.value);
          setHasApiProximaLiberacao(true);
        }
      } catch (error) {
        if (!isSilent && requestId !== requestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return;
        }

        if (!isSilent) {
          const message = getApiErrorMessage(error);
          setLoadError(message.includes('conectar') ? message : LOAD_ERROR);
          setAllHorarios([]);
          setReservasMensalPorSemana([]);
          setSelectedSemana(null);
          setApiProximaLiberacao(null);
          setHasApiProximaLiberacao(false);
        }
      } finally {
        isFetchingRef.current = false;

        if (!isSilent && requestId === requestIdRef.current) {
          if (showFullLoading) {
            setIsLoading(false);
          }

          if (showRefreshIndicator) {
            setIsRefreshing(false);
          }
        }
      }
    },
    [authToken, limiteSemanalUserId, filters, onUnauthorized],
  );

  const confirmarReserva = useCallback(
    async (
      item: MapaDiarioFuturoItem,
      usersId: number,
      responsavelActor: ReservaResponsavelActor,
    ): Promise<{ response: CriarReservaResponse; podeReservarMais: boolean }> => {
      if (!authToken) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (!academiaRef.current && filters?.academias_id) {
        academiaRef.current = await resolveAcademiaForReserva(filters.academias_id);
        setAcademia(academiaRef.current);
      }

      if (!atividadeRef.current && filters?.atividades_id) {
        atividadeRef.current = await getAtividadeById(filters.atividades_id, authToken);
        setAtividade(atividadeRef.current);
      }

      if (!item?.id || !usersId) {
        throw new Error('Selecione um horário disponível para reservar.');
      }

      if (!mapaDiarioFuturoTemCapacidadeDisponivel(item)) {
        throw new Error(CAPACIDADE_ESGOTADA_MESSAGE);
      }

      const usaMensalPorSemana = resolveUsaMensalPorSemana({
        atividade: atividadeRef.current,
      });
      const limiteSemana = resolveLimiteReservasSemana({
        atividade: atividadeRef.current,
      });

      if (usaMensalPorSemana && filters && item.semana != null) {
        const reservasAtualizadas = await getReservasMensalPorSemanaLimiteSemanalUsuario(
          usersId,
          filters.academias_id,
          authToken,
        );

        reservasMensalPorSemanaRef.current = reservasAtualizadas;
        setReservasMensalPorSemana(reservasAtualizadas);

        if (
          isSemanaMensalPorSemanaLimiteAtingido(
            item.semana,
            reservasAtualizadas,
            allHorariosRef.current,
            filters.academias_id,
            limiteSemana,
            referenceDate,
            filters.atividades_id,
          )
        ) {
          throw new Error('O usuário selecionado já atingiu o limite de reservas para esta semana.');
        }
      }

      const response = await confirmarReservaHorario(
        item,
        usersId,
        authToken,
        academiaRef.current,
        responsavelActor,
        { usaMensalPorSemana },
      );

      let podeReservarMais = false;

      if (usaMensalPorSemana && filters && item.semana != null && limiteSemana != null && limiteSemana > 0) {
        const reservasAposReserva = await getReservasMensalPorSemanaLimiteSemanalUsuario(
          usersId,
          filters.academias_id,
          authToken,
        );

        reservasMensalPorSemanaRef.current = reservasAposReserva;
        setReservasMensalPorSemana(reservasAposReserva);

        podeReservarMais = !isSemanaMensalPorSemanaLimiteAtingido(
          item.semana,
          reservasAposReserva,
          allHorariosRef.current,
          filters.academias_id,
          limiteSemana,
          referenceDate,
          filters.atividades_id,
        );
      }

      // Atualiza o mapa com o estado real do backend após criar a reserva.
      await fetchHorarios({ refreshing: true });

      return { response, podeReservarMais };
    },
    [authToken, fetchHorarios, filters, referenceDate],
  );

  const refetchOnFocus = useCallback(() => {
    if (allHorariosRef.current.length > 0) {
      void fetchHorarios({ silent: true, force: true });
      return;
    }

    void fetchHorarios();
  }, [fetchHorarios]);

  const selectSemana = useCallback(
    (semana: number) => {
      const usaMensalPorSemana = resolveUsaMensalPorSemana({
        atividade: atividadeRef.current,
      });

      if (!filters || !usaMensalPorSemana) {
        setSelectedSemana(semana);
        return;
      }

      if (
        isSemanaMensalPorSemanaLimiteAtingido(
          semana,
          reservasMensalPorSemanaRef.current,
          allHorariosRef.current,
          filters.academias_id,
          resolveLimiteReservasSemana({
            atividade: atividadeRef.current,
          }),
          referenceDate,
          filters.atividades_id,
        )
      ) {
        return;
      }

      setSelectedSemana(semana);
      void fetchHorarios({ refreshing: true });
    },
    [fetchHorarios, filters, referenceDate],
  );

  const handleLiberacaoReached = useCallback(() => {
    setReferenceDate(getServerDate());
    void fetchHorarios({ silent: true, force: true });
  }, [fetchHorarios]);

  const clearSelectedSemana = useCallback(() => {
    setSelectedSemana(null);
  }, []);

  const selectUnidade = useCallback((unidadeId: number) => {
    setSelectedUnidadeId(unidadeId);
  }, []);

  useEffect(() => {
    setSelectedSemana(null);
    setSelectedUnidadeId(null);
  }, [academiasId, atividadesId, reservationTargetUserId]);

  useEffect(() => {
    setSelectedUnidadeId((current) => resolveInitialAtividadeUnidadeTabId(unidadeTabs, current));
  }, [unidadeTabs]);

  useEffect(() => {
    if (!usaMensalPorSemana || selectedSemana != null) {
      return;
    }

    const semanasSelecionaveis = semanaOptions.filter((option) => option.selecionavel);

    if (semanasSelecionaveis.length !== 1) {
      return;
    }

    setSelectedSemana(semanasSelecionaveis[0].semana);
  }, [semanaOptions, selectedSemana, usaMensalPorSemana]);

  useEffect(() => {
    if (proximaLiberacao == null) {
      return;
    }

    const delay = proximaLiberacao - getServerNow() + LIBERACAO_REFRESH_DELAY_MS;

    if (delay <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleLiberacaoReached();
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [handleLiberacaoReached, proximaLiberacao]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setReferenceDate(getServerDate());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!authToken || !filters) {
      return;
    }

    const intervalId = setInterval(() => {
      void fetchHorarios({ silent: true });
    }, MAPA_POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [authToken, fetchHorarios, filters]);

  const emptyMessage = useMemo(() => {
    if (!isReady) {
      return 'Selecione uma atividade para visualizar os horários.';
    }

    if (isAguardandoLiberacao) {
      // Tela de aguardo: só countdown (sem mensagem de “sem semanas”).
      return '';
    }

    if (usaMensalPorSemana && selectedSemana == null && semanaOptions.length === 0) {
      return EMPTY_SEMANA_MESSAGE;
    }

    if (proximaLiberacao != null && referenceDate.getTime() < proximaLiberacao) {
      return 'Os horários ainda não foram liberados para reserva nesta atividade.';
    }

    return EMPTY_MESSAGE;
  }, [
    isAguardandoLiberacao,
    isReady,
    proximaLiberacao,
    referenceDate,
    selectedSemana,
    semanaOptions.length,
    usaMensalPorSemana,
  ]);

  const showSemanaSelector =
    usaMensalPorSemana &&
    temHorarioLiberado &&
    selectedSemana == null &&
    semanaOptions.length > 0 &&
    !isLoading &&
    !loadError &&
    !isAguardandoLiberacao;

  return {
    horarios,
    proximaLiberacao,
    isAguardandoLiberacao,
    isLoading,
    isRefreshing,
    loadError,
    emptyMessage,
    isReady,
    academia,
    usaMensalPorSemana,
    semanaOptions,
    selectedSemana,
    showSemanaSelector,
    unidadeTabs,
    selectedUnidadeId,
    fetchHorarios,
    refetchOnFocus,
    handleLiberacaoReached,
    confirmarReserva,
    selectSemana,
    selectUnidade,
    clearSelectedSemana,
  };
}

export const RESERVAR_HORARIO_MESSAGES = {
  loadError: LOAD_ERROR,
  empty: EMPTY_MESSAGE,
  emptySemana: EMPTY_SEMANA_MESSAGE,
  success: 'Horário reservado com sucesso.',
  processing: 'Processando o seu pedido de reserva',
  selectUsuarioRequired: 'Selecione o usuário que receberá a reserva.',
};
