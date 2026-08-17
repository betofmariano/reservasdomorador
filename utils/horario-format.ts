export function formatHorarioDisplay(hora: number, minutos: number): string {
  return `${String(hora).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

export function formatHorarioHHmm(hora: number, minutos: number): string {
  return formatHorarioDisplay(hora, minutos);
}

export function buildHorarioTexto(hora: number, minutos: number): string {
  return `${hora}:${String(minutos).padStart(2, '0')}`;
}

export function compareHorarios(
  a: { hora: number; minutos: number },
  b: { hora: number; minutos: number },
): number {
  if (a.hora !== b.hora) {
    return a.hora - b.hora;
  }

  return a.minutos - b.minutos;
}

export function sortHorariosByTime<T extends { hora: number; minutos: number }>(items: T[]): T[] {
  return [...items].sort(compareHorarios);
}

export function horariosMatchTime(
  a: { hora: number; minutos: number },
  b: { hora: number; minutos: number },
): boolean {
  return a.hora === b.hora && a.minutos === b.minutos;
}
