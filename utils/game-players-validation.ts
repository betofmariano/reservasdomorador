import type { GamePlayersFormState, PlayerFieldKey, SelectedClubUser } from '@/types/game-players';

const DUPLICATE_MESSAGE = 'Este jogador já foi selecionado.';

export function getExcludedIdsForField(
  form: GamePlayersFormState,
  field: PlayerFieldKey,
  isGestor: boolean,
  currentUserId: number,
): number[] {
  const ids: number[] = [];

  if (isGestor) {
    if (field !== 'responsavel' && form.responsavel) {
      ids.push(form.responsavel.users_id);
    }
  } else if (field !== 'responsavel') {
    ids.push(currentUserId);
  }

  if (field !== 'adversario' && form.adversario) {
    ids.push(form.adversario.users_id);
  }

  if (form.jogoDuplas) {
    if (field !== 'parceiro1' && form.parceiro1) {
      ids.push(form.parceiro1.users_id);
    }

    if (field !== 'parceiro2' && form.parceiro2) {
      ids.push(form.parceiro2.users_id);
    }
  }

  return ids;
}

export function validateGamePlayersForm(
  form: GamePlayersFormState,
  isGestor: boolean,
  currentUserId: number,
): string | null {
  const responsavelId = isGestor ? form.responsavel?.users_id : currentUserId;

  if (!responsavelId) {
    return 'Selecione o responsável.';
  }

  if (!form.adversario) {
    return 'Selecione o adversário.';
  }

  if (!isGestor && form.adversario.users_id === currentUserId) {
    return DUPLICATE_MESSAGE;
  }

  if (form.jogoDuplas) {
    if (!form.parceiro1) {
      return 'Selecione o parceiro 1.';
    }

    if (!form.parceiro2) {
      return 'Selecione o parceiro 2.';
    }
  }

  const participantIds: number[] = [responsavelId, form.adversario.users_id];

  if (form.jogoDuplas) {
    participantIds.push(form.parceiro1!.users_id, form.parceiro2!.users_id);
  }

  const uniqueIds = new Set(participantIds);

  if (uniqueIds.size !== participantIds.length) {
    return DUPLICATE_MESSAGE;
  }

  return null;
}

export function isGamePlayersFormReadyToSave(
  form: GamePlayersFormState,
  isGestor: boolean,
): boolean {
  if (isGestor && !form.responsavel) {
    return false;
  }

  if (!form.adversario) {
    return false;
  }

  if (form.jogoDuplas) {
    return Boolean(form.parceiro1 && form.parceiro2);
  }

  return true;
}

export function createInitialFormState(
  jogoDuplas: boolean,
  isGestor: boolean,
  currentUser: SelectedClubUser | null,
): GamePlayersFormState {
  return {
    responsavel: isGestor ? null : currentUser,
    adversario: null,
    parceiro1: null,
    parceiro2: null,
    jogoDuplas,
  };
}

export function canChangeJogoDuplasToggle(clubeJogoSimples: boolean, clubeJogoDuplas: boolean): boolean {
  return clubeJogoSimples && clubeJogoDuplas;
}

export function resolveJogoDuplasForClub(
  jogoDuplas: boolean,
  clubeJogoSimples: boolean,
  clubeJogoDuplas: boolean,
): boolean {
  if (!clubeJogoSimples && clubeJogoDuplas) {
    return true;
  }

  if (clubeJogoSimples && !clubeJogoDuplas) {
    return false;
  }

  return jogoDuplas;
}

export const GAME_PLAYERS_DUPLICATE_MESSAGE = DUPLICATE_MESSAGE;

export const GAME_PLAYERS_RESERVATION_CONFLICT_MESSAGE =
  'Não foi possível adicionar em razão do adversário ou um dos parceiros (em caso de duplas) já estar em outra reserva dentro do período permitido';
