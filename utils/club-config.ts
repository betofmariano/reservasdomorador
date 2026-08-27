import type { Academia } from '@/types/academia';
import type { Club, ClubFormFieldErrors, ClubFormValues, UpdateClubPayload } from '@/types/club';
import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';

import {
  buildCreateClubPayload,
  CLUB_FORM_MESSAGES,
  createInitialClubFormValues,
  validateClubForm,
} from '@/utils/club-form';
import { sortByClubNome } from '@/utils/club-sort';
import { resolvesEffectiveGestor } from '@/utils/user-local-roles';

export const CLUB_CONFIG_MESSAGES = {
  loadError: 'Não foi possível carregar os dados do clube.',
  updateError: 'Não foi possível atualizar o clube. Tente novamente.',
  updateSuccess: 'Configuração do clube atualizada com sucesso.',
  permissionView: 'Você não tem permissão para configurar este clube.',
  permissionSave: 'Você não tem permissão para alterar este clube.',
  unsavedTitle: 'Alterações não salvas',
  unsavedMessage: 'Deseja sair sem salvar as alterações?',
};

export const CLUB_ADMIN_MESSAGES = {
  permission: 'Você não tem permissão para administrar este clube.',
  loadError: 'Não foi possível carregar os dados.',
  unsavedTitle: 'Alterações não salvas',
  unsavedMessage: 'Deseja sair sem salvar as alterações?',
};

function parseOptionalNonNegativeNumber(value: string): number {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : NaN;
}

function parseRequiredPositiveNumber(value: string): number {
  const parsed = parseOptionalNonNegativeNumber(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : NaN;
}

function normalizeRecordId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeBoolean(value: unknown): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }

  return false;
}

export function isUserAdministrador(user: User): boolean {
  return normalizeBoolean(user.administrador);
}

export function isUserGestor(user: User): boolean {
  return normalizeBoolean(user.gestor);
}

export function isUserProfessor(user: User): boolean {
  return normalizeBoolean(user.professor);
}

export function canAccessAdministracaoPage(user: User): boolean {
  return isUserGestor(user);
}

export function canAccessAdministracaoSistema(user: User): boolean {
  return isUserAdministrador(user);
}

export function canAccessAdministracaoAcademia(user: User): boolean {
  return isUserGestor(user) || isUserAdministrador(user);
}

export function canAccessAdministracaoAcademiaWithAssociations(
  user: User,
  associations: UserLocalAssociation[] = [],
): boolean {
  if (canAccessAdministracaoAcademia(user)) {
    return true;
  }

  return canShowAdministracaoEntryFromAssociations(user, associations);
}

export function canShowAdministracaoEntry(user: User): boolean {
  return canAccessAdministracaoPage(user) || canAccessAdministracaoSistema(user);
}

export function getAdministracaoEntryButtonLabel(user: User): string {
  return isUserAdministrador(user) ? 'Administração' : 'Gestão';
}

export function canShowAdministracaoEntryFromAssociations(
  user: User,
  associations: UserLocalAssociation[],
): boolean {
  if (canShowAdministracaoEntry(user)) {
    return true;
  }

  return associations.some(
    (association) =>
      normalizeRecordId(association.users_id) === user.id && resolvesEffectiveGestor(association),
  );
}

export function shouldShowUsuariosInHeaderMenu(user: User): boolean {
  if (isUserGestor(user) || isUserAdministrador(user)) {
    return false;
  }

  return true;
}

export function getAcademiaGestorUserId(club: Club): number | null {
  const gestorId = normalizeRecordId(club.gestor_id);

  if (gestorId != null && gestorId > 0) {
    return gestorId;
  }

  const linkedGestorId = normalizeRecordId(club._users?.id);

  if (linkedGestorId != null && linkedGestorId > 0) {
    return linkedGestorId;
  }

  return null;
}

export function userHasAcademiaAssociation(
  user: User,
  clubId: number,
  associations: UserLocalAssociation[] = [],
): boolean {
  const normalizedClubId = normalizeRecordId(clubId);

  if (normalizedClubId == null) {
    return false;
  }

  if (normalizeRecordId(user.academias_id) === normalizedClubId) {
    return true;
  }

  return associations.some((association) => {
    const associationUserId = normalizeRecordId(association.users_id);
    const associationClubId = normalizeRecordId(association.academias_id);

    return associationUserId === user.id && associationClubId === normalizedClubId;
  });
}

export function isUserGestorOfAcademiaFromAssociation(
  user: User,
  clubId: number,
  associations: UserLocalAssociation[],
): boolean {
  const normalizedClubId = normalizeRecordId(clubId);

  if (normalizedClubId == null) {
    return false;
  }

  return associations.some((association) => {
    const associationUserId = normalizeRecordId(association.users_id);
    const associationClubId = normalizeRecordId(association.academias_id);

    return (
      associationUserId === user.id &&
      associationClubId === normalizedClubId &&
      resolvesEffectiveGestor(association)
    );
  });
}

