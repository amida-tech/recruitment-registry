'use strict';

module.exports = function smtp(sequelize, Sequelize, schema) {
    const tableName = 'smtp';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        protocol: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        username: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        password: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        host: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        from: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'email_from',
        },
        otherOptions: {
            type: Sequelize.JSON,
            allowNull: false,
            field: 'other_options',
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
        type: {
            type: Sequelize.TEXT,
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'smtp_type',
                },
                key: 'name',
            },
            defaultValue: 'reset-password',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
