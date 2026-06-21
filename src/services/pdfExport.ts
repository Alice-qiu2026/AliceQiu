import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * 将指定 DOM 元素导出为 PDF 文件
 * @param element 要导出的 DOM 元素
 * @param filename 下载文件名
 */
export async function exportElementToPDF(
  element: HTMLElement,
  filename: string = 'report.pdf'
): Promise<void> {
  if (!element) throw new Error('未找到导出元素');

  // 1. 使用 html2canvas 渲染为高清 canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');

  // 2. 创建 A4 PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();  // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 10;

  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let position = 0;
  let remainingHeight = imgHeight;

  // 3. 分页处理：如果内容超过一页，分割为多页
  while (remainingHeight > 0) {
    const sliceHeight = Math.min(remainingHeight, pageHeight - margin * 2);

    pdf.addImage(
      imgData,
      'PNG',
      margin,
      margin - position,
      imgWidth,
      imgHeight
    );

    remainingHeight -= sliceHeight;
    position += sliceHeight;

    if (remainingHeight > 0) {
      pdf.addPage();
    }
  }

  pdf.save(filename);
}