export function isUserGestorOfAcademia(
  user: User,
  club: Club,
  associations: UserLocalAssociation[] = [],
): boolean {
  const clubGestorUserId = getAcademiaGestorUserId(club);

  if (clubGestorUserId != null && user.id === clubGestorUserId) {
    return true;
  }

  return isUserGestorOfAcademiaFromAssociation(user, club.id, associations);
}

export function getManagedAcademiaIdsForUser(
  user: User,
  associations: UserLocalAssociation[] = [],
): number[] {
  const userAssociations = associations.filter(
    (association) => normalizeRecordId(association.users_id) === user.id,
  );

  const gestorIds = userAssociations
    .filter((association) => resolvesEffectiveGestor(association))
    .map((association) => normalizeRecordId(association.academias_id))
    .filter((id): id is number => id != null && id > 0);

  const uniqueGestorIds = [...new Set(gestorIds)];

  if (uniqueGestorIds.length > 0) {
    return uniqueGestorIds;
  }

  if (!isUserGestor(user) || userAssociations.length !== 1) {
    return [];
  }

  const onlyId = normalizeRecordId(userAssociations[0]?.academias_id);
  return onlyId != null && onlyId > 0 ? [onlyId] : [];
}

export function canManageAcademia(
  user: User,
  academiasId: number,
  associations: UserLocalAssociation[] = [],
): boolean {
  if (isUserAdministrador(user)) {
    return true;
  }

  const normalizedClubId = normalizeRecordId(academiasId);

  if (normalizedClubId == null) {
    return false;
  }

  return getManagedAcademiaIdsForUser(user, associations).includes(normalizedClubId);
}

/** @deprecated Use canManageAcademia */
export function canManageClub(
  user: User,
  club: Club,
  associations: UserLocalAssociation[] = [],
): boolean {
  return canManageAcademia(user, club.id, associations);
}

export function filterAcademiasForConfiguration(
  user: User,
  academias: Academia[],
  associations: UserLocalAssociation[] = [],
): Academia[] {
  if (isUserAdministrador(user)) {
    return sortByClubNome(academias);
  }

  return sortByClubNome(
    academias.filter((academia) => canManageAcademia(user, academia.id, associations)),
  );
}

/** @deprecated Use filterAcademiasForConfiguration */
export function filterClubsForConfiguration(
  user: User,
  clubs: Club[],
  associations: UserLocalAssociation[] = [],
): Club[] {
  if (isUserAdministrador(user)) {
    return sortByClubNome(clubs);
  }

  return sortByClubNome(clubs.filter((club) => canManageAcademia(user, club.id, associations)));
}

export function canAccessAcademiaConfiguration(
  user: User,
  academias: Academia[],
  associations: UserLocalAssociation[] = [],
): boolean {
  if (isUserAdministrador(user) || isUserGestor(user)) {
    return true;
  }

  if (canShowAdministracaoEntryFromAssociations(user, associations)) {
    return true;
  }

  return filterAcademiasForConfiguration(user, academias, associations).length > 0;
}

export function clubToFormValues(club: Club): ClubFormValues {
  return {
    nome: club.nome ?? '',
    endereco: club.endereco ?? '',
    cidade: club.cidade ?? '',
    estado: club.estado ?? '',
    quadras: String(club.quadras ?? ''),
    minutosDuracao: String(club.minutosDuracao ?? ''),
    horasLiberacao: String(club.horasLiberacao ?? ''),
    intervaloJogos: String(club.intervaloJogos ?? ''),
    minutosCancelamento: String(club.minutosCancelamento ?? ''),
    limiteCancelamento: String(club.limiteCancelamento ?? ''),
    limiteTrocaParceiros: String(club.limiteTrocaParceiros ?? ''),
    jogoSimples: club.jogoSimples === true,
    jogoDuplas: club.jogoDuplas === true,
    reservaUnica: club.reservaUnica === true,
    cancelamentoAutomatico: club.cancelamentoAutomatico === true,
    respAdvUnicos: club.respAdvUnicos === true,
    padraoDiario: club.padraoDiario === true,
    exigeMatricula: club.exigeMatricula === true,
    ativo: club.ativo === true,
  };
}

export function validateClubConfigForm(values: ClubFormValues): ClubFormFieldErrors {
  const errors = validateClubForm(values);

  const minutosDuracao = parseRequiredPositiveNumber(values.minutosDuracao);

  if (!Number.isFinite(minutosDuracao)) {
    errors.minutosDuracao = 'Informe a duração dos jogos em minutos.';
    errors.general = CLUB_FORM_MESSAGES.general;
  }

  return errors;
}

export function buildUpdateClubPayload(values: ClubFormValues, originalClub: Club): UpdateClubPayload {
  const basePayload = buildCreateClubPayload(values);

  return {
    ...basePayload,
    minutosDuracao: parseRequiredPositiveNumber(values.minutosDuracao),
    horaInicial: originalClub.horaInicial,
    horaFinal: originalClub.horaFinal,
    regulamento: originalClub.regulamento ?? '',
  };
}

export function hasClubFormChanges(current: ClubFormValues, original: ClubFormValues): boolean {
  return JSON.stringify(current) !== JSON.stringify(original);
}

export function createEmptyClubFormValues(): ClubFormValues {
  return createInitialClubFormValues();
}
