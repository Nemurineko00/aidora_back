require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('error',(error)=>{
    console.error('Se peridó una conexión con la base de datos:',error.message);
});
module.exports = pool;