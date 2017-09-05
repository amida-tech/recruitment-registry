'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const users = require('./users');
const sports = require('./sports');
const televisionHistory = require('./television-history');
const employmentHistory = require('./employment-history');

module.exports = [
    users,
    sports,
    televisionHistory,
    employmentHistory,
];
