import type { CreateUsersBloqueadosPayload } from '@/types/users-bloqueados';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function buildCreateUsersBloqueadosPayload(input: {
  userslocalId: number;
  usersId: number;
  atividadesId: number;
  dias: number;
  dataInicio?: number;
}): CreateUsersBloqueadosPayload {
  const dataInicio = input.dataInicio ?? Date.now();
  const dataFinal = dataInicio + input.dias * MS_PER_DAY;

  return {
    userslocal_id: input.userslocalId,
    users_id: input.usersId,
    atividades_id: input.atividadesId,
    dataInicio,
    dataFinal,
    dias: input.dias,
  };
}
