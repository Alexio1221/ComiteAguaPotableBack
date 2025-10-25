import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface ComprobantePDF {
  idPago: number;
  fechaPago: Date;
  montoPagado: number;
  comprobantesPagados: {
    idComprobante: number;
    montoBasico: number;
    montoAdicional: number;
    moraAcumulada: number;
    totalPagar: number;
    idMedidor: number;
    direccion?: string;
    fechaEmision: Date;
    fechaLimite: Date;
  }[];
}

export const generarComprobantePDF = (data: ComprobantePDF): string => {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  
  // Colores corporativos
  const primaryColor = '#2563eb';
  const secondaryColor = '#64748b';
  const accentColor = '#10b981';
  const lightGray = '#f1f5f9';
  const darkGray = '#334155';

  // Carpeta destino dentro de /uploads
  const uploadsDir = path.join(__dirname, '../../uploads/comprobantes');

  // Crear la carpeta si no existe
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Nombre del archivo
  const filePath = path.join(uploadsDir, `comprobante-${data.idPago}.pdf`);

  // Guardar en disco
  doc.pipe(fs.createWriteStream(filePath));

  // Header con fondo de color
  doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
  
  doc.fillColor('#ffffff')
    .fontSize(28)
    .font('Helvetica-Bold')
    .text('RECIBO DE PAGO', 50, 40, { align: 'center' });
  
  doc.fontSize(12)
    .font('Helvetica')
    .text('Comprobante de Pago de Servicios', { align: 'center' });

  // Información principal
  doc.fillColor(darkGray);
  const startY = 140;
  
  // Caja con información del pago
  doc.roundedRect(50, startY, doc.page.width - 100, 100, 5)
    .fillAndStroke(lightGray, secondaryColor);

  doc.fillColor(primaryColor)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('INFORMACIÓN DEL PAGO', 70, startY + 15);

  // Grid de información
  const infoY = startY + 40;
  doc.fillColor(darkGray)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('ID de Pago:', 70, infoY)
    .font('Helvetica')
    .text(data.idPago.toString(), 160, infoY);

  doc.font('Helvetica-Bold')
    .text('Fecha:', 320, infoY)
    .font('Helvetica')
    .text(data.fechaPago.toLocaleDateString('es-BO'), 380, infoY);

  doc.font('Helvetica-Bold')
    .text('Hora:', 320, infoY + 20)
    .font('Helvetica')
    .text(data.fechaPago.toLocaleTimeString('es-BO'), 380, infoY + 20);

  // Monto total destacado
  doc.roundedRect(70, infoY + 45, doc.page.width - 140, 30, 3)
    .fill(accentColor);
  
  doc.fillColor('#ffffff')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('MONTO TOTAL PAGADO:', 85, infoY + 53)
    .fontSize(16)
    .text(`Bs ${data.montoPagado.toFixed(2)}`, 0, infoY + 53, { 
      align: 'right',
      width: doc.page.width - 85
    });

  // Detalle de comprobantes
  let currentY = startY + 170;
  
  doc.fillColor(primaryColor)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('DETALLE DE COMPROBANTES', 50, currentY);

  currentY += 25;

  // Línea separadora
  doc.moveTo(50, currentY)
    .lineTo(doc.page.width - 50, currentY)
    .strokeColor(primaryColor)
    .lineWidth(2)
    .stroke();

  currentY += 15;

  // Iterar por cada comprobante
  data.comprobantesPagados.forEach((c, index) => {
    // Verificar si necesitamos una nueva página
    if (currentY > doc.page.height - 200) {
      doc.addPage();
      currentY = 50;
    }

    // Caja para cada comprobante
    const boxHeight = 155;
    doc.roundedRect(50, currentY, doc.page.width - 100, boxHeight, 5)
      .fillAndStroke('#ffffff', secondaryColor);

    // Número del comprobante
    doc.fillColor(primaryColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`Comprobante #${c.idComprobante}`, 70, currentY + 15);

    // Info del medidor
    doc.fillColor(darkGray)
      .fontSize(9)
      .font('Helvetica')
      .text(`Medidor: ${c.idMedidor} | ${c.direccion || 'N/A'}`, 70, currentY + 35, {
        width: doc.page.width - 140
      });

    // Fechas
    const dateY = currentY + 55;
    doc.fontSize(8)
      .fillColor(secondaryColor)
      .text(`Emisión: ${c.fechaEmision.toLocaleDateString('es-BO')}`, 70, dateY)
      .text(`Límite: ${c.fechaLimite.toLocaleDateString('es-BO')}`, 200, dateY);

    // Tabla de montos
    const tableY = currentY + 75;
    const col1X = 70;
    const col2X = doc.page.width - 180;

    doc.fontSize(9)
      .fillColor(secondaryColor)
      .font('Helvetica');

    // Líneas de detalle
    doc.text('Monto básico:', col1X, tableY)
      .text(`Bs ${c.montoBasico.toFixed(2)}`, col2X, tableY, { align: 'right', width: 100 });

    doc.text('Monto adicional:', col1X, tableY + 15)
      .text(`Bs ${c.montoAdicional.toFixed(2)}`, col2X, tableY + 15, { align: 'right', width: 100 });

    doc.text('Mora acumulada:', col1X, tableY + 30)
      .text(`Bs ${c.moraAcumulada.toFixed(2)}`, col2X, tableY + 30, { align: 'right', width: 100 });

    // Total del comprobante
    doc.moveTo(col1X, tableY + 48)
      .lineTo(doc.page.width - 70, tableY + 48)
      .strokeColor(secondaryColor)
      .lineWidth(1)
      .stroke();

    doc.fontSize(10)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text('SUBTOTAL:', col1X, tableY + 53)
      .text(`Bs ${c.totalPagar.toFixed(2)}`, col2X, tableY + 53, { align: 'right', width: 100 });

    currentY += boxHeight + 15;
  });

  // Footer
  const footerY = doc.page.height - 104;
  doc.moveTo(50, footerY)
    .lineTo(doc.page.width - 50, footerY)
    .strokeColor(lightGray)
    .lineWidth(1)
    .stroke();

  doc.fillColor(secondaryColor)
    .fontSize(10)
    .font('Helvetica-Oblique')
    .text('Gracias por su pago', 50, footerY + 15, { align: 'center' });

  doc.fontSize(8)
    .font('Helvetica')
    .text('Este es un comprobante válido de pago', 50, footerY + 35, { align: 'center' })
    .text(`Generado el ${new Date().toLocaleString('es-BO')}`, { align: 'center' });

  // Finalizar PDF
  doc.end();

  return `/uploads/comprobantes/comprobante-${data.idPago}.pdf`;;
};