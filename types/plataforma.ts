export type PlataformaStats = {
  id: number;
  created_at: number;
  matchplace: number;
  matchpoint: number;
  alunos: number;
  impactoDiario: number;
  viewsDiario: number;
  ativosMatchplace: number;
  ativosMatchpoint: number;
};

export type PlataformaStatsMetric = {
  id: string;
  label: string;
  value: string;
};
