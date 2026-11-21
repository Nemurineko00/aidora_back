const bcrypt=require('bcryptjs');
const usuarioModelo=require('../Modelo/usuario_modelo');
const { firmarToken, tokenModelo } = require('./autenticacion_middleware');

function sinContrasena(usuario) {
  const { contrasena_hash, ...resto } = usuario;
  return resto;
}

const CAMPOS_REGISTRO = ['nombre', 'apellidoP', 'apellidoM', 'correo', 'contrasena'];

async function registrar(req, res) {
  const datos = req.body || {};

  const faltantes = CAMPOS_REGISTRO.filter((campo) => !String(datos[campo] || '').trim());
  if (faltantes.length > 0) {
    return res.status(400).json({ error: `Faltan campos: ${faltantes.join(', ')}` });
  }

  const email = datos.correo.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'El correo no es válido' });
  }
  if (datos.contrasena.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (await usuarioModelo.buscarPorEmail(email)) {
    return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
  }

  const contrasenaHash = await bcrypt.hash(datos.contrasena, 10);

  try {
    const usuario = await usuarioModelo.crearUsuario({
      nombre: datos.nombre.trim(),
      apellido: `${datos.apellidoP.trim()} ${datos.apellidoM.trim()}`,
      email,
      contrasenaHash,
    });
    return res.status(201).json({ usuario });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }
    throw error;
  }
}

async function iniciarSesion(req,res) {
    const{correo,contrasena}=req.body||{};
    if(!correo||!contrasena){
        return res.status(400).json({error:'Escribe tu correo y tu contraseña'});
    }
    const usuario=await usuarioModelo.buscarPorEmail(String(correo).trim().toLowerCase());
    
    if (!usuario || !(await bcrypt.compare(String(contrasena), usuario.contrasena_hash))) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }

  if (!usuario.activo ) {
    return res.status(403).json({ error: 'Esta cuenta está desactivada' });
  }
  
  const token =firmarToken({id:usuario.id_usuario,rol:'usuario'});
  res.json({token,usuario:sinContrasena(usuario) });
}

async function verPerfil(req,res) {
  const usuario=await usuarioModelo.listarUsuarioPorId(req.sesion.id);  if(!usuario)return res.status(404).json({error:'No encontramos tu cuenta'});
  res.json({usuario});
}

async function cerrarSesion(req,res) {
  await tokenModelo.revocar(req.sesion.jti, req.sesion.id, req.sesion.exp);
  await tokenModelo.limpiarExpirados();
  res.json({ mensaje: 'Sesión cerrada' });
}
module.exports = { registrar,iniciarSesion,verPerfil,cerrarSesion };
