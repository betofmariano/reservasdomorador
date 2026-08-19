import { PUBLICIDADE_APPS } from '@/types/publicidade';
import type { GerarResumoPublicidadePdfInput } from '@/utils/gerar-resumo-publicidade-pdf';
import {
  formatPresencaDataLabel,
  formatPresencaHorarioLabel,
  slugifyPresencaFilename,
} from '@/utils/presenca-datetime';
import { formatPublicidadeInteiro } from '@/utils/resumo-publicidade';

export type { GerarResumoPublicidadePdfInput };

export async function gerarResumoPublicidadePdf(
  input: GerarResumoPublicidadePdfInput,
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
  const periodoSlug = slugifyPresencaFilename(input.periodoLabel) || 'periodo';
  const filename = `resumo-publicidade-${periodoSlug}-${Date.now()}.pdf`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Resumo Publicidade', pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Período: ${input.periodoLabel}`, marginLeft, 30);
  doc.text(
    `Gerado em: ${formatPresencaDataLabel(now.getTime())} ${formatPresencaHorarioLabel(now.getTime())}`,
    marginLeft,
    37,
  );

  autoTable(doc, {
    startY: 46,
    head: [['Empresa', ...PUBLICIDADE_APPS, 'TOTAL']],
    body: [
      ...input.data.empresas.map((row) => [
        row.empresa,
        ...PUBLICIDADE_APPS.map((app) => formatPublicidadeInteiro(row[app])),
        formatPublicidadeInteiro(row.total),
      ]),
      [
        input.data.totais.empresa,
        ...PUBLICIDADE_APPS.map((app) =>
          formatPublicidadeInteiro(input.data.totais[app]),
        ),
        formatPublicidadeInteiro(input.data.totais.total),
      ],
    ],
    styles: {
      fontSize: 10,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [36, 86, 168],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [244, 246, 250],
    },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  });

  doc.save(filename);
}
