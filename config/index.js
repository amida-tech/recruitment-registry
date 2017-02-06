'use strict';

const dotenv = require('dotenv');

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
        poolMax: 5,
        poolMin: 0,
        poolIdle: 10000
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
        resetExpiresUnit: 'seconds'
    },
    tmpDirectory: '/tmp'
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
        poolMax: process.env.RECREG_DB_POOL_MAX,
        poolMin: process.env.RECREG_DB_POOL_MIN,
        poolIdle: process.env.RECREG_DB_POOL_IDLE
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
        resetExpiresUnit: process.env.RECREG_CRYPT_RESET_EXPIRES_UNIT
    },
    clientBaseUrl: process.env.RECREG_CLIENT_BASE_URL,
    tmpDirectory: process.env.RECREG_TMP_DIRECTORY,

    constantContact: {
        baseApiUrl: process.env.RECREG_CONSTANT_CONTACT__URL,
        token: process.env.RECREG_CONSTANT_CONSTANT_TOKEN,
        apiKey: process.env.RECREG_CONSTANT_CONTACT_KEY,
        secret: process.env.RECREG_CONSTANT_CONTACT_SECRET,
        listId: process.env.RECREG_CONSTANT_CONTACT_LIST_ID
    }
};

const configBase = _.merge(all, main);
const config = _.merge(configBase, require('./' + configBase.env + '.js'));

process.env.NODE_ENV = config.env;

module.exports = config;
