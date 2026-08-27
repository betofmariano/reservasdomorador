export function formatarDataHoraMatchPlace(
  valor: number | null | undefined,
  options?: { includeYear?: boolean },
): string {
  if (valor == null || !Number.isFinite(valor) || valor <= 0) {
    return '—';
  }

  const date = new Date(valor);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const datePart = options?.includeYear ? `${day}/${month}/${year}` : `${day}/${month}`;

  return `${datePart} - ${hours}:${minutes}`;
}
