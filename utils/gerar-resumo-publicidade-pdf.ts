import type { PublicidadeEmpresaTotais, ResumoPublicidadeResult } from '@/types/publicidade';

export type GerarResumoPublicidadePdfInput = {
  data: ResumoPublicidadeResult;
  periodoLabel: string;
};

export type GerarResultadosPublicidadeEmpresaPdfInput = {
  empresa: string;
  totais: PublicidadeEmpresaTotais;
  periodoLabel: string;
};

const WEB_ONLY_PDF_ERROR = 'A geração de PDF está disponível apenas na versão web.';

export async function gerarResumoPublicidadePdf(
  _input: GerarResumoPublicidadePdfInput,
): Promise<void> {
  throw new Error(WEB_ONLY_PDF_ERROR);
}

export async function gerarResultadosPublicidadeEmpresaPdf(
  _input: GerarResultadosPublicidadeEmpresaPdfInput,
): Promise<void> {
  throw new Error(WEB_ONLY_PDF_ERROR);
}
