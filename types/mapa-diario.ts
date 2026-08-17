export type MapaDiarioItem = {
  id: number;
  created_at: number;
  academias_id: number;
  quadra: number;
  hora: number;
  minutos: number;
  dataAtividade: number | null;
  dataLiberacao: number | null;
  dataReserva: number | null;
  jogos_id: number;
  usoQuadra: string;
  responsavel: number;
};

export type MapaDiarioResponse = MapaDiarioItem[];
