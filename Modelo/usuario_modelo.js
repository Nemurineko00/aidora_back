const pool = require('../bd');

const COLUMNAS_PUBLICAS = 'id_usuario, nombre, apellido, email, edad, activo';

async function listarUsuario(){
  const {rows} = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuario ORDER BY id_usuario`);
  return rows;
}

async function listarUsuarioPorId(id_usuario) {
  const {rows}= await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuario WHERE id_usuario = $1`, [id_usuario]);
  return rows[0];
}

async function buscarPorEmail(email){
  const { rows } = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);
  return rows[0];
}

async function crearUsuario({nombre, apellido, email, edad, contrasenaHash}) {
  const { rows } = await pool.query(`INSERT INTO usuario (nombre, apellido, email, edad, contrasena_hash) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNAS_PUBLICAS}`,[nombre, apellido, email, edad, contrasenaHash]);

  return rows[0];
}

async function actualizarUsuario( id_usuario, { nombre, apellido, email, edad }) {
  const cambios = Object.entries({nombre, apellido, email, edad}).filter(([_, valor]) => valor !== undefined);

  if (cambios.length === 0) return listarUsuarioPorId(id_usuario);

  const columnas = cambios.map(([columna], i) => `${columna} = $${i + 1}`).join(', ');

  const resultado = await pool.query(`UPDATE usuario SET ${columnas} WHERE id_usuario = $${cambios.length + 1} RETURNING ${COLUMNAS_PUBLICAS}`,[...cambios.map(([_, valor]) => valor),id_usuario]);

  if (resultado.rowCount === 0) return undefined;
  return resultado.rows[0];
}

async function desactivarUsuarioPorId(id_usuario) {
  const resultado = await pool.query(`UPDATE usuario SET activo = false WHERE id_usuario = $1 RETURNING *`, [id_usuario]);

  if (resultado.rowCount === 0) { return undefined; }
  return resultado.rows[0];
}

async function eliminarUsuarioPorId(id_usuario) {
  const {rows} = await pool.query(`DELETE FROM usuario WHERE id_usuario = $1 RETURNING *`, [id_usuario]);
  return rows[0];
}

module.exports = { listarUsuarioPorId, eliminarUsuarioPorId, listarUsuario, desactivarUsuarioPorId, crearUsuario, buscarPorEmail, actualizarUsuario };
