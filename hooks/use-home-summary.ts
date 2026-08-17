import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { fetchHomeSummary, pickNearestListaEspera, pickNearestReserva } from '@/services/home-summary-service';
import type { HomeSummaryState } from '@/types/home-summary';

const INITIAL_STATE: HomeSummaryState = {
  reservas: [],
  listasEspera: [],
  proximaReserva: null,
  proximaListaEspera: null,
  isLoading: true,
  isRefreshing: false,
  reservasError: null,
  listaEsperaError: null,
};

const HOME_SUMMARY_POLL_INTERVAL_MS = 30_000;

type UseHomeSummaryParams = {
  userId: number | undefined;
  academiasId: number | undefined;
  authToken: string | null;
};

export function useHomeSummary({ userId, academiasId, authToken }: UseHomeSummaryParams) {
  const [state, setState] = useState<HomeSummaryState>(INITIAL_STATE);

  const loadSummary = useCallback(
    async (options?: { refreshing?: boolean; silent?: boolean }) => {
      if (!userId || !authToken || !academiasId) {
        setState({
          ...INITIAL_STATE,
          isLoading: false,
          isRefreshing: false,
        });
        return;
      }

      if (options?.silent) {
        const result = await fetchHomeSummary(userId, authToken, academiasId);

        setState((current) => ({
          ...current,
          reservas: result.reservas,
          listasEspera: result.listasEspera,
          proximaReserva: pickNearestReserva(result.reservas),
          proximaListaEspera: pickNearestListaEspera(result.listasEspera),
          reservasError: result.reservasError,
          listaEsperaError: result.listaEsperaError,
        }));
        return;
      }

      setState((current) => ({
        ...current,
        isLoading: options?.refreshing ? current.isLoading : true,
        isRefreshing: Boolean(options?.refreshing),
        reservasError: options?.refreshing ? current.reservasError : null,
        listaEsperaError: options?.refreshing ? current.listaEsperaError : null,
      }));

      const result = await fetchHomeSummary(userId, authToken, academiasId);

      setState({
        reservas: result.reservas,
        listasEspera: result.listasEspera,
        proximaReserva: pickNearestReserva(result.reservas),
        proximaListaEspera: pickNearestListaEspera(result.listasEspera),
        isLoading: false,
        isRefreshing: false,
        reservasError: result.reservasError,
        listaEsperaError: result.listaEsperaError,
      });
    },
    [academiasId, authToken, userId],
  );

  const removeReserva = useCallback((reservaId: number) => {
    setState((current) => {
      const reservas = current.reservas.filter((reserva) => reserva.id !== reservaId);

      return {
        ...current,
        reservas,
        proximaReserva: pickNearestReserva(reservas),
      };
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!userId || !authToken || !academiasId) {
        return;
      }

      void loadSummary();

      const intervalId = setInterval(() => {
        void loadSummary({ silent: true });
      }, HOME_SUMMARY_POLL_INTERVAL_MS);

      return () => clearInterval(intervalId);
    }, [academiasId, authToken, loadSummary, userId]),
  );

  return {
    ...state,
    loadSummary,
    removeReserva,
  };
}
