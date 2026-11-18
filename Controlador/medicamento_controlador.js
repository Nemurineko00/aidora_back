const medicamentoModelo = require('../Modelo/medicamento_modelo');

async function listarMedicamentos(req, res) {
  res.json({ medicamentos: await medicamentoModelo.listarMedicamentos() });
}

module.exports = { listarMedicamentos };
