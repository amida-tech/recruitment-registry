'use strict';

module.exports = function section(sequelize, Sequelize, schema) {
    const tableName = 'section';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
        meta: {
            type: Sequelize.JSON,
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
