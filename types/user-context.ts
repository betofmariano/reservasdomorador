import type { Academia } from '@/types/academia';
import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';

export type UserContextPermissions = {
  administrador: boolean;
  gestor: boolean;
  professor: boolean;
  aprovado: boolean;
  bloqueado: boolean;
  podeGerirLocal: boolean;
  podeAcessarListaPresenca: boolean;
  podeVerListaPresencaNaHome: boolean;
  podeAcessarListaReservasAtividade: boolean;
  podeAcessarListaReservasPeriodo: boolean;
  podeAcessarConfiguracaoLocal: boolean;
  podeAcessarProgramacaoAtividades: boolean;
  podeAcessarMapaFrequencia: boolean;
  podeAcessarRelatorioListaEspera: boolean;
  podeAcessarListaEspera: boolean;
  podeVerListaEsperaNaHome: boolean;
  podeAcessarListaReservas: boolean;
  podeUsarLocal: boolean;
};

export type UserLocalSummary = {
  id: number;
  academias_id: number;
  academiaNome: string;
  aprovado: boolean;
  gestor: boolean;
  professor: boolean;
  bloqueado: boolean;
};

export type UserContextState = {
  user: User | null;
  currentUserLocal: UserLocalAssociation | null;
  currentAcademia: Pick<
    Academia,
    | 'id'
    | 'nome'
    | 'mensalSemana'
    | 'permissoesGestor'
    | 'permissoesProfessor'
    | 'permissoesUsuario'
  > | null;
  userLocals: UserLocalSummary[];
  /** Associações válidas (aprovadas, ativas) elegíveis para seleção de local prioritário. */
  selectableUserLocals: UserLocalSummary[];
  permissions: UserContextPermissions;
  effectiveAcademiasId: number | null;
  requiresLocalSelection: boolean;
  isLoading: boolean;
  error: string | null;
};

export type BuildUserContextInput = {
  user: User;
  associations: UserLocalAssociation[];
  academias: Academia[];
  sessionAcademiasId?: number | null;
};

export const EMPTY_USER_CONTEXT_PERMISSIONS: UserContextPermissions = {
  administrador: false,
  gestor: false,
  professor: false,
  aprovado: false,
  bloqueado: false,
  podeGerirLocal: false,
  podeAcessarListaPresenca: false,
  podeVerListaPresencaNaHome: false,
  podeAcessarListaReservasAtividade: false,
  podeAcessarListaReservasPeriodo: false,
  podeAcessarConfiguracaoLocal: false,
  podeAcessarProgramacaoAtividades: false,
  podeAcessarMapaFrequencia: false,
  podeAcessarRelatorioListaEspera: false,
  podeAcessarListaEspera: false,
  podeVerListaEsperaNaHome: false,
  podeAcessarListaReservas: false,
  podeUsarLocal: false,
};
