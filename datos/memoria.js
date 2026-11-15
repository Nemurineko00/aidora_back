// Datos en memoria: son los mismos que tenías escritos en las pantallas de tu proyecto original.
// Se reinician cada vez que se reinicia el servidor. Aquí es donde más adelante irá tu base de datos.

const medicamentos = [
  { id: 1, nombre: 'Paracetamol', rs: '210M2004 SSA VI' },
  { id: 2, nombre: 'Paracetamol', rs: '210M2004 SSA VI' },
];

const usuarios = [
  { id: 1, nombre: 'Gimmy', reportes: 1 },
  { id: 2, nombre: 'Usuario1', reportes: 0 },
  { id: 3, nombre: 'Usuario2', reportes: 0 },
  { id: 4, nombre: 'Usuario3', reportes: 0 },
];

const reportes = [
  { id: 1, motivo: 'Lote diferente al publicado', imagen: null },
];

const donaciones = [
  { id: 1, donante: 'Yunuen Juárez', receptor: 'Pablo Troncho', fecha: 'DD/MM/AAAA', hora: 'hh:mm' },
  { id: 2, donante: 'Usuario1', receptor: 'Usuario4', fecha: 'DD/MM/AAAA', hora: 'hh:mm' },
  { id: 3, donante: 'Usuario2', receptor: 'Usuario5', fecha: 'DD/MM/AAAA', hora: 'hh:mm' },
  { id: 4, donante: 'Usuario3', receptor: 'Usuario6', fecha: 'DD/MM/AAAA', hora: 'hh:mm' },
];

module.exports = { medicamentos, usuarios, reportes, donaciones };
