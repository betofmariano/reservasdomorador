import { useEffect, useState } from 'react';

import { getPlataformaStats } from '@/services/plataforma-service';
import type { PlataformaStats, PlataformaStatsMetric } from '@/types/plataforma';

function formatInteiro(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function buildPlataformaMetrics(stats: PlataformaStats): PlataformaStatsMetric[] {
  const cadastrados = stats.matchplace + stats.matchpoint;

  return [
    {
      id: 'cadastrados',
      label: 'Cadastrados',
      value: `${formatInteiro(cadastrados)} pessoas`,
    },
    {
      id: 'alunos',
      label: 'Alunos Matriculados',
      value: formatInteiro(stats.alunos),
    },
    {
      id: 'impacto',
      label: 'Impacto Diário',
      value: `${formatInteiro(stats.impactoDiario)} pessoas`,
    },
    {
      id: 'views',
      label: 'Views Diário Propaganda',
      value: formatInteiro(stats.viewsDiario),
    },
  ];
}

export function usePlataformaStats() {
  const [metrics, setMetrics] = useState<PlataformaStatsMetric[]>([]);

  useEffect(() => {
    let cancelled = false;

    void getPlataformaStats()
      .then((stats) => {
        if (!cancelled) {
          setMetrics(buildPlataformaMetrics(stats));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMetrics([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { metrics };
}
