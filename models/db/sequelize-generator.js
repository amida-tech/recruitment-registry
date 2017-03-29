'use strict';

const Sequelize = require('sequelize');
const pg = require('pg');

const config = require('../../config');
const logger = require('../../logger');

pg.types.setTypeParser(1184, value => value);

module.exports = function (prependSearchPath) {
    const sequelizeOptions = {
        host: config.db.host,
        dialect: config.db.dialect,
        native: false,
        dialectOptions: {
            ssl: (config.env === 'production'),
            prependSearchPath,
        },
        port: config.db.port,
        pool: {
            max: config.db.poolMax,
            min: config.db.poolMin,
            idle: config.db.poolIdle,
        },
        logging: message => logger.info(message),
    };

    const { name, user, pass } = config.db;
    const sequelize = new Sequelize(name, user, pass, sequelizeOptions);
    return { Sequelize, sequelize };
};
