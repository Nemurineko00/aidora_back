const { usuarios } = require('../datos/memoria');

function listar() {
  return usuarios;
}

// Devuelve true si el usuario existía y se eliminó
function eliminar(id) {
  const posicion = usuarios.findIndex((u) => u.id === id);
  if (posicion === -1) return false;
  usuarios.splice(posicion, 1);
  return true;
}

module.exports = { listar, eliminar };
