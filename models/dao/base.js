'use strict';

const timestamps = {
    created: { col: 'created_at', js: 'createdAt' },
    updated: { col: 'updated_at', js: 'updatedAt' },
    deleted: { col: 'deleted_at', js: 'deletedAt' },
};

module.exports = class Base {
    constructor(db) {
        this.db = db;
    }

    transaction(autoCallback) {
        return this.db.sequelize.transaction(autoCallback);
    }

    selectQuery(sql, replacements, transaction) {
        const options = { type: this.db.sequelize.QueryTypes.SELECT };
        if (replacements) {
            options.replacements = replacements;
        }
        if (transaction) {
            options.transaction = transaction;
        }
        return this.db.sequelize.query(sql, options);
    }

    timestampColumn(table, type, format = 'YYYY-MM-DD"T"HH24:MI:SS"Z"') {
        const { col, js } = timestamps[type];
        const qualifiedCol = `${table}.${col}`;
        return [this.db.sequelize.fn('to_char', this.db.sequelize.col(qualifiedCol), format), js];
    }
};
