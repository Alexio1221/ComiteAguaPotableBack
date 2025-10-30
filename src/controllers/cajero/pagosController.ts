import { Request, Response } from 'express';
import prisma from '../../config/client';
import { generarComprobantePDF } from '../../utils/generarComprobantes';
import { RequestConUsuario } from '../../middlewar/autenticacion';
import PDFDocument from 'pdfkit';
import { Prisma } from '@prisma/client';


export const obtenerHistorialPagos = async (req: Request, res: Response) => {
    try {
        const pagos = await prisma.pago.findMany({
            include: {
                cajero: {
                    select: {
                        idUsuario: true,
                        nombre: true,
                        apellidos: true
                    }
                },
                comprobantes: {
                    select: {
                        idComprobante: true,
                        fechaEmision: true,
                        montoBasico: true,
                        montoAdicional: true,
                        moraAcumulada: true,
                        totalPagar: true,
                        estadoPago: true,
                        fechaLimite: true,
                        lectura: {
                            select: {
                                idLectura: true,
                                lecturaActual: true,
                                lecturaAnterior: true,
                                consumo: true,
                                fechaLectura: true,
                                observaciones: true,
                                medidor: {
                                    select: {
                                        idMedidor: true,
                                        socio: {
                                            select: {
                                                idUsuario: true,
                                                nombre: true,
                                                apellidos: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { fechaPago: 'desc' }
        });

        res.json(pagos);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ mensaje: 'Error al obtener historial de pagos' });
    }
}

export const registrarPago = async (req: RequestConUsuario, res: Response) => {
    try {
        const { comprobantes } = req.body;
        const cajero = req.user?.idUsuario;

        if (!comprobantes?.length) {
            res.status(400).json({ mensaje: "No se enviaron comprobantes para pagar" });
            return
        }

        if (!cajero) {
            res.status(401).json({ mensaje: 'No autorizado. Inicie sesión nuevamente.' });
            return;
        }

        const comprobantesData = await prisma.comprobante.findMany({
            where: { idComprobante: { in: comprobantes } },
            include: {
                lectura: {
                    select: {
                        medidor: {
                            select: {
                                idMedidor: true,
                                ubicacionSocio: { select: { direccion: true } }
                            }
                        }
                    }
                }
            }
        });

        if (comprobantesData.length === 0) {
            res.status(404).json({ mensaje: "No se encontraron los comprobantes" });
            return
        }

        // Calcular monto total
        const montoTotal = comprobantesData.reduce(
            (suma, c) => suma + Number(c.totalPagar),
            0
        );

        // Crear registro de pago
        const nuevoPago = await prisma.pago.create({
            data: { montoPagado: montoTotal, idCajero: cajero },
        });

        // Actualizar los comprobantes como PAGADO y asociarlos al pago
        await prisma.comprobante.updateMany({
            where: { idComprobante: { in: comprobantes } },
            data: {
                idPago: nuevoPago.idPago,
                estadoPago: "PAGADO",
            },
        });

        // Generar PDF con datos completos
        const pdfPath = generarComprobantePDF({
            idPago: nuevoPago.idPago,
            fechaPago: nuevoPago.fechaPago,
            montoPagado: montoTotal,
            comprobantesPagados: comprobantesData.map(c => ({
                idComprobante: c.idComprobante,
                montoBasico: Number(c.montoBasico),
                montoAdicional: Number(c.montoAdicional),
                moraAcumulada: Number(c.moraAcumulada),
                totalPagar: Number(c.totalPagar),
                idMedidor: c.lectura?.medidor?.idMedidor || 0,
                direccion: c.lectura?.medidor?.ubicacionSocio?.direccion,
                fechaEmision: c.fechaEmision,
                fechaLimite: c.fechaLimite,
            }))
        });

        await prisma.pago.update({
            where: { idPago: nuevoPago.idPago },
            data: { comprobanteArchivo: pdfPath },
        });

        res.json({
            mensaje: "Pago registrado con éxito",
            rutaComprobante: pdfPath
        });

    } catch (error) {
        console.error("Error al registrar pago:", error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
};


export const generarReportePago = async (req: Request, res: Response) => {
  try {
    const { socio, cajero, mes, anio } = req.body;
    console.log({ socio, cajero, mes, anio });

    const where: Prisma.PagoWhereInput = {};

    // Filtro por mes y año
    if (mes && anio) {
      const inicio = new Date(Number(anio), Number(mes) - 1, 1);
      const fin = new Date(Number(anio), Number(mes), 0, 23, 59, 59);
      where.fechaPago = { gte: inicio, lte: fin };
    } else if (anio) {
      const inicio = new Date(Number(anio), 0, 1);
      const fin = new Date(Number(anio), 11, 31, 23, 59, 59);
      where.fechaPago = { gte: inicio, lte: fin };
    }

    // Filtro por cajero
    if (cajero) {
      where.cajero = {
        nombre: { contains: String(cajero), mode: 'insensitive' },
      };
    }

    // Filtro por socio
    if (socio) {
      where.comprobantes = {
        some: {
          lectura: {
            medidor: {
              socio: {
                nombre: { contains: String(socio), mode: 'insensitive' },
              },
            },
          },
        },
      };
    }

    // Consulta de pagos
    const pagos = await prisma.pago.findMany({
      where,
      include: {
        cajero: true,
        comprobantes: {
          include: {
            lectura: {
              include: {
                medidor: {
                  include: { 
                    socio: true,
                    categoria: true 
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { fechaPago: 'desc' },
    });

    // OBTENER TODAS LAS CATEGORÍAS
    const categorias = await prisma.categoria.findMany({
      orderBy: { tipo: 'asc' }
    });

    // CÁLCULOS ESTADÍSTICOS
    const totalRecaudado = pagos.reduce((sum, p) => sum + Number(p.montoPagado), 0);
    const totalPagos = pagos.length;
    
    // Obtener todos los comprobantes para estadísticas
    const todosComprobantes = pagos.flatMap(p => p.comprobantes);
    const comprobantesConMora = todosComprobantes.filter(c => Number(c.moraAcumulada) > 0);
    const consumoTotal = todosComprobantes.reduce((sum, c) => sum + Number(c.lectura.consumo), 0);
    const consumoPromedio = todosComprobantes.length > 0 ? consumoTotal / todosComprobantes.length : 0;
    
    // Socios únicos
    const sociosUnicos = new Set(
      todosComprobantes.map(c => c.lectura.medidor.idSocio)
    );
    
    // Usuarios que se excedieron del límite básico
    const excedidos = todosComprobantes.filter(c => Number(c.montoAdicional) > 0).length;

    // Crear PDF - Tamaño CARTA (8.5" x 11" = 612 x 792 puntos)
    const doc = new PDFDocument({ 
      margin: 50, 
      size: 'LETTER',
      bufferPages: true
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="reporte_pagos.pdf"'
    );
    doc.pipe(res);

    // ENCABEZADO PROFESIONAL
    doc.rect(0, 0, 612, 80).fill('#1e3a8a');
    doc.fillColor('white')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('REPORTE DE PAGOS', 50, 25, { align: 'center' });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text('Sistema de Gestión de Agua Potable', { align: 'center' });
    
    doc.fillColor('black').moveDown(3);

    // INFORMACIÓN DE FILTROS
    const yInicio = 100;
    doc.y = yInicio;
    
    doc.fontSize(11).font('Helvetica-Bold').text('Filtros Aplicados:', 50);
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    
    if (cajero) doc.text(`• Cajero: ${cajero}`, 70);
    if (socio) doc.text(`• Socio: ${socio}`, 70);
    if (mes && anio) doc.text(`• Periodo: ${mes}/${anio}`, 70);
    else if (anio) doc.text(`• Año: ${anio}`, 70);
    
    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`• Fecha de generación: ${fechaGeneracion}`, 70);
    
    doc.moveDown(1.5);

    // TABLA DE CATEGORÍAS
    doc.fontSize(11).font('Helvetica-Bold').text('Categorías y Tarifas Vigentes:', 50);
    doc.moveDown(0.5);

    const catTableTop = doc.y;
    const catCol1 = 50;   // Tipo
    const catCol2 = 150;  // Límite Básico
    const catCol3 = 270;  // Tarifa Básica
    const catCol4 = 390;  // Tarifa Adicional
    const catCol5 = 510;  // Mora Exp.

    doc.fontSize(8).font('Helvetica-Bold');
    doc.rect(catCol1, catTableTop - 5, 512, 18).fill('#f1f5f9');
    doc.fillColor('black');
    doc.text('Categoría', catCol1 + 5, catTableTop);
    doc.text('Límite Básico', catCol2, catTableTop);
    doc.text('Tarifa Básica', catCol3, catTableTop);
    doc.text('Tarifa Adicional', catCol4, catTableTop);
    doc.text('Mora Exp.', catCol5, catTableTop);

    let catYPos = catTableTop + 20;
    doc.font('Helvetica').fontSize(8);

    categorias.forEach((cat, index) => {
      if (index % 2 === 0) {
        doc.rect(catCol1, catYPos - 3, 512, 14).fill('#fafafa');
      }
      doc.fillColor('black');
      doc.text(cat.tipo, catCol1 + 5, catYPos, { width: 95, ellipsis: true });
      doc.text(`${cat.limiteBasico} m³`, catCol2, catYPos, { width: 115 });
      doc.text(`Bs ${Number(cat.tarifa).toFixed(2)}`, catCol3, catYPos, { width: 115 });
      doc.text(`Bs ${Number(cat.tarifaAdicional).toFixed(2)}`, catCol4, catYPos, { width: 115 });
      doc.text(cat.moraExponencial ? 'Sí' : 'No', catCol5, catYPos, { width: 47 });
      catYPos += 16;
    });

    doc.moveDown(1.5);

    // LÍNEA SEPARADORA
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#cbd5e1');
    doc.moveDown(1);

    if (pagos.length === 0) {
      doc.fontSize(12).text('No se encontraron pagos con los filtros aplicados.', {
        align: 'center'
      });
      doc.end();
      return;
    }

    // TABLA DE PAGOS
    doc.fontSize(14).font('Helvetica-Bold').text('Detalle de Pagos', 50);
    doc.moveDown(0.8);

    // Encabezados de tabla
    const tableTop = doc.y;
    const col1 = 50;   // Fecha
    const col2 = 110;  // Cajero
    const col3 = 210;  // Socio
    const col4 = 310;  // Categoría
    const col5 = 385;  // Consumo
    const col6 = 450;  // Límite
    const col7 = 505;  // Monto

    doc.fontSize(8).font('Helvetica-Bold');
    doc.rect(col1, tableTop - 5, 512, 20).fill('#f1f5f9');
    doc.fillColor('black');
    doc.text('Fecha', col1 + 5, tableTop);
    doc.text('Cajero', col2, tableTop);
    doc.text('Socio', col3, tableTop);
    doc.text('Categoría', col4, tableTop);
    doc.text('Consumo', col5, tableTop);
    doc.text('Límite', col6, tableTop);
    doc.text('Monto', col7, tableTop);
    
    let yPosition = tableTop + 25;
    doc.font('Helvetica').fontSize(7.5);

    pagos.forEach((p, index) => {
      // Verificar si necesitamos nueva página
      if (yPosition > 680) {
        doc.addPage();
        yPosition = 50;
        
        // Re-dibujar encabezados en nueva página
        doc.fontSize(8).font('Helvetica-Bold');
        doc.rect(col1, yPosition - 5, 512, 20).fill('#f1f5f9');
        doc.fillColor('black');
        doc.text('Fecha', col1 + 5, yPosition);
        doc.text('Cajero', col2, yPosition);
        doc.text('Socio', col3, yPosition);
        doc.text('Categoría', col4, yPosition);
        doc.text('Consumo', col5, yPosition);
        doc.text('Límite', col6, yPosition);
        doc.text('Monto', col7, yPosition);
        yPosition += 25;
        doc.font('Helvetica').fontSize(7.5);
      }

      const fecha = new Date(p.fechaPago).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      const cajeroNombre = `${p.cajero.nombre} ${p.cajero.apellidos ?? ''}`.trim();
      const comprobante = p.comprobantes[0];
      const socioNombre = comprobante?.lectura?.medidor?.socio?.nombre ?? '—';
      const categoria = comprobante?.lectura?.medidor?.categoria?.tipo ?? '—';
      const limiteBasico = comprobante?.lectura?.medidor?.categoria?.limiteBasico 
        ? Number(comprobante.lectura.medidor.categoria.limiteBasico).toFixed(1)
        : '—';
      const consumo = comprobante?.lectura?.consumo?.toFixed(2) ?? '0.00';
      const total = p.montoPagado?.toFixed(2) ?? '0.00';

      // Alternar color de fondo
      if (index % 2 === 0) {
        doc.rect(col1, yPosition - 3, 512, 16).fill('#fafafa');
      }

      doc.fillColor('black');
      doc.text(fecha, col1 + 5, yPosition, { width: 50 });
      doc.text(cajeroNombre, col2, yPosition, { width: 95, ellipsis: true });
      doc.text(socioNombre, col3, yPosition, { width: 95, ellipsis: true });
      doc.text(categoria, col4, yPosition, { width: 70, ellipsis: true });
      
      // Resaltar consumo si excedió el límite
      const consumoNum = Number(consumo);
      const limiteNum = Number(limiteBasico);
      if (consumoNum > limiteNum && limiteNum > 0) {
        doc.fillColor('#dc2626').font('Helvetica-Bold');
      }
      doc.text(`${consumo} m³`, col5, yPosition, { width: 60 });
      doc.fillColor('black').font('Helvetica');
      
      doc.text(`${limiteBasico} m³`, col6, yPosition, { width: 50 });
      doc.text(`${total}`, col7, yPosition, { width: 52, align: 'right' });
      
      yPosition += 18;

      // Detalles de comprobantes (compacto)
      if (p.comprobantes.length > 0) {
        doc.fontSize(6.5).fillColor('#64748b');
        p.comprobantes.forEach((c) => {
          if (yPosition > 690) {
            doc.addPage();
            yPosition = 50;
          }
          const mora = Number(c.moraAcumulada) > 0 ? ` | Mora: Bs ${c.moraAcumulada.toFixed(2)}` : '';
          const excedio = Number(c.montoAdicional) > 0 ? ' ⚠️ Excedió límite' : '';
          doc.text(
            `   → Comp. #${c.idComprobante} | Emisión: ${new Date(c.fechaEmision).toLocaleDateString('es-ES')}${mora}${excedio}`,
            col1 + 5,
            yPosition,
            { width: 510 }
          );
          yPosition += 10;
        });
        doc.fillColor('black').fontSize(7.5);
        yPosition += 3;
      }
    });

    // SECCIÓN DE ESTADÍSTICAS
    doc.addPage();
    
    // Título de estadísticas
    doc.rect(0, 0, 612, 60).fill('#1e3a8a');
    doc.fillColor('white')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('ESTADÍSTICAS DEL PERIODO', 50, 20, { align: 'center' });
    
    doc.fillColor('black').moveDown(3);
    doc.y = 80;

    // Tarjetas de estadísticas (2x3 grid)
    const cardWidth = 165;
    const cardHeight = 80;
    const cardSpacing = 20;
    const startX = 50;
    let startY = 100;

    const estadisticas = [
      { titulo: 'Total Recaudado', valor: `Bs ${totalRecaudado.toFixed(2)}`, color: '#10b981' },
      { titulo: 'Total de Pagos', valor: totalPagos.toString(), color: '#3b82f6' },
      { titulo: 'Socios Atendidos', valor: sociosUnicos.size.toString(), color: '#8b5cf6' },
      { titulo: 'Consumo Promedio', valor: `${consumoPromedio.toFixed(2)} m³`, color: '#06b6d4' },
      { titulo: 'Usuarios con Mora', valor: comprobantesConMora.length.toString(), color: '#ef4444' },
      { titulo: 'Excedieron Límite', valor: excedidos.toString(), color: '#f59e0b' }
    ];

    estadisticas.forEach((stat, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = startX + col * (cardWidth + cardSpacing);
      const y = startY + row * (cardHeight + cardSpacing);

      // Tarjeta
      doc.rect(x, y, cardWidth, cardHeight).fill('#ffffff');
      doc.rect(x, y, cardWidth, cardHeight).stroke('#e2e8f0');
      
      // Barra de color superior
      doc.rect(x, y, cardWidth, 4).fill(stat.color);
      
      // Título
      doc.fontSize(9).fillColor('#64748b').font('Helvetica')
         .text(stat.titulo, x + 10, y + 15, { width: cardWidth - 20, align: 'center' });
      
      // Valor
      doc.fontSize(20).fillColor(stat.color).font('Helvetica-Bold')
         .text(stat.valor, x + 10, y + 35, { width: cardWidth - 20, align: 'center' });
    });

    // ANÁLISIS ADICIONAL
    startY = 100 + 2 * (cardHeight + cardSpacing) + 30;
    doc.fontSize(14).fillColor('black').font('Helvetica-Bold')
       .text('Análisis del Periodo', 50, startY);
    
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    
    const promedioMora = comprobantesConMora.length > 0
      ? comprobantesConMora.reduce((sum, c) => sum + Number(c.moraAcumulada), 0) / comprobantesConMora.length
      : 0;
    
    const porcentajeExcedidos = todosComprobantes.length > 0
      ? (excedidos / todosComprobantes.length * 100).toFixed(1)
      : 0;

    doc.text(`• El ${porcentajeExcedidos}% de los usuarios excedieron el límite básico de consumo.`, 70);
    doc.text(`• Mora promedio por usuario: Bs ${promedioMora.toFixed(2)}`, 70);
    doc.text(`• Recaudación promedio por pago: Bs ${(totalRecaudado / totalPagos).toFixed(2)}`, 70);
    
    if (comprobantesConMora.length > 0) {
      const totalMora = comprobantesConMora.reduce((sum, c) => sum + Number(c.moraAcumulada), 0);
      doc.text(`• Total recaudado por mora: Bs ${totalMora.toFixed(2)}`, 70);
    }

    // Análisis por categoría
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('Consumo por Categoría:', 50);
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');

    categorias.forEach(cat => {
      const consumosCat = todosComprobantes.filter(
        c => c.lectura.medidor.categoria.idCategoria === cat.idCategoria
      );
      if (consumosCat.length > 0) {
        const totalConsumoCat = consumosCat.reduce((sum, c) => sum + Number(c.lectura.consumo), 0);
        const promedioCat = totalConsumoCat / consumosCat.length;
        const excedidosCat = consumosCat.filter(c => Number(c.montoAdicional) > 0).length;
        
        doc.text(
          `• ${cat.tipo}: ${consumosCat.length} lecturas | Promedio: ${promedioCat.toFixed(2)} m³ | Excedieron: ${excedidosCat}`,
          70
        );
      }
    });

    // PIE DE PÁGINA lo hare despues 

    doc.end();
  } catch (err) {
    console.error('Error generarReportePago:', err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, message: 'Error al generar el reporte' });
    } else {
      res.end();
    }
  }
};
