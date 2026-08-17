export function formatHorarioLabel(hora: number, minutos: number): string {
  const hours = String(hora).padStart(2, '0');
  const mins = String(minutos).padStart(2, '0');

  return `${hours}:${mins}`;
}
