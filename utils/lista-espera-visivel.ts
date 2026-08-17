import type { ListaEsperaRegistro } from '@/types/lista-espera';

export function isListaEsperaPendente(
  registro: Pick<ListaEsperaRegistro, 'avisado'>,
): boolean {
  return !registro.avisado;
}

export function filterListaEsperaPendentes(
  registros: ListaEsperaRegistro[],
): ListaEsperaRegistro[] {
  return registros.filter((registro) => isListaEsperaPendente(registro));
}

export function isListaEsperaVisivelUsuario(
  registro: Pick<ListaEsperaRegistro, 'dataAtividade' | 'avisado'>,
  referenceDate: Date = new Date(),
): boolean {
  if (!isListaEsperaPendente(registro)) {
    return false;
  }

  if (!registro.dataAtividade || registro.dataAtividade < referenceDate.getTime()) {
    return false;
  }

  return true;
}

export function filterListaEsperaVisivelUsuario(
  registros: ListaEsperaRegistro[],
  referenceDate: Date = new Date(),
): ListaEsperaRegistro[] {
  return registros.filter((registro) => isListaEsperaVisivelUsuario(registro, referenceDate));
}
