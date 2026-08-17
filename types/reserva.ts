export type ReservaResponsavelActor = {
  usersId: number;
  nome: string;
};

/** @deprecated Use ReservaResponsavelActor */
export type ReservaGestorActor = ReservaResponsavelActor;

export type CriarReservaPayload = {
  mapadiario_id: number;
  users_id: number;
  responsavel_id: number;
  responsavel: string;
};

export type CriarReservaListaEsperaPayload = CriarReservaPayload & {
  listaespera_id: number;
};

export type CancelarReservaPayload = {
  reservasId: number;
  users_id: number;
  responsavel: string;
  responsavel_id: number;
};

export type CriarReservaResponse = {
  sucesso?: boolean | string | number;
  resultadoOperacao?: number | string;
  IDReserva?: string | number | null;
  /** @deprecated Legado MatchPoint */
  jogoCriadoId?: string | number | null;
  id?: string | number | null;
  message?: string;
  mensagem?: string;
};

export type ReservaOutcome = {
  sucesso: number | null;
  message: string;
  refreshMapa: boolean;
  showModal: boolean;
};
