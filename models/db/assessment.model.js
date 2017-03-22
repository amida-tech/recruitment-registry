'use strict';

module.exports = function assessment(sequelize, Sequelize, schema) {
    const tableName = 'assessment';
    const modelName = tableName;
    return sequelize.define(modelName, {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
            unique: true,
        },
        sequenceType: {
            type: Sequelize.ENUM('ondemand', 'biyearly'),
            field: 'sequence_type',
            allowNull: false,
        },
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
