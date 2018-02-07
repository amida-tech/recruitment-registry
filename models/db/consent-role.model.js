'use strict';

const constNames = require('../const-names');

module.exports = function consentRole(sequelize, Sequelize, schema) {
    const tableName = 'consent_role';
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
                    const names = constNames.consentRoles;
                    return this.bulkCreate(names.map(name => ({ name })));
                }
                return null;
            },
        },
    });
};
