const { reportes,detalle_reporte } = require('../datos/memoria');

async function listar() {
  return reportes.map((r)=>({
    ...r,
    motivos:detalle_reporte.filter((d)=>d.id_reporte===r.detalle_reporte)
  }));
}

module.exports = { listar };
