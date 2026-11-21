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

async function iniciarSesionOng(req,res) {
    const{clave,contrasena}=req.body||{};
    if (!clave || !contrasena) {
    return res.status(400).json({ error: 'Escribe tu clave y tu contraseña' });
  }

  const ong=await ongModelo.buscarAdminPorEmail(String(correo).trim().toLowerCase());
  if (!admin || !(await bcrypt.compare(String(contrasena), admin.contrasena))) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }
  const { contrasena: _, ...datosAdmin } = admin;
  const token = firmarToken({ id: admin.id_admin, rol: 'admin' });
  res.json({ token, administrador: datosAdmin });
}

module.exports={iniciarSesionAdmin,iniciarSesionOng};