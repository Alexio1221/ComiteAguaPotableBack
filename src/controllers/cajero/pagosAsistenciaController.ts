import { Request, Response } from 'express';
import prisma from '../../config/client';
import PDFDocument from 'pdfkit';
import { Prisma } from '@prisma/client';

export const generarReportePagosAsistencia = async (req: Request, res: Response) => {
    try {
        const { socio, mes, anio } = req.body;

        const whereReunion: Prisma.ReunionWhereInput = {};

        // Filtro por mes y año (usa fechaReunion)
        if (mes && anio) {
            const inicio = new Date(Number(anio), Number(mes) - 1, 1);
            const fin = new Date(Number(anio), Number(mes), 0, 23, 59, 59);
            whereReunion.fechaReunion = { gte: inicio, lte: fin };
        } else if (anio) {
            const inicio = new Date(Number(anio), 0, 1);
            const fin = new Date(Number(anio), 11, 31, 23, 59, 59);
            whereReunion.fechaReunion = { gte: inicio, lte: fin };
        }

        // Obtener reuniones con sus asistencias
        const reuniones = await prisma.reunion.findMany({
            where: whereReunion,
            include: {
                tarifa: true,
                asistencias: {
                    include: {
                        usuario: true,
                        pagos: {
                            include: {
                                cajero: true
                            }
                        }
                    },
                    where: socio ? {
                        usuario: {
                            nombre: { contains: String(socio), mode: 'insensitive' }
                        }
                    } : undefined
                }
            },
            orderBy: { fechaReunion: 'desc' }
        });

        // Obtener todas las tarifas de reunión
        const tarifas = await prisma.tarifaReunion.findMany({
            orderBy: { nombreReunion: 'asc' }
        });

        // Calcular estadísticas
        const todasAsistencias = reuniones.flatMap(r => r.asistencias);

        // Calcular deudas
        const asistenciasConDeuda = todasAsistencias.map(a => {
            let monto = 0;
            const reunion = reuniones.find(r => r.idReunion === a.idReunion);

            if (reunion) {
                if (a.estado === 'AUSENTE') {
                    monto = Number(reunion.tarifa.ausente);
                } else if (a.estado === 'RETRASO') {
                    monto = Number(reunion.tarifa.retraso);
                }
            }

            const pagado = a.pagos.length > 0 && a.pagos[0].estado;

            return {
                ...a,
                reunion,
                montoDeuda: monto,
                pagado,
                fechaPago: pagado && a.pagos[0]?.fechaPago ? a.pagos[0].fechaPago : null,
                cajero: pagado && a.pagos[0]?.cajero ? a.pagos[0].cajero : null
            };
        });

        const deudaPendiente = asistenciasConDeuda
            .filter(a => !a.pagado && a.montoDeuda > 0)
            .reduce((sum, a) => sum + a.montoDeuda, 0);

        const totalRecaudado = asistenciasConDeuda
            .filter(a => a.pagado)
            .reduce((sum, a) => sum + a.montoDeuda, 0);

        const totalDeudas = asistenciasConDeuda.filter(a => a.montoDeuda > 0).length;
        const deudasPagadas = asistenciasConDeuda.filter(a => a.pagado && a.montoDeuda > 0).length;
        const deudasPendientes = totalDeudas - deudasPagadas;

        // Estadísticas por estado
        const ausentes = todasAsistencias.filter(a => a.estado === 'AUSENTE').length;
        const retrasos = todasAsistencias.filter(a => a.estado === 'RETRASO').length;
        const justificados = todasAsistencias.filter(a => a.estado === 'JUSTIFICADO').length;
        const presentes = todasAsistencias.filter(a => a.estado === 'PRESENTE').length;

        // Socios únicos con deudas
        const sociosConDeuda = new Set(
            asistenciasConDeuda.filter(a => !a.pagado && a.montoDeuda > 0).map(a => a.idUsuario)
        );

        // Crear PDF - Tamaño CARTA
        const doc = new PDFDocument({
            margin: 50,
            size: 'LETTER',
            bufferPages: true
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="reporte_pagos_asistencia.pdf"'
        );
        doc.pipe(res);

        // ENCABEZADO PROFESIONAL
        doc.rect(0, 0, 612, 80).fill('#7c3aed');
        doc.fillColor('white')
            .fontSize(22)
            .font('Helvetica-Bold')
            .text('REPORTE DE PAGOS POR ASISTENCIA', 50, 20, { align: 'center' });

        doc.fontSize(10)
            .font('Helvetica')
            .text('Sistema de Gestión de Reuniones', { align: 'center' });

        doc.fillColor('black').moveDown(3);

        // INFORMACIÓN DE FILTROS
        doc.y = 100;
        doc.fontSize(11).font('Helvetica-Bold').text('Filtros Aplicados:', 50);
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');

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
        doc.text(`• Total de reuniones: ${reuniones.length}`, 70);

        doc.moveDown(1.5);

        // TABLA DE TARIFAS DE REUNIÓN
        doc.fontSize(11).font('Helvetica-Bold').text('Tarifas Vigentes por Tipo de Reunión:', 50);
        doc.moveDown(0.5);

        const tarTableTop = doc.y;
        const tarCol1 = 50;   // Tipo
        const tarCol2 = 250;  // Tarifa Ausente
        const tarCol3 = 400;  // Tarifa Retraso

        doc.fontSize(8).font('Helvetica-Bold');
        doc.rect(tarCol1, tarTableTop - 5, 512, 18).fill('#f1f5f9');
        doc.fillColor('black');
        doc.text('Tipo de Reunión', tarCol1 + 5, tarTableTop);
        doc.text('Tarifa por Ausencia', tarCol2, tarTableTop);
        doc.text('Tarifa por Retraso', tarCol3, tarTableTop);

        let tarYPos = tarTableTop + 20;
        doc.font('Helvetica').fontSize(8);

        tarifas.forEach((tar, index) => {
            if (index % 2 === 0) {
                doc.rect(tarCol1, tarYPos - 3, 512, 14).fill('#fafafa');
            }
            doc.fillColor('black');
            doc.text(tar.nombreReunion, tarCol1 + 5, tarYPos, { width: 195, ellipsis: true });
            doc.text(`Bs ${Number(tar.ausente).toFixed(2)}`, tarCol2, tarYPos, { width: 145 });
            doc.text(`Bs ${Number(tar.retraso).toFixed(2)}`, tarCol3, tarYPos, { width: 157 });
            tarYPos += 16;
        });

        doc.moveDown(1.5);

        // LÍNEA SEPARADORA
        doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#cbd5e1');
        doc.moveDown(1);

        if (asistenciasConDeuda.length === 0) {
            const pageWidth = doc.page.width;
            const margin = 50; // o el que uses
            const text = 'No se encontraron pagos con los filtros aplicados.';

            doc
                .fontSize(12)
                .text(text, margin, doc.y, {
                    width: pageWidth - margin * 2, // usa todo el ancho de la página
                    align: 'center'
                });

            doc.end();
            return;
        }

        // TABLA DE DEUDAS POR ASISTENCIA
        doc.fontSize(14).font('Helvetica-Bold').text('Detalle de Deudas por Asistencia', 50);
        doc.moveDown(0.8);

        // Encabezados de tabla
        const tableTop = doc.y;
        const col1 = 50;   // Fecha Reunión
        const col2 = 115;  // Tipo Reunión
        const col3 = 230;  // Socio
        const col4 = 350;  // Estado
        const col5 = 420;  // Monto
        const col6 = 485;  // Estado Pago

        doc.fontSize(8).font('Helvetica-Bold');
        doc.rect(col1, tableTop - 5, 512, 20).fill('#f1f5f9');
        doc.fillColor('black');
        doc.text('Fecha', col1 + 5, tableTop);
        doc.text('Tipo Reunión', col2, tableTop);
        doc.text('Socio', col3, tableTop);
        doc.text('Asistencia', col4, tableTop);
        doc.text('Monto', col5, tableTop);
        doc.text('Pago', col6, tableTop);

        let yPosition = tableTop + 25;
        doc.font('Helvetica').fontSize(7.5);

        // Ordenar por fecha de reunión descendente y luego por estado de pago
        const asistenciasOrdenadas = asistenciasConDeuda
            .filter(a => a.montoDeuda > 0) // Solo mostrar los que tienen deuda
            .sort((a, b) => {
                const fechaA = a.reunion?.fechaReunion ? new Date(a.reunion.fechaReunion).getTime() : 0;
                const fechaB = b.reunion?.fechaReunion ? new Date(b.reunion.fechaReunion).getTime() : 0;
                return fechaB - fechaA;
            });

        asistenciasOrdenadas.forEach((a, index) => {
            // Verificar si necesitamos nueva página
            if (yPosition > 670) {
                doc.addPage();
                yPosition = 50;

                // Re-dibujar encabezados
                doc.fontSize(8).font('Helvetica-Bold');
                doc.rect(col1, yPosition - 5, 512, 20).fill('#f1f5f9');
                doc.fillColor('black');
                doc.text('Fecha', col1 + 5, yPosition);
                doc.text('Tipo Reunión', col2, yPosition);
                doc.text('Socio', col3, yPosition);
                doc.text('Asistencia', col4, yPosition);
                doc.text('Monto', col5, yPosition);
                doc.text('Pago', col6, yPosition);
                yPosition += 25;
                doc.font('Helvetica').fontSize(7.5);
            }

            const fecha = a.reunion?.fechaReunion
                ? new Date(a.reunion.fechaReunion).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                })
                : '—';

            const tipoReunion = a.reunion?.tarifa?.nombreReunion ?? '—';
            const socioNombre = `${a.usuario.nombre} ${a.usuario.apellidos}`.trim();

            // Mapear estado de asistencia
            const estadoTexto = {
                'AUSENTE': 'Ausente',
                'RETRASO': 'Retraso',
                'PRESENTE': 'Presente',
                'JUSTIFICADO': 'Justificado'
            }[a.estado] || a.estado;

            const colorEstado = {
                'AUSENTE': '#dc2626',
                'RETRASO': '#f59e0b',
                'PRESENTE': '#10b981',
                'JUSTIFICADO': '#3b82f6'
            }[a.estado] || '#000000';

            // Alternar color de fondo
            if (index % 2 === 0) {
                doc.rect(col1, yPosition - 3, 512, 18).fill('#fafafa');
            }

            doc.fillColor('black');
            doc.text(fecha, col1 + 5, yPosition, { width: 60 });
            doc.text(tipoReunion, col2, yPosition, { width: 110, ellipsis: true });
            doc.text(socioNombre, col3, yPosition, { width: 115, ellipsis: true });

            // Estado de asistencia con color
            doc.fillColor(colorEstado).font('Helvetica-Bold');
            doc.text(estadoTexto, col4, yPosition, { width: 65 });

            // Monto
            doc.fillColor('black').font('Helvetica');
            doc.text(`Bs ${a.montoDeuda.toFixed(2)}`, col5, yPosition, { width: 60 });

            // Estado de pago
            if (a.pagado) {
                doc.fillColor('#10b981').font('Helvetica-Bold');
                doc.text('PAGADO', col6, yPosition, { width: 72 });
            } else {
                doc.fillColor('#dc2626').font('Helvetica-Bold');
                doc.text('PENDIENTE', col6, yPosition, { width: 72 });
            }

            doc.fillColor('black').font('Helvetica');
            yPosition += 20;

            // Detalles adicionales (lugar, motivo, pago)
            doc.fontSize(6.5).fillColor('#64748b');

            if (a.reunion) {
                if (yPosition > 685) {
                    doc.addPage();
                    yPosition = 50;
                }
                doc.text(
                    `   → Lugar: ${a.reunion.lugar} | Motivo: ${a.reunion.motivo}`,
                    col1 + 5,
                    yPosition,
                    { width: 510, ellipsis: true }
                );
                yPosition += 10;
            }

            if (a.pagado && a.cajero && a.fechaPago) {
                if (yPosition > 685) {
                    doc.addPage();
                    yPosition = 50;
                }
                doc.text(
                    `   → Pagado el ${new Date(a.fechaPago).toLocaleDateString('es-ES')} por cajero: ${a.cajero.nombre} ${a.cajero.apellidos}`,
                    col1 + 5,
                    yPosition,
                    { width: 510 }
                );
                yPosition += 10;
            }

            if (a.observacion) {
                if (yPosition > 685) {
                    doc.addPage();
                    yPosition = 50;
                }
                doc.text(
                    `   → Observación: ${a.observacion}`,
                    col1 + 5,
                    yPosition,
                    { width: 510 }
                );
                yPosition += 10;
            }

            doc.fillColor('black').fontSize(7.5);
            yPosition += 3;
        });

        // SECCIÓN DE ESTADÍSTICAS
        doc.addPage();

        // Título de estadísticas
        doc.rect(0, 0, 612, 60).fill('#7c3aed');
        doc.fillColor('white')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text('ESTADÍSTICAS DEL PERIODO', 50, 20, { align: 'center' });

        doc.fillColor('black');
        doc.y = 80;

        // Tarjetas de estadísticas (2x4 grid)
        const cardWidth = 165;
        const cardHeight = 80;
        const cardSpacing = 20;
        const startX = 50;
        let startY = 100;

        const estadisticas = [
            { titulo: 'Total Recaudado', valor: `Bs ${totalRecaudado.toFixed(2)}`, color: '#10b981' },
            { titulo: 'Deuda Pendiente', valor: `Bs ${deudaPendiente.toFixed(2)}`, color: '#dc2626' },
            { titulo: 'Total Deudas', valor: totalDeudas.toString(), color: '#3b82f6' },
            { titulo: 'Deudas Pagadas', valor: deudasPagadas.toString(), color: '#10b981' },
            { titulo: 'Deudas Pendientes', valor: deudasPendientes.toString(), color: '#f59e0b' },
            { titulo: 'Total Ausentes', valor: ausentes.toString(), color: '#dc2626' },
            { titulo: 'Total Retrasos', valor: retrasos.toString(), color: '#f59e0b' },
            { titulo: 'Total Justificados', valor: justificados.toString(), color: '#3b82f6' },
            { titulo: 'Total Presentes', valor: presentes.toString(), color: '#10b981' }
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
        startY = 100 + 3 * (cardHeight + cardSpacing) + 20;
        doc.fontSize(14).fillColor('black').font('Helvetica-Bold')
            .text('Análisis del Periodo', 50, startY);

        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        const totalAsistencias = presentes + ausentes + retrasos + justificados;
        const porcentajeAusentes = totalAsistencias > 0
            ? (ausentes / totalAsistencias * 100).toFixed(1)
            : 0;
        const porcentajeRetrasos = totalAsistencias > 0
            ? (retrasos / totalAsistencias * 100).toFixed(1)
            : 0;
        const porcentajePagadas = totalDeudas > 0
            ? (deudasPagadas / totalDeudas * 100).toFixed(1)
            : 0;

        doc.text(`• El ${porcentajeAusentes}% de las asistencias fueron ausencias (${ausentes} de ${totalAsistencias}).`, 70);
        doc.text(`• El ${porcentajeRetrasos}% de las asistencias fueron retrasos (${retrasos} de ${totalAsistencias}).`, 70);
        doc.text(`• ${justificados} asistencias fueron justificadas (sin multa).`, 70);
        doc.text(`• ${presentes} asistencias fueron presentes.`, 70);
        doc.text(`• El ${porcentajePagadas}% de las deudas han sido pagadas.`, 70);
        doc.text(`• Promedio de deuda pendiente por socio: Bs ${sociosConDeuda.size > 0 ? (deudaPendiente / sociosConDeuda.size).toFixed(2) : '0.00'}`, 70);

        // Análisis por tipo de reunión
        doc.moveDown(1);
        doc.fontSize(12).font('Helvetica-Bold').text('Resumen por Tipo de Reunión:', 50);
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');

        const reunionesPorTipo = reuniones.reduce((acc, r) => {
            const tipo = r.tarifa.nombreReunion;
            if (!acc[tipo]) {
                acc[tipo] = { reuniones: 0, ausentes: 0, retrasos: 0, totalDeuda: 0, pagado: 0 };
            }
            acc[tipo].reuniones++;

            r.asistencias.forEach(a => {
                if (a.estado === 'AUSENTE') acc[tipo].ausentes++;
                if (a.estado === 'RETRASO') acc[tipo].retrasos++;

                const asistenciaConDeuda = asistenciasConDeuda.find(
                    ad => ad.idReunion === a.idReunion && ad.idUsuario === a.idUsuario
                );

                if (asistenciaConDeuda) {
                    acc[tipo].totalDeuda += asistenciaConDeuda.montoDeuda;
                    if (asistenciaConDeuda.pagado) {
                        acc[tipo].pagado += asistenciaConDeuda.montoDeuda;
                    }
                }
            });

            return acc;
        }, {} as Record<string, any>);

        Object.entries(reunionesPorTipo).forEach(([tipo, datos]: [string, any]) => {
            doc.text(
                `• ${tipo}: ${datos.reuniones} reuniones | Ausentes: ${datos.ausentes} | Retrasos: ${datos.retrasos} | Deuda total: Bs ${datos.totalDeuda.toFixed(2)} | Recaudado: Bs ${datos.pagado.toFixed(2)}`,
                70
            );
        });

        // PIE DE PÁGINA

        doc.end();
    } catch (err) {
        console.error('Error generarReportePagosAsistencia:', err);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, message: 'Error al generar el reporte' });
        } else {
            res.end();
        }
    }
};