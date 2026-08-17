import { formatHorarioLabel } from '@/utils/format-horario-label';

const MS_PER_HOUR = 60 * 60 * 1000;

export type PresencaDateWindow = {
  inicio: number;
  fim: number;
};

export function getPresencaDateWindow(referenceDate: Date = new Date()): PresencaDateWindow {
  const now = referenceDate.getTime();

  return {
    inicio: now - MS_PER_HOUR * 24,
    fim: now + MS_PER_HOUR * 24,
  };
}

export function isTimestampWithinPresencaWindow(
  timestamp: number,
  referenceDate: Date = new Date(),
): boolean {
  const { inicio, fim } = getPresencaDateWindow(referenceDate);

  return timestamp >= inicio && timestamp <= fim;
}

export function formatPresencaDataLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatPresencaDataCurtaLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}/${month}`;
}

export function formatPresencaHorarioLabel(timestamp: number): string {
  const date = new Date(timestamp);

  return formatHorarioLabel(date.getHours(), date.getMinutes());
}

export function formatPresencaDataHoraDescricao(timestamp: number): string {
  return `${formatPresencaDataCurtaLabel(timestamp)} - ${formatPresencaHorarioLabel(timestamp)}`;
}

export function timestampToIsoDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function buildPresencaPdfFilename(
  atividadeSlug: string,
  dataIso: string,
  horario: string,
): string {
  const horarioSlug = horario.replace(':', '-');

  return `lista-presenca-${atividadeSlug}-${dataIso}-${horarioSlug}.pdf`;
}

export function slugifyPresencaFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
