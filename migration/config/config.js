'use strict';

const path = require('path');
const dotenv = require('dotenv');

const filepath = path.join(__dirname, '../../.env');

dotenv.config({ path: filepath });

const user = process.env.RECREG_DB_USER;
const pass = process.env.RECREG_DB_PASS;
const host = process.env.RECREG_DB_HOST;
const database = process.env.RECREG_DB_NAME;
const port = process.env.RECREG_DB_PORT;

const db = {
    url: "postgresql://" + user + ":" + pass + "@" + host + ":" + port + "/" + database,
    database: database || 'recregtest',
    username: user,
    password: pass,
    host: host || 'localhost',
    dialect: process.env.RECREG_DB_DIALECT || 'postgres',
    migrationStorage: 'json',
    dialectOptions: {
        ssl: {
            require: true
        }
    }
};

module.exports = {
    production: db,
    test: db,
    development: db,
};
