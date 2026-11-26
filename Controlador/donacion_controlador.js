const donacionModelo = require('../Modelo/donacion_modelo');
const ayudanteModelo = require('../Modelo/ayudante_modelo');

async function listarMisDonaciones(req, res) {
  const donaciones = await donacionModelo.listarDonacionesDeUsuario(req.sesion.id);
  res.json({ donaciones: donaciones.map((d) => conMiRol(d, req.sesion.id)) });
}

function conMiRol(donacion, id_usuario) {
  return { ...donacion, mi_rol: donacion.id_donante === id_usuario ? 'DONANTE' : 'RECEPTOR' };
}

function leerId(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function donacionDeMiOng(req, res) {
  const id_solicitud = leerId(req.params.id);
  if (!id_solicitud) {
    res.status(400).json({ error: 'El id de la donación no es válido' });
    return null;
  }
  const donacion = await donacionModelo.obtenerDonacion(id_solicitud);
  if (!donacion || donacion.id_ong !== req.sesion.id || !['Aceptada', 'Completada'].includes(donacion.estado)) {
    res.status(404).json({ error: 'No encontramos esa donación' });
    return null;
  }
  return donacion;
}

async function listarDonaciones(req, res) {
  res.json({ donaciones: await donacionModelo.listarDonacionesDeOng(req.sesion.id) });
}

async function obtenerDonacion(req, res) {
  const donacion = await donacionDeMiOng(req, res);
  if (!donacion) return;
  const ayudante = await ayudanteModelo.obtenerAyudante(donacion.id_receptor);
  res.json({ donacion: { ...donacion, receptor_ayudante: ayudante } });
}

async function actualizarEntrega(req, res) {
  const donacion = await donacionDeMiOng(req, res);
  if (!donacion) return;

  const { entregado, recibido } = req.body || {};
  const cambios = {};
  if (entregado !== undefined) {
    if (typeof entregado !== 'boolean') return res.status(400).json({ error: 'entregado debe ser true o false' });
    cambios.entregado = entregado;
  }
  if (recibido !== undefined) {
    if (typeof recibido !== 'boolean') return res.status(400).json({ error: 'recibido debe ser true o false' });
    cambios.recibido = recibido;
  }
  if (Object.keys(cambios).length === 0) return res.status(400).json({ error: 'Indica entregado o recibido' });

  const actualizada = await donacionModelo.marcarEntrega(donacion.id_solicitud, cambios);
  if (!actualizada) return res.status(409).json({ error: 'Esta donación ya no se puede modificar' });
  res.json({ donacion: actualizada });
}

async function terminarCiclo(req, res) {
  const donacion = await donacionDeMiOng(req, res);
  if (!donacion) return;
  if (donacion.estado !== 'Aceptada') return res.status(409).json({ error: 'Esta donación ya no está en curso' });
  if (!donacion.entregado || !donacion.recibido) {
    return res.status(400).json({ error: 'Confirma la entrega y la recepción antes de terminar el ciclo' });
  }

  const terminada = await donacionModelo.terminarCiclo(donacion.id_solicitud);
  if (!terminada) return res.status(409).json({ error: 'No se pudo terminar el ciclo, recarga la página' });
  res.json({ donacion: terminada });
}

module.exports = { conMiRol, listarMisDonaciones, listarDonaciones, obtenerDonacion, actualizarEntrega, terminarCiclo };
