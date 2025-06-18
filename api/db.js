const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mmologin',
    password: 'azeazeaze',
    port: 5432
});

module.exports = pool;
