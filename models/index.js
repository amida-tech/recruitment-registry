'use strict';

const db = require('./db');
const dao = require('./dao');
const macro = require('./macro');

module.exports = Object.assign({ sequelize: db.sequelize, macro }, dao);
