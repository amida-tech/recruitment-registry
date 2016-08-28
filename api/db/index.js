'use strict';

const Sequelize = require('sequelize');

const config = require('../config');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
    host: config.db.host,
    dialect: config.db.dialect,
    port: config.db.port,
    pool: {
        max: 20,
        min: 0,
        idle: 10000
    }
});

const User = sequelize.import('../user/model');

module.exports =  {
    Sequelize,
    sequelize,
    User
};
