const bcrypt=require('bcryptjs');
const administradorModelo=require('../Modelo/administrador_modelo');
const ongModelo=require('../Modelo/ong_modelo');
const { firmarToken } = require('./autenticacion_middleware');

async function iniciarSesionAdmin(req,res) {
    const { correo, contrasena } = req.body || {};
  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Escribe tu correo y tu contraseña' });
    }
    const admin=await administradorModelo.buscarAdminPorEmail(String(correo).trim().toLowerCase());
    if (!admin || !(await bcrypt.compare(String(contrasena), admin.contrasena))) {
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }

  const { contrasena: _, ...datosAdmin } = admin;
  const token = firmarToken({ id: admin.id_admin, rol: 'admin' });
  res.json({ token, administrador: datosAdmin });
}

async function iniciarSesionOng(req, res) {
  const { clave, contrasena } = req.body || {};
  if (!clave || !contrasena) {
    return res.status(400).json({ error: 'Escribe tu clave y tu contraseña' });
  }

  const ong = await ongModelo.buscarOngPorClave(String(clave).trim());
  if (!ong || !(await bcrypt.compare(String(contrasena), ong.contrasena))) {
    return res.status(401).json({ error: 'Clave o contraseña incorrectas' });
  }

  const { contrasena: _, ...datosOng } = ong;
  const token = firmarToken({ id: ong.id_ong, rol: 'ong' });
  res.json({ token, ong: datosOng });
}

module.exports={iniciarSesionAdmin,iniciarSesionOng};