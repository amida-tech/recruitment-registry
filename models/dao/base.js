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

    queryCommon(sql, inputOptions, replacements, transaction) {
        const options = Object.assign({}, inputOptions);
        const schema = this.db.schema;
        if (schema !== 'public') {
            options.searchPath = schema;
        }
        if (replacements) {
            options.replacements = replacements;
        }
        if (transaction) {
            options.transaction = transaction;
        }
        return this.db.sequelize.query(sql, options);
    }

    query(sql, replacements, transaction) {
        return this.queryCommon(sql, {}, replacements, transaction);
    }

    selectQuery(sql, replacements, transaction) {
        const options = { type: this.db.sequelize.QueryTypes.SELECT };
        return this.queryCommon(sql, options, replacements, transaction);
    }

    timestampColumn(table, type, format = 'YYYY-MM-DD"T"HH24:MI:SS"Z"') {
        const { col, js } = timestamps[type];
        const schema = this.db.schema;
        const qualifiedCol = `${schema}_${table}.${col}`;
        return [this.db.sequelize.fn('to_char', this.db.sequelize.col(qualifiedCol), format), js];
    }

    literal(val) {
        return this.db.sequelize.literal(val);
    }

    where(attr, comparator, logic) {
        return this.db.sequelize.where(attr, comparator, logic);
    }

    qualifiedCol(table, col) {
        const schema = this.db.schema;
        return `${schema}_${table}.${col}`;
    }

    fnCol(fnName, table, col) {
        const qCol = this.qualifiedCol(table, col);
        return [this.db.sequelize.fn(fnName, this.db.sequelize.col(qCol))];
    }
};
