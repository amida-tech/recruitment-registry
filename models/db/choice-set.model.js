'use strict';

module.exports = function choiceSet(sequelize, Sequelize, schema) {
    const tableName = 'choice_set';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        reference: {
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
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        indexes: [{ unique: true, fields: ['reference'], where: { deleted_at: { $eq: null } } }],
        paranoid: true,
    });
};
