'use strict';

const path = require('path');
const dotenv = require('dotenv');

const filepath = path.join(__dirname, '../../.env');

dotenv.config({ path: filepath });

const db = {
    database: process.env.RECREG_DB_NAME || 'recregtest',
    username: process.env.RECREG_DB_USER,
    password: process.env.RECREG_DB_PASS,
    host: process.env.RECREG_DB_HOST || 'localhost',
    dialect: process.env.RECREG_DB_DIALECT || 'postgres',
    migrationStorage: 'json',
};

module.exports = {
    production: db,
    test: db,
    development: db,
};
