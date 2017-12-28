'use strict';

const Sequelize = require('sequelize');
const pg = require('pg');

const config = require('../../config');
const logger = require('../../logger');

pg.types.setTypeParser(1184, value => value);

module.exports = function sequelizeGenerator(prependSearchPath, inputDbName) {
    const sequelizeOptions = {
        host: config.db.host,
        dialect: config.db.dialect,
        native: false,
        dialectOptions: {
            ssl: !!config.db.ssl,
            prependSearchPath,
        },
        port: config.db.port,
        pool: {
            max: config.db.poolMax,
            min: config.db.poolMin,
            idle: config.db.poolIdle,
        },
        logging: message => logger.info(message),
        operatorsAliases: false,
    };

    const { name, user, pass } = config.db;
    const dbName = inputDbName || name;
    const sequelize = new Sequelize(dbName, user, pass, sequelizeOptions);
    return { Sequelize, sequelize };
};
