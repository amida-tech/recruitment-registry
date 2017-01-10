'use strict';

const SPromise = require('../../lib/promise');

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('answer_type', {
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
                        'choice', 'text', 'zip', 'enumeration',
                        'bool', 'bool-sole',
                        'date', 'year', 'month', 'day',
                        'integer',
                        'pounds', 'feet-inches', 'blood-pressure'
                    ];
                    const ps = names.map(name => this.create({ name }));
                    return SPromise.all(ps);
                }
            }
        }
    });
};
