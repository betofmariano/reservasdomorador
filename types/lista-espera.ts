export type ListaEsperaRegistro = {
  id: number;
  created_at: number;
  academias_id: number;
  atividades_id: number;
  atividade: string;
  dataAtividade: number | null;
  nome: string;
  users_id: number;
  email: string;
  telefone: string;
  avisar: boolean;
  avisado: boolean;
  horaAviso: number | null;
  _users?: {
    nome: string;
  } | null;
};

export type ListaEsperaResponse = ListaEsperaRegistro[];

export type CreateListaEsperaPayload = {
  academias_id: number;
  atividades_id: number;
  atividade: string;
  dataAtividade: number;
  users_id: number;
  nome: string;
  telefone: string;
  email?: string;
};

export type CreateListaEsperaResponse = ListaEsperaRegistro;

export type ListaEsperaDisplay = {
  registro: ListaEsperaRegistro;
  localNome: string;
};

export type AssociatedClubOption = {
  id: number;
  nome: string;
  cidade?: string;
};
