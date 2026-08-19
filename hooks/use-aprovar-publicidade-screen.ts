import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '@/services/api-client';
import {
  getPatrocinadorById,
  getPatrocinadores,
  patchPatrocinadorAprovar,
} from '@/services/publicidade-service';
import type { Patrocinador } from '@/types/publicidade';
import type { User } from '@/types/user';
import { isUserAdministrador } from '@/utils/club-config';
import {
  buildPatrocinadorAprovacaoPayload,
  getPublicidadePendencias,
  hasPublicidadePendencias,
} from '@/utils/publicidade-aprovacao';

export const APROVAR_PUBLICIDADE_MESSAGES = {
  permission: 'Esta tela está disponível apenas para o administrador.',
  empty: 'Nenhuma alteração pendente de aprovação.',
  confirmed: 'Publicidade aprovada.',
  noChanges: 'Esta empresa não tem alterações pendentes.',
};

async function loadPatrocinadorDetalhe(patrocinador: Patrocinador): Promise<Patrocinador> {
  try {
    return await getPatrocinadorById(patrocinador.id);
  } catch {
    return patrocinador;
  }
}

export function useAprovarPublicidadeScreen(user: User | null, authToken: string | null, isAuthLoading: boolean) {
  const [empresas, setEmpresas] = useState<Patrocinador[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAccess = Boolean(user && isUserAdministrador(user));

  const load = useCallback(async () => {
    if (!canAccess) {
      setEmpresas([]);
      setSelectedId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lista = await getPatrocinadores();
      const detalhados = await Promise.all(lista.map(loadPatrocinadorDetalhe));
      const pendentes = detalhados
        .filter(hasPublicidadePendencias)
        .sort((left, right) =>
          (left.empresa || '').localeCompare(right.empresa || '', 'pt-BR', { sensitivity: 'base' }),
        );

      setEmpresas(pendentes);
      setSelectedId((current) => {
        if (current && pendentes.some((empresa) => empresa.id === current)) {
          return current;
        }

        return pendentes[0]?.id ?? null;
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
      setEmpresas([]);
      setSelectedId(null);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void load();
  }, [isAuthLoading, load]);

  const selected = useMemo(
    () => empresas.find((empresa) => empresa.id === selectedId) ?? null,
    [empresas, selectedId],
  );

  const pendencias = useMemo(
    () => (selected ? getPublicidadePendencias(selected) : { textos: [], imagens: [] }),
    [selected],
  );

  async function confirm(): Promise<string | null> {
    if (!selected || !authToken) {
      return APROVAR_PUBLICIDADE_MESSAGES.permission;
    }

    const payload = buildPatrocinadorAprovacaoPayload(selected);

    if (!payload) {
      return APROVAR_PUBLICIDADE_MESSAGES.noChanges;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await patchPatrocinadorAprovar(selected.id, payload, authToken);
      await load();
      return null;
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      return message;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    canAccess,
    empresas,
    selected,
    pendencias,
    isLoading,
    isSubmitting,
    error,
    selectEmpresa: (empresa: Patrocinador) => setSelectedId(empresa.id),
    confirm,
  };
}
