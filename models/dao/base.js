'use strict';

module.exports = class Base {
    constructor(db) {
        this.db = db;
    }

    transaction(autoCallback) {
        return this.db.sequelize.transaction(autoCallback);
    }
};
