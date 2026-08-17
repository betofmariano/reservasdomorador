import type { ListaPresencaSortMode, ReservaPresenca } from '@/types/presenca';

export function sortReservasPresenca(
  reservas: ReservaPresenca[],
  mode: ListaPresencaSortMode,
): ReservaPresenca[] {
  const items = [...reservas];

  if (mode === 'nome') {
    return items.sort((a, b) =>
      a.nomeUsuario.localeCompare(b.nomeUsuario, 'pt-BR', { sensitivity: 'base' }),
    );
  }

  return items.sort((a, b) => a.reservaId - b.reservaId);
}
