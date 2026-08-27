import type { PermissaoGestorModulo } from '@/types/academia-permissoes-gestor';
import type {
  AcademiaPermissoesProfessorSource,
  PermissoesProfessor,
  PermissoesProfessorItens,
} from '@/types/academia-permissoes-professor';
import {
  isModuloAtivoNaAcademia,
  normalizePermissoesGestorFromApi,
} from '@/utils/academia-permissoes-gestor';

export type ProfessorHomeMenuItem = {
  modulo: PermissaoGestorModulo;
  label: string;
  route: string;
  icon: 'calendar-outline';
};

const PROFESSOR_HOME_MENU_ITEMS: ProfessorHomeMenuItem[] = [
  {
    modulo: 'listaReservas',
    label: 'Lista de Reservas',
    route: '/lista-reservas',
    icon: 'calendar-outline',
  },
];

export function normalizePermissoesProfessorFromApi(raw: unknown): PermissoesProfessor {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { itens: {} };
  }

  const record = raw as Record<string, unknown>;
  const itens = normalizePermissoesGestorFromApi(record.itens) as PermissoesProfessorItens;

  return { itens };
}

export function isModuloAtivoParaProfessor(
  academia: AcademiaPermissoesProfessorSource | null | undefined,
  modulo: PermissaoGestorModulo,
): boolean {
  if (!academia) {
    return false;
  }

  return (
    isModuloAtivoNaAcademia(academia, modulo) && academia.permissoesProfessor?.itens?.[modulo] === true
  );
}

export function getProfessorHomeMenuItems(
  academia: AcademiaPermissoesProfessorSource,
): ProfessorHomeMenuItem[] {
  return PROFESSOR_HOME_MENU_ITEMS.filter((item) => isModuloAtivoParaProfessor(academia, item.modulo));
}
