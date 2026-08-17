export type ClubUserOption = {
  users_id: number;
  nome: string;
  matricula?: string;
  foto?: string | null;
};

export type SelectedClubUser = {
  users_id: number;
  nome: string;
};

export type PlayerFieldKey = 'responsavel' | 'adversario' | 'parceiro1' | 'parceiro2';

export type SaveGamePlayersSimplesPayload = {
  jogoDuplas: false;
  jogos_id: number;
  responsavel_id: number;
  adversario_id: number;
};

export type SaveGamePlayersDuplasPayload = {
  jogoDuplas: true;
  jogos_id: number;
  responsavel_id: number;
  adversario_id: number;
  parceiro1_id: number;
  parceiro2_id: number;
};

export type SaveGamePlayersPayload =
  | SaveGamePlayersSimplesPayload
  | SaveGamePlayersDuplasPayload;

export type SaveGamePlayersResponse = boolean;

export type ClearGamePlayersSelectionPayload = {
  jogos_id: number;
};

export type GamePlayersFormState = {
  responsavel: SelectedClubUser | null;
  adversario: SelectedClubUser | null;
  parceiro1: SelectedClubUser | null;
  parceiro2: SelectedClubUser | null;
  jogoDuplas: boolean;
};
