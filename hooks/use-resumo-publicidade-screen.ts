import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/services/api-client';
import { getMostrarPubliXano } from '@/services/publicidade-service';
import type { PublicidadeEmpresaTotais } from '@/types/publicidade';
import type { User } from '@/types/user';
import { isUserAdministrador } from '@/utils/club-config';
import {
  agregarResumoPublicidade,
  fimDoDiaAtual,
  inicioDoMesAtual,
  timestampFimPeriodo,
  timestampInicioPeriodo,
} from '@/utils/resumo-publicidade';

export const RESUMO_PUBLICIDADE_MESSAGES = {
  permission: 'Este relatório está disponível apenas para o administrador.',
};

type UseResumoPublicidadeScreenParams = {
  user: User | null;
  isAuthLoading: boolean;
};

export function useResumoPublicidadeScreen({
  user,
  isAuthLoading,
}: UseResumoPublicidadeScreenParams) {
  const [inicio, setInicio] = useState(() => inicioDoMesAtual());
  const [fim, setFim] = useState(() => fimDoDiaAtual());
  const [empresas, setEmpresas] = useState<PublicidadeEmpresaTotais[]>([]);
  const [totais, setTotais] = useState<PublicidadeEmpresaTotais | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAccess = Boolean(user && isUserAdministrador(user));

  const load = useCallback(async (inicioPeriodo: Date, fimPeriodo: Date) => {
    setIsLoading(true);
    setError(null);

    try {
      const dataInicio = timestampInicioPeriodo(inicioPeriodo, inicioPeriodo);
      const dataFinal = timestampFimPeriodo(fimPeriodo, fimPeriodo);
      const records = await getMostrarPubliXano({ dataInicio, dataFinal });
      const resumo = agregarResumoPublicidade(records, dataInicio, dataFinal);
      setEmpresas(resumo.empresas);
      setTotais(resumo.totais);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setEmpresas([]);
      setTotais(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading || !user || !canAccess) {
      return;
    }

    void load(inicio, fim);
  }, [canAccess, fim, inicio, isAuthLoading, load, user]);

  function applyPeriodo(novoInicio: Date, novoFim: Date) {
    setInicio(novoInicio);
    setFim(novoFim);
  }

  return {
    canAccess,
    inicio,
    fim,
    empresas,
    totais,
    isLoading,
    error,
    applyPeriodo,
    reload: () => void load(inicio, fim),
  };
}
