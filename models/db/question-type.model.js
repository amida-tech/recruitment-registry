'use strict';

const SPromise = require('../../lib/promise');

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('question_type', {
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        hooks: {
            afterSync(options) {
                if (options.force) {
                    const names = [
                        'text', 'choice', 'choices', 'bool', 'integer', 'float',
                        'zip', 'date', 'pounds', 'year', 'month', 'day',
                        'feet-inches', 'blood-pressure', 'enumeration'
                    ];
                    const ps = names.map(name => this.create({ name }));
                    return SPromise.all(ps);
                }
            }
        }
    });
};