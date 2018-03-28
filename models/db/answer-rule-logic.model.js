'use strict';

const SPromise = require('../../lib/promise');

module.exports = function answerRuleLogic(sequelize, Sequelize, schema) {
    const tableName = 'answer_rule_logic';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        hooks: {
            afterSync(options) {
                if (options.force) {
                    const names = [
                        'equals',
                        'exists',
                        'not-equals',
                        'not-exists',
                        'in-date-range',
                        'in-zip-range',
                    ];
                    const ps = names.map(name => this.create({ name }));
                    return SPromise.all(ps);
                }
                return null;
            },
        },
    });
};
