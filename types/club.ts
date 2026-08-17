export type Club = {
  id: number;
  created_at: number;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  jogoSimples: boolean;
  jogoDuplas: boolean;
  horaInicial: number;
  horaFinal: number;
  minutosDuracao: number;
  horasLiberacao: number;
  intervaloJogos: number;
  quadras: number;
  cancelamentoAutomatico: boolean;
  minutosCancelamento: number;
  reservaUnica: boolean;
  idBubble: string;
  ativo: boolean;
  padraoDiario: boolean;
  exigeMatricula: boolean;
  regulamento: string;
  respAdvUnicos: boolean;
  limiteCancelamento: number;
  limiteTrocaParceiros: number;
  gestor_id?: number;
  _users?: {
    id: number;
    nome: string;
    telefoneConfirmado: string;
  };
};

export type CreateClubPayload = {
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  jogoSimples: boolean;
  jogoDuplas: boolean;
  horaInicial: number;
  horaFinal: number;
  minutosDuracao: number;
  horasLiberacao: number;
  intervaloJogos: number;
  quadras: number;
  cancelamentoAutomatico: boolean;
  minutosCancelamento: number;
  reservaUnica: boolean;
  ativo: boolean;
  padraoDiario: boolean;
  exigeMatricula: boolean;
  regulamento: string;
  respAdvUnicos: boolean;
  limiteCancelamento: number;
  limiteTrocaParceiros: number;
};

export type UpdateClubPayload = CreateClubPayload;

export type ClubFormValues = {
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  quadras: string;
  minutosDuracao: string;
  horasLiberacao: string;
  intervaloJogos: string;
  minutosCancelamento: string;
  limiteCancelamento: string;
  limiteTrocaParceiros: string;
  jogoSimples: boolean;
  jogoDuplas: boolean;
  reservaUnica: boolean;
  cancelamentoAutomatico: boolean;
  respAdvUnicos: boolean;
  padraoDiario: boolean;
  exigeMatricula: boolean;
  ativo: boolean;
};

export type ClubFormFieldErrors = Partial<Record<keyof ClubFormValues, string>> & {
  general?: string;
};
