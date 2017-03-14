'use strict';

const SPromise = require('../../lib/promise');

module.exports = function questionType(sequelize, Sequelize, schema) {
    return sequelize.define('question_type', {
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
                        'text', 'choice', 'choices', 'bool', 'integer', 'float',
                        'zip', 'date', 'pounds', 'year', 'month', 'day',
                        'feet-inches', 'blood-pressure', 'choice-ref', 'open-choice',
                    ];
                    const ps = names.map(name => this.create({ name }));
                    return SPromise.all(ps);
                }
                return null;
            },
        },
    });
};
