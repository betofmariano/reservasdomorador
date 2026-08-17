import type { HorarioPresencaOption, ReservaPresenca } from '@/types/presenca';
import {
  buildPresencaPdfFilename,
  formatPresencaDataLabel,
  formatPresencaHorarioLabel,
  slugifyPresencaFilename,
} from '@/utils/presenca-datetime';

export type GerarListaPresencaPdfInput = {
  localNome: string;
  atividadeNome: string;
  horario: HorarioPresencaOption;
  reservas: ReservaPresenca[];
  professorNome?: string;
};

export async function gerarListaPresencaPdf(input: GerarListaPresencaPdfInput): Promise<void> {
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
  const dataLabel = formatPresencaDataLabel(input.horario.dataAtividade);
  const horarioLabel = formatPresencaHorarioLabel(input.horario.dataAtividade);
  const filename = buildPresencaPdfFilename(
    slugifyPresencaFilename(input.atividadeNome),
    input.horario.data,
    horarioLabel,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(input.localNome, pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(14);
  doc.text('Lista de Presença', pageWidth / 2, 26, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Atividade: ${input.atividadeNome}`, marginLeft, 38);
  doc.text(`Data: ${dataLabel}`, marginLeft, 45);
  doc.text(`Horário: ${horarioLabel}`, marginLeft, 52);
  doc.text(`Quantidade de reservas: ${input.reservas.length}`, marginLeft, 59);

  autoTable(doc, {
    startY: 68,
    head: [['Nº', 'Nome do aluno', 'Presença']],
    body: input.reservas.map((reserva, index) => [
      String(index + 1),
      reserva.nomeUsuario,
      '',
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [36, 86, 168],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 120 },
      2: { cellWidth: 24 },
    },
    margin: { left: marginLeft, right: marginLeft },
    didDrawPage: () => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
    },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY;
  let footerY = (finalY ?? 68) + 16;

  if (footerY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    footerY = 30;
  }

  doc.setFontSize(11);
  doc.text('Professor: __________________________________', marginLeft, footerY);
  doc.text('Assinatura: __________________________________', marginLeft, footerY + 10);
  doc.text(
    `Data da impressão: ${formatPresencaDataLabel(now.getTime())} ${formatPresencaHorarioLabel(now.getTime())}`,
    marginLeft,
    footerY + 20,
  );

  doc.save(filename);
}
