import { Router } from 'express';
import { requireAuth, requireRol } from '../middleware/index.js';
import { ReporteRepository } from '../repositories/reportes.js';

function toCsv(rows) {
  if (!rows.length) return '';
  const claves = Object.keys(rows[0]);
  const encabezado = claves.join(',');
  const cuerpo = rows
    .map((row) =>
      claves
        .map((k) => {
          const v = row[k] == null ? '' : String(row[k]);
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(',')
    )
    .join('\n');
  return `${encabezado}\n${cuerpo}`;
}

function csvResponse(res, filename, rows) {
  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv);
}

export function reportesRouter() {
  const r = Router();
  r.use(requireAuth, requireRol('coordinacion'));

  r.get('/cobertura', (req, res) => {
    const { anioId, grado, asignatura } = req.query;
    const rows = ReporteRepository.cobertura({
      anioId: anioId ? Number(anioId) : undefined,
      grado,
      asignatura,
    });
    const resumen = ReporteRepository.coberturaResumen({
      anioId: anioId ? Number(anioId) : undefined,
      grado,
      asignatura,
    });
    if (req.query.csv !== undefined) return csvResponse(res, 'cobertura_curricular.csv', rows);
    res.json({ resumen, rows });
  });

  r.get('/uso', (req, res) => {
    const { desde, hasta, page = 1, pageSize = 100 } = req.query;
    const resultado = ReporteRepository.uso({
      desde: desde || undefined,
      hasta: hasta || undefined,
      page: Number(page),
      pageSize: Number(pageSize),
    });
    if (req.query.csv !== undefined) return csvResponse(res, 'reporte_uso.csv', resultado.data);
    res.json(resultado);
  });

  r.get('/asistencia', (req, res) => {
    const { cursoId } = req.query;
    const resultado = ReporteRepository.asistencia({
      cursoId: cursoId ? Number(cursoId) : undefined,
    });
    if (req.query.csv !== undefined) {
      const rows = resultado.rows.map((r) => ({
        curso: r.curso_nombre,
        estudiante: r.estudiante,
        email: r.email,
        total_sesiones: r.total_sesiones,
        presentes: r.presentes,
        ausentes: r.ausentes,
        justificados: r.justificados,
        pct_asistencia: r.pct_asistencia,
      }));
      return csvResponse(res, 'reporte_asistencia.csv', rows);
    }
    res.json(resultado);
  });

  return r;
}