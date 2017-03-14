'use strict';

const dbGenerator = require('./db/db-generator');
const daosGenerator = require('./dao/daos-generator');

module.exports = function generator(schema) {
    const db = dbGenerator(schema);
    return daosGenerator(db);
};
