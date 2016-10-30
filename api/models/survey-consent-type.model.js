'use strict';

module.exports = function (sequelize, DataTypes) {
    const SurveyConsentType = sequelize.define('survey_consent_type', {
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        consentTypeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'consent_type_id',
            references: {
                model: 'consent_type',
                key: 'id'
            }
        },
        action: {
            type: DataTypes.ENUM('read', 'create', 'edit'),
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        deletedAt: 'deletedAt',
        paranoid: true
    });

    return SurveyConsentType;
};
