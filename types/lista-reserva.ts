export type ListaReservaItem = {
  id: number;
  users_id: number;
  dataAtividade: number;
  academias_id: number;
  atividades_id: number;
  localNome: string;
  atividade: string;
  usuarioNome: string;
  responsavelNome: string | null;
  atividadeunidade_id: number | null;
  unidadeNome: string | null;
  cancelado: boolean;
  limiteCancelamento: number | null;
  usaMensalPorSemana: boolean;
  mapadiariodamha_id: number;
};
