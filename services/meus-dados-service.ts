import { ApiError } from '@/services/api-client';
import { alterarNomeUsuario } from '@/services/alterar-nome-service';
import { findUserLocalAssociationForAcademia, getUserLocalAssociations } from '@/services/user-local-service';
import { updateUsersLocalRecord } from '@/services/usuario-gestor-service';
import type { User } from '@/types/user';
import { formatRegisteredPersonName } from '@/utils/meus-dados';
import { resolveLegacyUserAcademiasId } from '@/utils/user-legacy-compat';

function resolveMeusDadosAcademiasId(user: User, effectiveAcademiasId?: number | null): number {
  return resolveLegacyUserAcademiasId(user, effectiveAcademiasId ?? user.localPrioritario);
}

export { resolveMeusDadosAcademiasId };

export async function getUserComplementoFromRecords(
  user: User,
  academiasId?: number,
): Promise<string> {
  const resolvedAcademiasId = academiasId ?? resolveMeusDadosAcademiasId(user);

  if (resolvedAcademiasId <= 0) {
    return '';
  }

  const associations = await getUserLocalAssociations(user.id);
  const association = findUserLocalAssociationForAcademia(associations, resolvedAcademiasId);

  return association?.endereco ?? '';
}

export async function updateUserComplementoInRecords(
  user: User,
  complemento: string,
  authToken: string,
  academiasId?: number,
): Promise<string> {
  const normalizedComplemento = complemento.trim();
  const resolvedAcademiasId = academiasId ?? resolveMeusDadosAcademiasId(user);
  const associations = await getUserLocalAssociations(user.id);
  const association = findUserLocalAssociationForAcademia(associations, resolvedAcademiasId);

  if (!association) {
    throw new ApiError('Não foi possível identificar seu cadastro no clube.');
  }

  await updateUsersLocalRecord(
    association.id,
    {
      endereco: normalizedComplemento,
    },
    authToken,
  );

  return normalizedComplemento;
}

export async function updateUserNameInRecords(
  user: User,
  nomeUsuario: string,
  authToken: string,
): Promise<string> {
  return alterarNomeUsuario(user.id, nomeUsuario, authToken);
}

export async function registerUltimoAcessoOnHome(user: User, authToken: string): Promise<void> {
  const associations = await getUserLocalAssociations(user.id);
  const association = findUserLocalAssociationForAcademia(
    associations,
    resolveMeusDadosAcademiasId(user),
  );

  if (!association) {
    throw new ApiError('Associação userslocal não encontrada para atualizar ultimoAcesso.');
  }

  await updateUsersLocalRecord(
    association.id,
    {
      ultimoAcesso: Date.now(),
    },
    authToken,
  );
}
