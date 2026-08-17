import { useCallback, useEffect, useState } from 'react';

import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { criarMapaDiario, getMapaDiarioAll } from '@/services/mapa-diario-service';
import {
  findLatestDataAtividadeTimestamp,
  formatMapaDiarioFullDate,
  formatMapaDiarioShortDate,
  startOfLocalDay,
  suggestNextMapaDiarioDate,
} from '@/utils/criar-mapa-diario';

export const CRIAR_MAPA_DIARIO_MESSAGES = {
  loadError: 'Não foi possível carregar as datas do mapa diário.',
  createError: 'Não foi possível criar o mapa diário. Tente novamente.',
  createSuccess: 'Mapa diário criado com sucesso.',
  noClub: 'Não foi possível identificar o clube.',
};

type UseCriarMapaDiarioParams = {
  academiasId: number | null;
  authToken: string | null;
  enabled: boolean;
};

export function useCriarMapaDiario({ academiasId, authToken, enabled }: UseCriarMapaDiarioParams) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [ultimaDataJogo, setUltimaDataJogo] = useState<Date | null>(null);
  const [dataSugerida, setDataSugerida] = useState<Date | null>(null);

  const loadDates = useCallback(async () => {
    if (!enabled || !academiasId || !authToken) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const items = await getMapaDiarioAll(academiasId, authToken);
      const latestTimestamp = findLatestDataAtividadeTimestamp(items);
      const ultima = latestTimestamp != null ? startOfLocalDay(new Date(latestTimestamp)) : null;
      const sugerida = suggestNextMapaDiarioDate(latestTimestamp);

      setUltimaDataJogo(ultima);
      setDataSugerida(sugerida);
    } catch (error) {
      const message = getApiErrorMessage(error);
      setLoadError(message.includes('conectar') ? message : CRIAR_MAPA_DIARIO_MESSAGES.loadError);
      setUltimaDataJogo(null);
      setDataSugerida(null);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, academiasId, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void loadDates();
  }, [enabled, loadDates]);

  const criarMapa = useCallback(async (): Promise<string | null> => {
    if (!academiasId || !authToken) {
      return CRIAR_MAPA_DIARIO_MESSAGES.noClub;
    }

    if (!dataSugerida) {
      return CRIAR_MAPA_DIARIO_MESSAGES.createError;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      await criarMapaDiario(authToken, dataSugerida);
      await loadDates();
      return null;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        throw error;
      }

      const message = getApiErrorMessage(error);
      const errorMessage = message.includes('conectar')
        ? message
        : CRIAR_MAPA_DIARIO_MESSAGES.createError;

      setCreateError(errorMessage);
      return errorMessage;
    } finally {
      setIsCreating(false);
    }
  }, [authToken, academiasId, dataSugerida, loadDates]);

  return {
    isLoading,
    loadError,
    isCreating,
    createError,
    ultimaDataJogo,
    dataSugerida,
    ultimaDataLabel: ultimaDataJogo ? formatMapaDiarioShortDate(ultimaDataJogo) : '—',
    dataSugeridaLabel: dataSugerida ? formatMapaDiarioFullDate(dataSugerida) : '—',
    loadDates,
    criarMapa,
    clearCreateError: () => setCreateError(null),
  };
}
