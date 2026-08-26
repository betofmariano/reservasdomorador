import type { GerarMapaFrequenciaPdfInput } from '@/utils/gerar-mapa-frequencia-pdf';
import type { FrequenciaStatus } from '@/types/mapa-frequencia';
import {
  getMapaFrequenciaPdfCellBorderColor,
  getMapaFrequenciaPdfCellFillColor,
} from '@/utils/mapa-frequencia';
import {
  formatPresencaDataLabel,
  formatPresencaHorarioLabel,
  slugifyPresencaFilename,
} from '@/utils/presenca-datetime';

export type { GerarMapaFrequenciaPdfInput };

const PDF_COLORS = {
  navy: [58, 33, 84] as [number, number, number],
  headerBg: [244, 246, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  headerBorder: [197, 197, 197] as [number, number, number],
};

function drawStatusBox(
  doc: import('jspdf').jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  status: FrequenciaStatus,
) {
  const padding = 0.7;
  const boxX = x + padding;
  const boxY = y + padding;
  const boxWidth = Math.max(width - padding * 2, 2);
  const boxHeight = Math.max(height - padding * 2, 3);
  const [fillR, fillG, fillB] = getMapaFrequenciaPdfCellFillColor(status);
  const [borderR, borderG, borderB] = getMapaFrequenciaPdfCellBorderColor(status);

  doc.setFillColor(fillR, fillG, fillB);
  doc.setDrawColor(borderR, borderG, borderB);
  doc.setLineWidth(0.25);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 0.8, 0.8, 'FD');
}

function drawLegendSwatch(
  doc: import('jspdf').jsPDF,
  x: number,
  y: number,
  status: FrequenciaStatus,
) {
  drawStatusBox(doc, x - 0.7, y - 3.2, 6, 4.5, status);
}

function drawLegend(
  doc: import('jspdf').jsPDF,
  marginLeft: number,
  legendY: number,
) {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.navy);
  doc.text('Legenda:', marginLeft, legendY);

  doc.setFont('helvetica', 'normal');
  const itemsY = legendY + 5;

  drawLegendSwatch(doc, marginLeft + 2, itemsY, 1);
  doc.text('Reservou e compareceu', marginLeft + 10, itemsY);

  drawLegendSwatch(doc, marginLeft + 62, itemsY, 3);
  doc.text('Reservou e não compareceu', marginLeft + 70, itemsY);

  drawLegendSwatch(doc, marginLeft + 132, itemsY, null);
  doc.text('Reserva Não Realizada', marginLeft + 140, itemsY);
}

export async function gerarMapaFrequenciaPdf(input: GerarMapaFrequenciaPdfInput): Promise<void> {
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

  const marginLeft = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  const { relatorio, alunos } = input;
  const filename = `mapa-frequencia-${slugifyPresencaFilename(relatorio.atividadeNome)}-${Date.now()}.pdf`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Mapa de Frequência', pageWidth / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Local: ${input.localNome}`, marginLeft, 24);
  doc.text(`Atividade: ${relatorio.atividadeNome}`, marginLeft, 30);
  doc.text(`Horário: ${relatorio.horarioFormatado ?? 'Todos'}`, marginLeft, 36);
  doc.text(`Total de pessoas na lista: ${alunos.length}`, marginLeft, 42);
  doc.text(
    `Gerado em: ${formatPresencaDataLabel(now.getTime())} ${formatPresencaHorarioLabel(now.getTime())}`,
    marginLeft,
    48,
  );

  const legendY = 54;
  drawLegend(doc, marginLeft, legendY);
  const tableStartY = legendY + 10;

  const head = [
    'Nome',
    ...relatorio.colunas.map((coluna) => `${coluna.dataFormatada}\n${coluna.horaFormatada}`),
  ];

  const body = alunos.map((aluno) => [
    aluno.nome,
    ...relatorio.colunas.map(() => ''),
  ]);

  const nameColumnWidth = 48;
  const dateColumnCount = Math.max(relatorio.colunas.length, 1);
  const dateColumnWidth = (pageWidth - marginLeft * 2 - nameColumnWidth) / dateColumnCount;

  autoTable(doc, {
    startY: tableStartY,
    head: [head],
    body,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 1.5,
      overflow: 'linebreak',
      valign: 'middle',
      halign: 'center',
      fillColor: PDF_COLORS.white,
      textColor: PDF_COLORS.navy,
      lineColor: PDF_COLORS.headerBorder,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: PDF_COLORS.headerBg,
      textColor: PDF_COLORS.navy,
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: nameColumnWidth, halign: 'left', fontStyle: 'bold' },
      ...Object.fromEntries(
        relatorio.colunas.map((_, index) => [
          index + 1,
          { cellWidth: dateColumnWidth, minCellHeight: 8 },
        ]),
      ),
    },
    margin: { left: marginLeft, right: marginLeft },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index > 0) {
        data.cell.text = [''];
      }

      if (data.section === 'head' && data.column.index > 0) {
        data.cell.styles.fillColor = PDF_COLORS.white;
      }
    },
    willDrawCell: (data) => {
      if (data.section === 'head' && data.column.index > 0) {
        drawStatusBox(doc, data.cell.x, data.cell.y, data.cell.width, data.cell.height, null);
      }
    },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index === 0) {
        return;
      }

      const aluno = alunos[data.row.index];
      const coluna = relatorio.colunas[data.column.index - 1];

      if (!aluno || !coluna) {
        return;
      }

      drawStatusBox(
        doc,
        data.cell.x,
        data.cell.y,
        data.cell.width,
        data.cell.height,
        aluno.statuses[coluna.chave],
      );
    },
  });

  doc.save(filename);
}
