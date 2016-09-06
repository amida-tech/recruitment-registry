'use strict';

const dotenv = require('dotenv');

dotenv.config();

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const _ = require('lodash');

const all = {
    env: process.env.NODE_ENV,
    jwt: {
        secret: process.env.RECREG_CLIENT_SECRET
    },
    port: process.env.RECREG_PORT || 9005,
    db: {
        name: process.env.RECREG_DB_NAME || 'recreg',
        user: process.env.RECREG_DB_USER,
        pass: process.env.RECREG_DB_PASS,
        host: process.env.RECREG_DB_HOST || 'localhost',
        port: process.env.RECREG_DB_PORT || '5432',
        dialect: process.env.RECREG_DB_DIALECT || 'postgres',
    }
};

module.exports = _.merge(all, require('./' + all.env + '.js'));
