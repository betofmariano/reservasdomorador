import type { ResumoPublicidadeResult } from '@/types/publicidade';

export type GerarResumoPublicidadePdfInput = {
  data: ResumoPublicidadeResult;
  periodoLabel: string;
};

export async function gerarResumoPublicidadePdf(
  _input: GerarResumoPublicidadePdfInput,
): Promise<void> {
  throw new Error('A geração de PDF está disponível apenas na versão web.');
}
