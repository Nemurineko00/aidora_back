const pool = require('../bd');

const RELACIONES = ['cuidador', 'familiar', 'conocido'];

async function obtenerAyudante(id_usuario) {
  const { rows } = await pool.query(`SELECT nombre, relacion FROM ayudante WHERE id_usuario = $1`, [id_usuario]);
  return rows[0] || null;
}

async function guardarAyudante(id_usuario, { nombre, relacion }) {
  const { rows } = await pool.query(
    `INSERT INTO ayudante (id_usuario, nombre, relacion) VALUES ($1, $2, $3)
     ON CONFLICT (id_usuario) DO UPDATE SET nombre = EXCLUDED.nombre, relacion = EXCLUDED.relacion, actualizado_en = now()
     RETURNING nombre, relacion`,
    [id_usuario, nombre, relacion]
  );
  return rows[0];
}

module.exports = { RELACIONES, obtenerAyudante, guardarAyudante };
