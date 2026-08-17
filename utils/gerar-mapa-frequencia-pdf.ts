import type { MapaFrequenciaRelatorio } from '@/types/mapa-frequencia';
import type { AlunoMapaFrequencia } from '@/types/mapa-frequencia';

export type GerarMapaFrequenciaPdfInput = {
  localNome: string;
  relatorio: MapaFrequenciaRelatorio;
  alunos: AlunoMapaFrequencia[];
};

export async function gerarMapaFrequenciaPdf(_input: GerarMapaFrequenciaPdfInput): Promise<void> {
  throw new Error('A geração de PDF está disponível na versão web do MatchPlace.');
}
