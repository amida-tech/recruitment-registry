'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('user_audit', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'registry_user',
                },
                key: 'id',
            },
        },
        endpoint: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        operation: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: false,
    });
};
