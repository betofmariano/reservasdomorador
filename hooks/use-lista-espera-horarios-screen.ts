import { useCallback, useMemo, useRef, useState } from 'react';

import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { getMapaDiarioFuturo } from '@/services/mapa-diario-futuro-service';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import { filterMapaDiarioFuturoListaEspera } from '@/utils/mapa-diario-futuro';
import { getServerDate } from '@/utils/server-time';

const LOAD_ERROR = 'Não foi possível carregar os horários lotados.';
const EMPTY_MESSAGE = 'Não há horários lotados para lista de espera nesta atividade.';

type UseListaEsperaHorariosScreenParams = {
  academiasId: number | null;
  atividadesId: number | null;
  authToken: string | null;
  onUnauthorized: () => void | Promise<void>;
};

export function useListaEsperaHorariosScreen({
  academiasId,
  atividadesId,
  authToken,
  onUnauthorized,
}: UseListaEsperaHorariosScreenParams) {
  const [horarios, setHorarios] = useState<MapaDiarioFuturoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchHorarios = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (!authToken || !academiasId || !atividadesId) {
        setHorarios([]);
        setLoadError(null);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      const refreshing = options?.refreshing === true;

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setLoadError(null);

      try {
        const data = await getMapaDiarioFuturo(authToken, {
          academias_id: academiasId,
          atividades_id: atividadesId,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        const filtered = filterMapaDiarioFuturoListaEspera(
          data,
          {
            academias_id: academiasId,
            atividades_id: atividadesId,
          },
          getServerDate(),
        );

        setHorarios(filtered);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return;
        }

        const message = getApiErrorMessage(error);
        setLoadError(message.includes('conectar') ? message : LOAD_ERROR);
        setHorarios([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [academiasId, atividadesId, authToken, onUnauthorized],
  );

  const isReady = academiasId != null && atividadesId != null;

  const emptyMessage = useMemo(() => {
    if (!isReady) {
      return 'Selecione uma atividade para visualizar os horários.';
    }

    return EMPTY_MESSAGE;
  }, [isReady]);

  return {
    horarios,
    isLoading,
    isRefreshing,
    loadError,
    emptyMessage,
    isReady,
    fetchHorarios,
  };
}

export const LISTA_ESPERA_HORARIOS_MESSAGES = {
  loadError: LOAD_ERROR,
  empty: EMPTY_MESSAGE,
  success: 'Você entrou na lista de espera com sucesso.',
  duplicate: 'Você já está nesta lista de espera.',
  submitError: 'Não foi possível entrar na lista de espera. Tente novamente.',
};
