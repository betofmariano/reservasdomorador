export const GESTOR_USUARIOS_NOME_COLUMN_WIDTH = 350;
export const GESTOR_USUARIOS_TELEFONE_COLUMN_WIDTH = 130;
export const GESTOR_USUARIOS_ENDERECO_COLUMN_WIDTH = 300;
export const GESTOR_USUARIOS_FLAG_COLUMN_WIDTH = 42;
export const GESTOR_USUARIOS_ACTIONS_COLUMN_WIDTH = 110;
export const GESTOR_USUARIOS_ULTIMA_ENTRADA_COLUMN_WIDTH = 120;
export const GESTOR_USUARIOS_SOCIO_COLUMN_WIDTH = 90;
export const GESTOR_USUARIOS_TABLE_COLUMN_GAP = 8;
export const GESTOR_USUARIOS_TABLE_HORIZONTAL_PADDING = 16;
export const GESTOR_USUARIOS_TABLE_CENTER_MIN_WIDTH = 600;

const BASE_COLUMN_COUNT = 7;
const BASE_COLUMN_WIDTH =
  GESTOR_USUARIOS_NOME_COLUMN_WIDTH +
  GESTOR_USUARIOS_TELEFONE_COLUMN_WIDTH +
  GESTOR_USUARIOS_FLAG_COLUMN_WIDTH * 3 +
  GESTOR_USUARIOS_ACTIONS_COLUMN_WIDTH +
  GESTOR_USUARIOS_ULTIMA_ENTRADA_COLUMN_WIDTH;

export type GestorUsuariosTableColumnOptions = {
  showSocioColumn?: boolean;
  showEnderecoColumn?: boolean;
  showAdministradorColumn?: boolean;
};

export function getGestorUsuariosTableWidth(
  options: GestorUsuariosTableColumnOptions = {},
): number {
  const {
    showSocioColumn = false,
    showEnderecoColumn = false,
    showAdministradorColumn = false,
  } = options;

  let extraWidth = 0;
  let extraColumns = 0;

  if (showAdministradorColumn) {
    extraWidth += GESTOR_USUARIOS_FLAG_COLUMN_WIDTH;
    extraColumns += 1;
  }

  if (showSocioColumn) {
    extraWidth += GESTOR_USUARIOS_SOCIO_COLUMN_WIDTH;
    extraColumns += 1;
  }

  if (showEnderecoColumn) {
    extraWidth += GESTOR_USUARIOS_ENDERECO_COLUMN_WIDTH;
    extraColumns += 1;
  }

  const columnCount = BASE_COLUMN_COUNT + extraColumns;

  return (
    BASE_COLUMN_WIDTH +
    extraWidth +
    GESTOR_USUARIOS_TABLE_COLUMN_GAP * (columnCount - 1) +
    GESTOR_USUARIOS_TABLE_HORIZONTAL_PADDING
  );
}

export const GESTOR_USUARIOS_TABLE_WIDTH = getGestorUsuariosTableWidth();
