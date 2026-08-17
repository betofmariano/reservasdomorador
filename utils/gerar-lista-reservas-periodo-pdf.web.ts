import type { GerarListaReservasPeriodoPdfInput } from '@/utils/gerar-lista-reservas-periodo-pdf';
import {
  formatPresencaDataLabel,
  formatPresencaHorarioLabel,
  slugifyPresencaFilename,
} from '@/utils/presenca-datetime';

export type { GerarListaReservasPeriodoPdfInput };

export async function gerarListaReservasPeriodoPdf(
  input: GerarListaReservasPeriodoPdfInput,
): Promise<void> {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf/dist/jspdf.es.min.js'),
    import('jspdf-autotable'),
  ]);

  const autoTable = autoTableModule.default;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const marginLeft = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  const filename = `lista-reservas-periodo-${slugifyPresencaFilename(input.localNome)}-${Date.now()}.pdf`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Resumo de Reservas por Período', pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Local: ${input.localNome}`, marginLeft, 30);
  doc.text(`Período: ${input.periodoInicioLabel} a ${input.periodoFimLabel}`, marginLeft, 37);
  doc.text(`Atividades no período: ${input.resumo.totalAtividades}`, marginLeft, 44);
  doc.text(
    `Reservas: ${input.resumo.totalReservas} · Presentes: ${input.resumo.totalPresentes} · Ausentes: ${input.resumo.totalAusentes}`,
    marginLeft,
    51,
  );
  doc.text(
    `Gerado em: ${formatPresencaDataLabel(now.getTime())} ${formatPresencaHorarioLabel(now.getTime())}`,
    marginLeft,
    58,
  );

  autoTable(doc, {
    startY: 66,
    head: [['Atividade', 'Reservas', 'Presentes', 'Ausentes']],
    body: input.reservas.map((item) => [
      item.atividadeNome,
      String(item.qtdeReservas),
      String(item.qtdePresente),
      String(item.qtdeAusente),
    ]),
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
  });

  doc.save(filename);
}
