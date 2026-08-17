export const GESTOR_USUARIOS_NOME_COLUMN_WIDTH = 300;
export const GESTOR_USUARIOS_TABLE_WIDTH = 990;
export const GESTOR_USUARIOS_TABLE_CENTER_MIN_WIDTH = 600;
export const GESTOR_USUARIOS_SOCIO_COLUMN_WIDTH = 90;
export const GESTOR_USUARIOS_COMPLEMENTO_COLUMN_WIDTH = 120;

export const GESTOR_USUARIOS_FLAG_COLUMN_WIDTH = 42;

export type GestorUsuariosTableColumnOptions = {
  showSocioColumn?: boolean;
  showComplementoColumn?: boolean;
  showAdministradorColumn?: boolean;
};

export function getGestorUsuariosTableWidth(
  options: GestorUsuariosTableColumnOptions = {},
): number {
  const {
    showSocioColumn = false,
    showComplementoColumn = false,
    showAdministradorColumn = false,
  } = options;

  return (
    GESTOR_USUARIOS_TABLE_WIDTH +
    GESTOR_USUARIOS_FLAG_COLUMN_WIDTH +
    (showAdministradorColumn ? GESTOR_USUARIOS_FLAG_COLUMN_WIDTH : 0) +
    (showSocioColumn ? GESTOR_USUARIOS_SOCIO_COLUMN_WIDTH : 0) +
    (showComplementoColumn ? GESTOR_USUARIOS_COMPLEMENTO_COLUMN_WIDTH : 0)
  );
}
