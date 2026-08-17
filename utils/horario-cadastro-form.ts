import type { Horario, HorarioDiaKey, HorarioDiasSemana } from '@/types/horario';
import { compareHorarios, formatHorarioDisplay } from '@/utils/horario-format';

export type HorarioCadastroDiasSemana = HorarioDiasSemana;

export const HORARIO_DIAS_SEMANA_OPTIONS: Array<{ key: HorarioDiaKey; label: string }> = [
  { key: 'segunda', label: 'Segunda Feira' },
  { key: 'terca', label: 'Terça Feira' },
  { key: 'quarta', label: 'Quarta Feira' },
  { key: 'quinta', label: 'Quinta Feira' },
  { key: 'sexta', label: 'Sexta Feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

export const EMPTY_HORARIO_DIAS_SEMANA: HorarioCadastroDiasSemana = {
  segunda: false,
  terca: false,
  quarta: false,
  quinta: false,
  sexta: false,
  sabado: false,
  domingo: false,
};

export function createEmptyHorarioDiasSemana(): HorarioCadastroDiasSemana {
  return { ...EMPTY_HORARIO_DIAS_SEMANA };
}

export function hasSelectedHorarioDia(dias: HorarioCadastroDiasSemana): boolean {
  return HORARIO_DIAS_SEMANA_OPTIONS.some((option) => dias[option.key]);
}

export function formatHorarioDiasResumo(dias: HorarioCadastroDiasSemana): string {
  const selected = HORARIO_DIAS_SEMANA_OPTIONS.filter((option) => dias[option.key]).map(
    (option) => option.label,
  );

  return selected.length > 0 ? selected.join(', ') : 'Nenhum dia';
}

export function formatHorarioListLabel(horario: Horario): string {
  return `${formatHorarioDisplay(horario.hora, horario.minutos)} • ${formatHorarioDiasResumo(horario)}`;
}

export function horariosHaveSameSchedule(
  a: Pick<Horario, 'atividades_id' | 'hora' | 'minutos'> & HorarioDiasSemana,
  b: Pick<Horario, 'atividades_id' | 'hora' | 'minutos'> & HorarioDiasSemana,
): boolean {
  if (a.atividades_id !== b.atividades_id || a.hora !== b.hora || a.minutos !== b.minutos) {
    return false;
  }

  return HORARIO_DIAS_SEMANA_OPTIONS.every((option) => a[option.key] === b[option.key]);
}

export function sortHorarios(items: Horario[]): Horario[] {
  return [...items].sort(compareHorarios);
}

export function sanitizeHourInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 2);
}

export function sanitizeMinuteInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 2);
}

export function parseHourValue(value: string): number {
  const trimmed = value.trim();
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 23 ? parsed : NaN;
}

export function parseMinuteValue(value: string): number {
  const trimmed = value.trim();
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 59 ? parsed : NaN;
}
