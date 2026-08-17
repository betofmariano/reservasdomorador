import type { Academia } from '@/types/academia';
import type { PermissaoGestorModulo } from '@/types/academia-permissoes-gestor';
import type { UserContextPermissions } from '@/types/user-context';
import { isModuloAtivoNaAcademia } from '@/utils/academia-permissoes-gestor';

export type GestorScreenPermissionKey =
  | 'podeAcessarRelatorioListaEspera'
  | 'podeAcessarMapaFrequencia'
  | 'podeAcessarListaReservasAtividade'
  | 'podeAcessarListaReservasPeriodo'
  | 'podeAcessarProgramacaoAtividades'
  | 'podeGerirLocal';

const PERMISSION_MODULO_MAP: Partial<Record<GestorScreenPermissionKey, PermissaoGestorModulo>> = {
  podeAcessarRelatorioListaEspera: 'relatorioListaEspera',
  podeAcessarMapaFrequencia: 'mapaFrequencia',
  podeAcessarListaReservasAtividade: 'listaReservasAtividade',
  podeAcessarListaReservasPeriodo: 'resumoPeriodo',
  podeAcessarProgramacaoAtividades: 'programacaoAtividades',
};

export function canAccessGestorScreen({
  isAdministrador,
  canManageSelectedAcademia,
  selectedAcademia,
  academiasId,
  permissions,
  permissionKey,
}: {
  isAdministrador: boolean;
  canManageSelectedAcademia: boolean;
  selectedAcademia: Academia | null;
  academiasId: number | null;
  permissions: UserContextPermissions;
  permissionKey: GestorScreenPermissionKey;
}): boolean {
  if (academiasId == null) {
    return false;
  }

  if (isAdministrador) {
    if (!canManageSelectedAcademia || !selectedAcademia) {
      return false;
    }

    const modulo = PERMISSION_MODULO_MAP[permissionKey];

    if (modulo) {
      return isModuloAtivoNaAcademia(selectedAcademia, modulo);
    }

    return true;
  }

  return permissions[permissionKey] === true;
}
