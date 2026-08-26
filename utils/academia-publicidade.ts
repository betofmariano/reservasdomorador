import { APP_OCULTAR_PATROCINADORES } from '@/constants/app-branding';
import type { Academia } from '@/types/academia';
import type { User } from '@/types/user';
import { isUserAdministrador, isUserGestor, isUserProfessor } from '@/utils/club-config';

export function findAcademiaById(academias: Academia[], academiasId: number): Academia | null {
  return academias.find((academia) => academia.id === academiasId) ?? null;
}

export function isAcademiaSemPublicidade(academia: Academia | null | undefined): boolean {
  return APP_OCULTAR_PATROCINADORES || academia?.semPublicidade === true;
}

export function isUserSemPublicidade(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  return isUserAdministrador(user) || isUserGestor(user) || isUserProfessor(user);
}

export function shouldOcultarPublicidade(
  user: User | null | undefined,
  academiaSemPublicidade: boolean,
): boolean {
  return APP_OCULTAR_PATROCINADORES || academiaSemPublicidade || isUserSemPublicidade(user);
}
