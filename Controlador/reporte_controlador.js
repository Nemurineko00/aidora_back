const reporteModelo = require('../Modelo/reporte_modelo');
const publicacionModelo = require('../Modelo/publicacion_modelo');
const { urlDeArchivo } = require('./archivos');

const MOTIVOS_VALIDOS = [
  'Medicamento caducado',
  'Medicamento en mal estado',
  'Información incorrecta en la publicación',
  'Comportamiento inapropiado del usuario',
  'Publicación fraudulenta',
];

function leerMotivos(valor) {
  if (Array.isArray(valor)) return valor;
  if (typeof valor !== 'string' || !valor.trim()) return [];
  try {
    const lista = JSON.parse(valor);
    return Array.isArray(lista) ? lista : [lista];
  } catch {
    return [valor];
  }
}

function esMotivoValido(motivo) {
  if (MOTIVOS_VALIDOS.includes(motivo)) return true;
  const texto = motivo.startsWith('Otro:') ? motivo.slice('Otro:'.length).trim() : '';
  return texto.length >= 5 && texto.length <= 300;
}

async function crearReporte(req, res) {
  const id_usuario = req.sesion.id;
  const id_pub = Number(req.body?.id_pub);
  if (!Number.isInteger(id_pub)) {
    return res.status(400).json({ error: 'Indica la publicación que quieres reportar (id_pub)' });
  }

  const motivos = [...new Set(leerMotivos(req.body.motivos).map((m) => String(m).trim()).filter(Boolean))];
  if (motivos.length === 0) {
    return res.status(400).json({ error: 'Selecciona al menos un motivo' });
  }
  if (motivos.length > MOTIVOS_VALIDOS.length + 1) {
    return res.status(400).json({ error: 'Son demasiados motivos' });
  }
  const invalidos = motivos.filter((m) => !esMotivoValido(m));
  if (invalidos.length > 0) {
    return res.status(400).json({ error: 'Algún motivo no es válido. Si eliges "Otro", descríbelo con 5 a 300 caracteres' });
  }

  const publicacion = await publicacionModelo.listarPublicacionesPorId(id_pub);
  if (!publicacion) {
    return res.status(404).json({ error: 'No encontramos esa publicación' });
  }
  if (publicacion.id_usuario === id_usuario) {
    return res.status(400).json({ error: 'No puedes reportar tu propia publicación' });
  }
  if (await reporteModelo.buscarReportePendiente(id_usuario, id_pub)) {
    return res.status(409).json({ error: 'Ya reportaste esta publicación y está en revisión' });
  }

  const reporte = await reporteModelo.crearReporte({ id_pub, id_usuario, motivos, evidencia: urlDeArchivo(req.file) });
  res.status(201).json({ reporte });
}
module.exports={crearReporte,MOTIVOS_VALIDOS};