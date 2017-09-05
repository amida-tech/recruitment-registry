'use strict';

module.exports = function consentTypeText(sequelize, Sequelize, schema) {
    const tableName = 'consent_type_text';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        consentTypeId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'consent_type_id',
            references: {
                model: {
                    schema,
                    tableName: 'consent_type',
                },
                key: 'id',
            },
        },
        language: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: {
                    schema,
                    tableName: 'language',
                },
                key: 'code',
            },
        },
        title: {
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
        paranoid: true,
    });
};
