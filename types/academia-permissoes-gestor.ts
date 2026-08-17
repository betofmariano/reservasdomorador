export type PermissaoGestorModulo =
  | 'listaPresenca'
  | 'listaEspera'
  | 'listaReservas'
  | 'mapaFrequencia'
  | 'relatorioListaEspera'
  | 'programacaoAtividades'
  | 'listaReservasAtividade'
  | 'resumoPeriodo'
  | 'configuracao'
  | 'reservarParaTerceiro';

export type PermissoesGestor = Partial<Record<PermissaoGestorModulo, boolean>>;

export type AcademiaPermissoesSource = {
  permissoesGestor: PermissoesGestor;
};
