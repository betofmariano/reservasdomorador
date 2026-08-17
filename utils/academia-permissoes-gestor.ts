import type {
  AcademiaPermissoesSource,
  PermissaoGestorModulo,
  PermissoesGestor,
} from '@/types/academia-permissoes-gestor';
import { normalizeBoolean } from '@/utils/normalize-api-fields';

const PERMISSAO_GESTOR_MODULOS: PermissaoGestorModulo[] = [
  'listaPresenca',
  'listaEspera',
  'listaReservas',
  'mapaFrequencia',
  'relatorioListaEspera',
  'programacaoAtividades',
  'listaReservasAtividade',
  'resumoPeriodo',
  'configuracao',
  'reservarParaTerceiro',
];

const PERMISSAO_GESTOR_API_ALIASES: Partial<Record<PermissaoGestorModulo, string[]>> = {
  listaReservas: ['ListaReservas'],
  resumoPeriodo: ['ResumoPeriodo'],
  configuracao: ['Configuracao'],
  reservarParaTerceiro: ['ReservarParaTerceiro', 'reservar_para_terceiro'],
};

const GESTOR_ROUTE_MODULOS: Partial<Record<string, PermissaoGestorModulo>> = {
  '/lista-presenca': 'listaPresenca',
  '/lista-reservas': 'listaReservas',
  '/lista-reservas-atividade': 'listaReservasAtividade',
  '/lista-reservas-periodo': 'resumoPeriodo',
  '/programacao-atividades': 'programacaoAtividades',
  '/relatorio-lista-espera': 'relatorioListaEspera',
  '/mapa-frequencia': 'mapaFrequencia',
  '/configuracao-local': 'configuracao',
};

export function normalizePermissoesGestorFromApi(raw: unknown): PermissoesGestor {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const record = raw as Record<string, unknown>;
  const permissoes: PermissoesGestor = {};

  for (const modulo of PERMISSAO_GESTOR_MODULOS) {
    const aliases = PERMISSAO_GESTOR_API_ALIASES[modulo] ?? [];
    const rawValue =
      modulo in record
        ? record[modulo]
        : aliases.map((alias) => record[alias]).find((value) => value !== undefined);

    if (rawValue !== undefined) {
      permissoes[modulo] = normalizeBoolean(rawValue);
    }
  }

  return permissoes;
}

export function isModuloAtivoNaAcademia(
  academia: AcademiaPermissoesSource,
  modulo: PermissaoGestorModulo,
): boolean {
  return academia.permissoesGestor?.[modulo] === true;
}

export function isGestorMenuRouteEnabled(
  route: string,
  academia: AcademiaPermissoesSource | null | undefined,
): boolean {
  if (!academia) {
    return false;
  }

  const modulo = GESTOR_ROUTE_MODULOS[route];

  if (!modulo) {
    return true;
  }

  return isModuloAtivoNaAcademia(academia, modulo);
}
