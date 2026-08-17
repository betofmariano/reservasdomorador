import type { GerarListaUsuariosSuspensosPdfInput } from '@/utils/gerar-lista-usuarios-suspensos-pdf';
import { formatSuspensaoStatusLabel } from '@/utils/lista-usuarios-suspensos';
import { formatarDataHoraMatchPlace } from '@/utils/programacao-atividades';
import {
  formatPresencaDataLabel,
  formatPresencaHorarioLabel,
  slugifyPresencaFilename,
} from '@/utils/presenca-datetime';

export type { GerarListaUsuariosSuspensosPdfInput };

export async function gerarListaUsuariosSuspensosPdf(
  input: GerarListaUsuariosSuspensosPdfInput,
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
  const filename = `usuarios-suspensos-${slugifyPresencaFilename(input.localNome)}-${Date.now()}.pdf`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Lista de Usuários Suspensos', pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Local: ${input.localNome}`, marginLeft, 30);
  doc.text(`Atividade: ${input.atividadeNome}`, marginLeft, 37);
  doc.text(`Situação: ${input.statusLabel}`, marginLeft, 44);
  doc.text(`Ordem: ${input.ordemLabel}`, marginLeft, 51);
  doc.text(`Quantidade de registros: ${input.registros.length}`, marginLeft, 58);
  doc.text(
    `Gerado em: ${formatPresencaDataLabel(now.getTime())} ${formatPresencaHorarioLabel(now.getTime())}`,
    marginLeft,
    65,
  );

  autoTable(doc, {
    startY: 73,
    head: [['Nome', 'Telefone', 'Atividade', 'Início', 'Fim', 'Situação']],
    body: input.registros.map((item) => [
      item.nome,
      item.telefone,
      item.atividade,
      formatarDataHoraMatchPlace(item.dataInicio, { includeYear: true }),
      formatarDataHoraMatchPlace(item.dataFinal, { includeYear: true }),
      formatSuspensaoStatusLabel(item.encerrado),
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
