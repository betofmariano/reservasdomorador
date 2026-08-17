import type { ListaUsuariosSuspensosOrdem } from '@/types/users-bloqueados';
import type { UsersBloqueadoRegistro } from '@/types/users-bloqueados';

export type GerarListaUsuariosSuspensosPdfInput = {
  localNome: string;
  atividadeNome: string;
  statusLabel: string;
  ordemLabel: string;
  ordem: ListaUsuariosSuspensosOrdem;
  registros: UsersBloqueadoRegistro[];
};

export async function gerarListaUsuariosSuspensosPdf(
  _input: GerarListaUsuariosSuspensosPdfInput,
): Promise<void> {
  throw new Error('A geração de PDF está disponível apenas na versão web.');
}
