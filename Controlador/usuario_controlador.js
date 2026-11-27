const bcrypt=require('bcryptjs');
const usuarioModelo=require('../Modelo/usuario_modelo');
const ayudanteModelo=require('../Modelo/ayudante_modelo');
const { firmarToken, tokenModelo } = require('./autenticacion_middleware');
const { validar, limpiar } = require('./validaciones');

function sinContrasena(usuario) {
  const { contrasena_hash, ...resto } = usuario;
  return resto;
}

const CAMPOS_REGISTRO = ['nombre', 'apellidoP', 'apellidoM', 'correo', 'edad', 'contrasena'];

async function registrar(req, res) {
  const datos = req.body || {};

  const faltantes = CAMPOS_REGISTRO.filter((campo) => !String(datos[campo] || '').trim());
  if (faltantes.length > 0) {
    return res.status(400).json({ error: `Faltan campos: ${faltantes.join(', ')}` });
  }

  const errorDatos =
    validar.nombrePersona(datos.nombre, 'El nombre') ||
    validar.nombrePersona(datos.apellidoP, 'El apellido paterno') ||
    validar.nombrePersona(datos.apellidoM, 'El apellido materno') ||
    validar.correo(datos.correo) ||
    validar.edad(datos.edad) ||
    validar.contrasenaNueva(datos.contrasena);
  if (errorDatos) return res.status(400).json({ error: errorDatos });

  const email = limpiar(datos.correo).toLowerCase();
  if (await usuarioModelo.buscarPorEmail(email)) {
    return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
  }

  const contrasenaHash = await bcrypt.hash(datos.contrasena, 10);

  try {
    const usuario = await usuarioModelo.crearUsuario({
      nombre: limpiar(datos.nombre),
      apellido: `${limpiar(datos.apellidoP)} ${limpiar(datos.apellidoM)}`,
      email,
      edad: Number(datos.edad),
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
    const errorLogin = validar.correo(correo) || validar.contrasenaLogin(contrasena);
    if (errorLogin) return res.status(400).json({ error: errorLogin });
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

async function editarPerfil(req,res) {
  const datos=req.body||{};
  const cambios={};


  if(datos.nombre!==undefined){
    const errorNombre = validar.nombrePersona(datos.nombre, 'El nombre');
    if (errorNombre) return res.status(400).json({ error: errorNombre });
    cambios.nombre = limpiar(datos.nombre);
  }

  if (datos.apellido !== undefined) {
    const apellido = limpiar(datos.apellido);
    if (!apellido) return res.status(400).json({ error: 'El apellido es obligatorio' });
    if (apellido.length > 101) return res.status(400).json({ error: 'El apellido no puede pasar de 100 caracteres' });
    if (!/^[\p{L}][\p{L}' .-]*$/u.test(apellido)) return res.status(400).json({ error: 'El apellido solo puede llevar letras, espacios, apóstrofo o guion' });
    cambios.apellido = apellido;
  }
  if (datos.correo !== undefined) {
    const errorCorreo = validar.correo(datos.correo);
    if (errorCorreo) return res.status(400).json({ error: errorCorreo });
    const email = limpiar(datos.correo).toLowerCase();
    const otro = await usuarioModelo.buscarPorEmail(email);
    if (otro && otro.id_usuario !== req.sesion.id) {
      return res.status(409).json({ error: 'Ese correo ya lo usa otra cuenta' });
    }
    cambios.email = email;
  }

  if (datos.edad !== undefined) {
    const errorEdad = validar.edad(datos.edad);
    if (errorEdad) return res.status(400).json({ error: errorEdad });
    cambios.edad = Number(datos.edad);
  }

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'No mandaste nada que cambiar (nombre, apellido, correo o edad)' });
  }

  try {
    const usuario = await usuarioModelo.actualizarUsuario(req.sesion.id, cambios);
    if (!usuario) return res.status(404).json({ error: 'No encontramos tu cuenta' });
    res.json({ usuario });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ese correo ya lo usa otra cuenta' });
    }
    throw error;
  }
}

async function verAyudante(req, res) {
  res.json({ ayudante: await ayudanteModelo.obtenerAyudante(req.sesion.id) });
}

async function guardarAyudante(req, res) {
  const errorNombre = validar.nombreAyudante(req.body?.nombre);
  if (errorNombre) return res.status(400).json({ error: errorNombre });
  const nombre = limpiar(req.body.nombre);
  const relacion = String(req.body?.relacion || '').trim().toLowerCase();
  if (!ayudanteModelo.RELACIONES.includes(relacion)) {
    return res.status(400).json({ error: 'La relación debe ser cuidador, familiar o conocido' });
  }
  res.json({ ayudante: await ayudanteModelo.guardarAyudante(req.sesion.id, { nombre, relacion }) });
}

module.exports = { registrar,iniciarSesion,verPerfil,cerrarSesion,editarPerfil,verAyudante,guardarAyudante };
