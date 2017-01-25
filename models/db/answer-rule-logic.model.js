'use strict';

const SPromise = require('../../lib/promise');

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('answer_rule_logic', {
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
                        'equals',
                        'exists',
                        'not-equals',
                        'not-exists',
                        'not-selected',
                        'each-not-selected'
                    ];
                    const ps = names.map(name => this.create({ name }));
                    return SPromise.all(ps);
                }
            }
        }
    });
};
