import type { PermissaoGestorModulo } from '@/types/academia-permissoes-gestor';
import type {
  AcademiaPermissoesUsuarioSource,
  PermissoesUsuario,
} from '@/types/academia-permissoes-usuario';
import { normalizePermissoesGestorFromApi } from '@/utils/academia-permissoes-gestor';

export function normalizePermissoesUsuarioFromApi(raw: unknown): PermissoesUsuario {
  return normalizePermissoesGestorFromApi(raw);
}

/**
 * Permissão de feature para usuário comum.
 * Chave ausente no JSON → liberado.
 * `true` → liberado; `false` → bloqueado.
 */
export function isModuloAtivoParaUsuario(
  academia: AcademiaPermissoesUsuarioSource | null | undefined,
  modulo: PermissaoGestorModulo,
): boolean {
  if (!academia) {
    return false;
  }

  const permissoes = academia.permissoesUsuario;

  if (!permissoes || !(modulo in permissoes) || permissoes[modulo] === undefined) {
    return true;
  }

  return permissoes[modulo] === true;
}
