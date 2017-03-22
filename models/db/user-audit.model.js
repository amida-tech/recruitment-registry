'use strict';

module.exports = function userAudit(sequelize, Sequelize, schema) {
    const tableName = 'user_audit';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: {
                    schema,
                    tableName: 'registry_user',
                },
                key: 'id',
            },
        },
        endpoint: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        operation: {
            type: Sequelize.TEXT,
            allowNull: false,
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
    });
};
