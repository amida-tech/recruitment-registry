'use strict';

const Sequelize = require('sequelize');
const pg = require('pg');

const config = require('../../config');
const logger = require('../../logger');

pg.types.setTypeParser(1184, value => value);

module.exports = function (inputSchema) {
    const schema = inputSchema || config.db.schema;

    const sequelizeOptions = {
        host: config.db.host,
        dialect: config.db.dialect,
        dialectOptions: {
            ssl: (config.env === 'production'),
            prependSearchPath: schema !== 'public',
        },
        port: config.db.port,
        pool: {
            max: config.db.poolMax,
            min: config.db.poolMin,
            idle: config.db.poolIdle,
        },
        logging: message => logger.info(message),
    };

    if (config.db.schema !== 'public') {
        sequelizeOptions.searchPath = schema;
    }

    const { name, user, pass } = config.db;
    const sequelize = new Sequelize(name, user, pass, sequelizeOptions);
    return { Sequelize, sequelize, schema };
};
