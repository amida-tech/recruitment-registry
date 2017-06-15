'use strict';

module.exports = function File(sequelize, Sequelize, schema) {
    const tableName = 'file';

    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        content: {
            type: Sequelize.BLOB,
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
