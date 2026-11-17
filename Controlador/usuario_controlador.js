const usuarioModelo=require('../Modelo/usuario_modelo');

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

  const usuario = await usuarioModelo.crear({
    nombre: datos.nombre.trim(),
    apellido: `${datos.apellidoP.trim()} ${datos.apellidoM.trim()}`,
    email,
    contrasena: datos.contrasena,
  });

  res.status(201).json({ usuario });
}

module.exports = { registrar };