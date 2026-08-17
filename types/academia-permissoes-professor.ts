import type { PermissaoGestorModulo } from '@/types/academia-permissoes-gestor';

export type PermissoesProfessorItens = Partial<Record<PermissaoGestorModulo, boolean>>;

export type PermissoesProfessor = {
  itens: PermissoesProfessorItens;
};

export type AcademiaPermissoesProfessorSource = {
  permissoesGestor: { [key in PermissaoGestorModulo]?: boolean };
  permissoesProfessor: PermissoesProfessor;
};
