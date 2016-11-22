'use strict';

const dotenv = require('dotenv');
const moment = require('moment');

dotenv.config();

const _ = require('lodash');

const all = {
    env: 'development',
    cors: {
        origin: 'http://localhost:4000'
    },
    db: {
        name: 'recreg',
        host: 'localhost',
        port: '5432',
        dialect: 'postgres',
    },
    superUser: {
        username: 'super',
        password: 'Am!d@2017PW',
        email: 'rr_demo@amida.com'
    },
    logging: {
        level: 'info'
    },
    crypt: {
        hashrounds: 10,
        resetTokenLength: 20,
        resetPasswordLength: 10,
        resetExpires: 3600,
    }
};

const main = {
    env: process.env.NODE_ENV,
    cors: {
        origin: process.env.RECREG_CORS_ORIGIN
    },
    jwt: {
        secret: process.env.RECREG_CLIENT_SECRET
    },
    port: process.env.RECREG_PORT || 9005,
    db: {
        name: process.env.RECREG_DB_NAME,
        user: process.env.RECREG_DB_USER,
        pass: process.env.RECREG_DB_PASS,
        host: process.env.RECREG_DB_HOST,
        port: process.env.RECREG_DB_PORT,
        dialect: process.env.RECREG_DB_DIALECT,
    },
    superUser: {
        username: process.env.RECREG_SUPER_USER_USERNAME,
        password: process.env.RECREG_SUPER_USER_PASSWORD,
        email: process.env.RECREG_SUPER_USER_EMAIL
    },
    logging: {
        level: process.env.RECREG_LOGGING_LEVEL
    },
    crypt: {
        hashrounds: process.env.RECREG_CRYPT_HASHROUNDS,
        resetTokenLength: process.env.RECREG_CRYPT_RESET_TOKEN_LENGTH,
        resetPasswordLength: process.env.RECREG_CRYPT_RESET_PASSWORD_LENGTH,
        resetExpires: process.env.RECREG_CRYPT_RESET_EXPIRES,
    },
    clientBaseUrl: process.env.RECREG_CLIENT_BASE_URL
};

all.expiresForDB = function () {
    let m = moment.utc();
    m.add(this.crypt.resetExpires, 'seconds');
    return m.toISOString();
};

const configBase = _.merge(all, main);
const config = _.merge(configBase, require('./' + configBase.env + '.js'));

process.env.NODE_ENV = config.env;

module.exports = config;
