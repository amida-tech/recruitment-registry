'use strict';

module.exports = function userAudit(sequelize, Sequelize, schema) {
    return sequelize.define('user_audit', {
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
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
    });
};
