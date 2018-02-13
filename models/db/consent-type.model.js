'use strict';

module.exports = function consentType(sequelize, Sequelize, schema) {
    const tableName = 'consent_type';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        type: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
        role: {
            type: Sequelize.TEXT,
            references: {
                model: {
                    schema,
                    tableName: 'consent_role',
                },
                key: 'name',
            },
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
