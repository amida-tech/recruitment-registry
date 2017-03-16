'use strict';

const db = require('../db');
const generator = require('./daos-generator');

module.exports = generator(db);
