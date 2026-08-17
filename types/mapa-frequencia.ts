export const MAPA_FREQUENCIA_KEYS = [
  'mapa1',
  'mapa2',
  'mapa3',
  'mapa4',
  'mapa5',
  'mapa6',
  'mapa7',
  'mapa8',
  'mapa9',
  'mapa10',
] as const;

export type MapaFrequenciaKey = (typeof MAPA_FREQUENCIA_KEYS)[number];

export type FrequenciaStatus = 1 | 3 | null;

export type FrequenciaRegistroApi = {
  id: number;
  created_at: number;
  atividades_id: number;
  academias_id: number;
  nome: string;
  users_id: number;
  mapa1: number;
  mapa2: number;
  mapa3: number;
  mapa4: number;
  mapa5: number;
  mapa6: number;
  mapa7: number;
  mapa8: number;
  mapa9: number;
  mapa10: number;
};

export type ColunaMapaFrequencia = {
  chave: MapaFrequenciaKey;
  mapaDiarioId: number;
  dataAtividade: number | null;
  dataFormatada: string;
  horaFormatada: string;
};

export type AlunoMapaFrequencia = {
  id: number;
  users_id: number;
  nome: string;
  statuses: Record<MapaFrequenciaKey, FrequenciaStatus>;
};

export type MapaFrequenciaRelatorio = {
  atividadeId: number;
  atividadeNome: string;
  horarioId: number | null;
  horarioFormatado: string | null;
  colunas: ColunaMapaFrequencia[];
  alunos: AlunoMapaFrequencia[];
};

export type HorarioMapaFrequenciaOption = {
  id: number | null;
  label: string;
  hora: number | null;
  minutos: number | null;
};

export type MapaFrequenciaGeracaoEtapa =
  | 'excluir'
  | 'inicializar'
  | 'montar'
  | 'carregar'
  | 'processar';
