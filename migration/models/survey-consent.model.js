'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('survey_consent', {
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'survey',
                },
                key: 'id',
            },
        },
        consentId: {
            type: DataTypes.INTEGER,
            field: 'consent_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'consent',
                },
                key: 'id',
            },
        },
        consentTypeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'consent_type_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'consent_type',
                },
                key: 'id',
            },
        },
        action: {
            type: DataTypes.ENUM('read', 'create'),
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{
            unique: true,
            fields: ['survey_id', 'consent_type_id', 'action'],
        }],
    });
};
