export type HorarioPresencaOption = {
  mapaDiarioId: number;
  mapaHorarioId: number | null;
  atividadeId: number;
  data: string;
  horario: string;
  dataHora: string;
  descricao: string;
  dataAtividade: number;
};

export type ReservaPresenca = {
  reservaId: number;
  usuarioId: number;
  nomeUsuario: string;
  foto?: string | null;
  atividadeId: number;
  atividadeNome: string;
  mapaDiarioId: number;
  mapaHorarioId?: number | null;
  data: string;
  horario: string;
  dataHora: string;
  ordemReserva?: number | null;
  presente: boolean;
  presencaRegistradaEm?: string | null;
  presencaRegistradaPor?: number | null;
  cancelada?: boolean;
  limiteCancelamento?: number | null;
  createdAt?: number | null;
  dataAtividade?: number | null;
};

export type ReservasAtividadeHoraResponse = {
  mapaDiario?: {
    id: number;
    atividade_id?: number;
    atividade_nome?: string;
    data?: string;
    horario?: string;
  } | null;
  quantidade?: number;
  reservas: ReservaPresenca[];
  lista_espera?: ReservaPresenca[];
};

export type ListaPresencaSortMode = 'nome' | 'reserva';

export type TogglePresencaPayload = {
  reservaId: number;
  presente: boolean;
};

export type TogglePresencaResponse = {
  id?: number;
  success?: boolean;
  reserva_id?: number;
  presente?: boolean;
  presenca_registrada_em?: string | null;
  presencaRegistradaEm?: string | null;
};
