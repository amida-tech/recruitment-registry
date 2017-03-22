'use strict';

module.exports = function consentDocument(sequelize, Sequelize, schema) {
    const tableName = 'consent_document';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        typeId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'type_id',
            references: {
                model: {
                    schema,
                    tableName: 'consent_type',
                },
                key: 'id',
            },
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
        paranoid: true,
    });
};
