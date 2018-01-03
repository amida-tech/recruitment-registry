'use strict';

module.exports = function surveyConsent(sequelize, Sequelize, schema) {
    const tableName = 'survey_consent';
    const modelName = `${schema}_${tableName}`;
    const Op = Sequelize.Op;
    return sequelize.define(modelName, {
        surveyId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: {
                    schema,
                    tableName: 'survey',
                },
                key: 'id',
            },
        },
        consentId: {
            type: Sequelize.INTEGER,
            field: 'consent_id',
            references: {
                model: {
                    schema,
                    tableName: 'consent',
                },
                key: 'id',
            },
        },
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
        action: {
            type: Sequelize.ENUM('read', 'create'),
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
        indexes: [{
            unique: true,
            fields: ['survey_id', 'consent_type_id', 'action'],
            where: { deleted_at: { [Op.eq]: null } },
        }],
    });
};
