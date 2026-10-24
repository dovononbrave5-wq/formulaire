const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});
// Test au démarrage : échoue vite si la configuration est mauvaise
pool.getConnection()
  .then(conn => { console.log('MySQL connecté'); conn.release(); })
  .catch(err => console.error('Erreur MySQL :', err.message));

module.exports = pool;