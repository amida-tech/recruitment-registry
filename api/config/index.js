'use strict';

const dotenv = require('dotenv');
const moment = require('moment');

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
    },
    superUser: {
        username: process.env.RECREG_SUPER_USER_USERNAME || 'super',
        password: process.env.RECREG_SUPER_USER_PASSWORD || 'Am!d@2017PW',
        email: process.env.RECREG_SUPER_USER_EMAIL || 'rr_demo@amida.com'
    },
    logging: {
        express: (process.env.RECREG_LOGGING_EXPRESS) === 'true',
        disable: (process.env.RECREG_LOGGING_DISABLE) === 'true'
    },
    crypt: {
        hashrounds: process.env.RECREG_CRYPT_HASHROUNDS || 10,
        resetTokenLength: process.env.RECREG_CRYPT_RESET_TOKEN_LENGTH || 20,
        resetPasswordLength: process.env.RECREG_CRYPT_RESET_PASSWORD_LENGTH || 10,
        resetExpires: process.env.RECREG_CRYPT_RESET_EXPIRES || 3600,
    },
    resetPw: {
        emailUri: process.env.RECREG_RESETPW_EMAIL_URI,
        emailFrom: process.env.RECREG_RESETPW_EMAIL_FROM,
        emailName: process.env.RECREG_RESETPW_EMAIL_NAME,
        emailSubject: process.env.RECREG_RESETPW_EMAIL_SUBJECT,
        clientBaseUrl: process.env.RECREG_RESETPW_CLIENT_BASE_URL
    }
};

all.expiresForDB = function () {
    let m = moment.utc();
    m.add(this.crypt.resetExpires, 'seconds');
    return m.toISOString();
};

module.exports = _.merge(all, require('./' + all.env + '.js'));
