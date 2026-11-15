const { usuarios } = require('../datos/memoria');

function listar() {
  return usuarios;
}

function eliminar(id) {
  const posicion = usuarios.findIndex((u) => u.id === id);
  if (posicion === -1) return false;
  usuarios.splice(posicion, 1);
  return true;
}

module.exports = { listar, eliminar };
