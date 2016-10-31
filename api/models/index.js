'use strict';

const db = require('./db');
const dao = require('./dao');

module.exports = Object.assign({ sequelize: db.sequelize }, dao);
