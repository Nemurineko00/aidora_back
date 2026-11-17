const medicamentoModelo = require('../Modelo/medicamento_modelo');

async function listarMedicamentos(req, res) {
  res.json({ medicamentos: medicamentoModelo.listar() });
}

module.exports = { listarMedicamentos };
