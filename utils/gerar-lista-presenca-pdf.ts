
export type GerarListaPresencaPdfInput = {
  localNome: string;
  atividadeNome: string;
  horario: import('@/types/presenca').HorarioPresencaOption;
  reservas: import('@/types/presenca').ReservaPresenca[];
  professorNome?: string;
};

export async function gerarListaPresencaPdf(_input: GerarListaPresencaPdfInput): Promise<void> {
  throw new Error('A geração de PDF está disponível na versão web do Reservas do Morador.');
}
