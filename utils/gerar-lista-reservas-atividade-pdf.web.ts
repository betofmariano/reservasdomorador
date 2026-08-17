import type { GerarListaReservasAtividadePdfInput } from '@/utils/gerar-lista-reservas-atividade-pdf';
import { getPresencaRelatorioLabel } from '@/utils/lista-reservas-atividade';
import {
  formatPresencaDataLabel,
  formatPresencaHorarioLabel,
  slugifyPresencaFilename,
} from '@/utils/presenca-datetime';

export type { GerarListaReservasAtividadePdfInput };

export async function gerarListaReservasAtividadePdf(
  input: GerarListaReservasAtividadePdfInput,
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
  const filename = `lista-reservas-atividade-${slugifyPresencaFilename(input.atividadeNome)}-${Date.now()}.pdf`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Lista de Reservas por Atividade', pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Local: ${input.localNome}`, marginLeft, 30);
  doc.text(`Atividade: ${input.atividadeNome}`, marginLeft, 37);
  doc.text(`Período: ${input.periodoInicioLabel} a ${input.periodoFimLabel}`, marginLeft, 44);
  doc.text(`Reservas no período: ${input.resumo.totalConsulta}`, marginLeft, 51);
  doc.text(
    `Presentes: ${input.resumo.presentes} · Ausentes: ${input.resumo.ausentes}`,
    marginLeft,
    58,
  );
  doc.text(
    `Gerado em: ${formatPresencaDataLabel(now.getTime())} ${formatPresencaHorarioLabel(now.getTime())}`,
    marginLeft,
    65,
  );

  autoTable(doc, {
    startY: 73,
    head: [['Nome', 'Data', 'Horário', 'Presença']],
    body: input.reservas.map((item) => [
      item.nome,
      formatPresencaDataLabel(item.dataHora),
      formatPresencaHorarioLabel(item.dataHora),
      getPresencaRelatorioLabel(item.presencaStatus),
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
