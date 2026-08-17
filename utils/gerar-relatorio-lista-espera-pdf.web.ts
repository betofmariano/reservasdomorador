import type { GerarRelatorioListaEsperaPdfInput } from '@/utils/gerar-relatorio-lista-espera-pdf';
import { formatListaEsperaAvisoLabel } from '@/utils/relatorio-lista-espera';
import { formatarDataHoraMatchPlace } from '@/utils/programacao-atividades';
import {
  formatPresencaDataLabel,
  formatPresencaHorarioLabel,
  slugifyPresencaFilename,
} from '@/utils/presenca-datetime';

export type { GerarRelatorioListaEsperaPdfInput };

export async function gerarRelatorioListaEsperaPdf(
  input: GerarRelatorioListaEsperaPdfInput,
): Promise<void> {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf/dist/jspdf.es.min.js'),
    import('jspdf-autotable'),
  ]);

  const autoTable = autoTableModule.default;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const marginLeft = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  const filename = `lista-espera-${slugifyPresencaFilename(input.atividadeNome)}-${Date.now()}.pdf`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Lista de Espera', pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Local: ${input.localNome}`, marginLeft, 30);
  doc.text(`Atividade: ${input.atividadeNome}`, marginLeft, 37);
  doc.text(`Ordem: ${input.ordemLabel}`, marginLeft, 44);
  doc.text(`Quantidade de reservas: ${input.registros.length}`, marginLeft, 51);
  doc.text(
    `Gerado em: ${formatPresencaDataLabel(now.getTime())} ${formatPresencaHorarioLabel(now.getTime())}`,
    marginLeft,
    58,
  );

  autoTable(doc, {
    startY: 66,
    head: [['Nome', 'Atividade', 'Data Atividade', 'Data Criação', 'Aviso']],
    body: input.registros.map((item) => [
      item.nome,
      item.atividade,
      formatarDataHoraMatchPlace(item.dataAtividade, { includeYear: true }),
      formatarDataHoraMatchPlace(item.created_at, { includeYear: true }),
      formatListaEsperaAvisoLabel(item),
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [36, 86, 168],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [244, 246, 250],
    },
  });

  doc.save(filename);
}
