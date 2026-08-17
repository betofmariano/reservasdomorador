export type UserLocalAssociation = {
  id: number;
  nome: string;
  ultimoAcesso: number | null;
  users_id: number;
  academias_id: number;
  aprovado: boolean;
  /** @deprecated Permissão global fica em users.administrador; mantido por compatibilidade Bubble. */
  administrador: boolean;
  gestor: boolean;
  professor: boolean;
  bloqueado: boolean;
  cienteCancelamento: boolean;
  matricula: string;
  socioTitulo: string;
  complemento: string;
  dataRegulamento: number | null;
};

export type UserLocalAssociationsResponse = UserLocalAssociation[];

/** @deprecated Use UserLocalAssociationsResponse */
export type ClubesUsuarioResponse = UserLocalAssociationsResponse;

export type CreateUserLocalPayload = {
  users_id: number;
  academias_id: number;
  nome: string;
};

export type CreateUserLocalResponse = UserLocalAssociation;

export type AssociatedLocalDisplay = {
  association: UserLocalAssociation;
  nome: string;
  cidade?: string;
  logoUrl?: string;
};

/** @deprecated Use AssociatedLocalDisplay */
export type AssociatedClubDisplay = AssociatedLocalDisplay;
