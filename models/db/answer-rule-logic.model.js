'use strict';

const SPromise = require('../../lib/promise');

module.exports = function answerRuleLogic(sequelize, Sequelize, schema) {
    return sequelize.define('answer_rule_logic', {
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
                    ];
                    const ps = names.map(name => this.create({ name }));
                    return SPromise.all(ps);
                }
                return null;
            },
        },
    });
};
