export type AtividadeProgramada = {
  id: number;
  academias_id: number;
  atividades_id: number;
  atividadeNome: string;
  dataAtividade: number;
  dataLiberacao: number | null;
  limiteReserva: number | null;
  limiteCancelamento: number | null;
  vagas: number | null;
  reservas: number;
};
