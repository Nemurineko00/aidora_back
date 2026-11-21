const crypto=require('crypto');
const jwt=require('jsonwebtoken');
const pool=require('../bd');
const usuarioModelo=require('../Modelo/usuario_modelo');
const {crearModeloToken}=require('../Modelo/tokenrevocado_modelo');

const tokenModelo=crearModeloToken(pool);

const DURACION_SESION={
    usuario:'1h',
    admin:'1h',
    ong:'3h',
};


function firmarToken({ id, rol }) {
  return jwt.sign({ sub: String(id), rol }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: DURACION_SESION[rol],
    jwtid: crypto.randomUUID(),
  });
}

async function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization || '';
  if (!encabezado.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Inicia sesión para continuar' });
  }
  const token = encabezado.slice('Bearer '.length);

  let datos;
  try{
    datos = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Tu sesión expiró, inicia sesión otra vez' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (!datos.jti || (await tokenModelo.estaRevocado(datos.jti))) {
    return res.status(401).json({ error: 'Tu sesión ya fue cerrada, inicia sesión otra vez' });
  }

  const sesion = { ...datos, id: Number(datos.sub) };

  if (sesion.rol === 'usuario') {
    const usuario = await usuarioModelo.listarUsuarioPorId(sesion.id);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Tu cuenta ya no está activa' });
    }
  }

  req.sesion = sesion;
  next();
}

function soloRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.sesion?.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para hacer esto' });
    }
    next();
  };
}
module.exports = { firmarToken, verificarToken, soloRol, tokenModelo };