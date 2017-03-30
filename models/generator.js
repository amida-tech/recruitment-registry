'use strict';

const dbGenerator = require('./db/db-generator');
const daosGenerator = require('./dao/daos-generator');

module.exports = function generator(schema, dbname) {
    const db = dbGenerator(schema, dbname);
    return daosGenerator(db);
};
