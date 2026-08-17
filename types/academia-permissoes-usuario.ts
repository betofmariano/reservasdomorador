import type { PermissaoGestorModulo } from '@/types/academia-permissoes-gestor';

/** Mesmos módulos do gestor; ausente no JSON = liberado para o usuário comum. */
export type PermissaoUsuarioModulo = PermissaoGestorModulo;

export type PermissoesUsuario = Partial<Record<PermissaoUsuarioModulo, boolean>>;

export type AcademiaPermissoesUsuarioSource = {
  permissoesUsuario?: PermissoesUsuario | null;
};
