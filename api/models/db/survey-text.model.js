'use strict';

module.exports = function (sequelize, DataTypes) {
    const SurveyText = sequelize.define('survey_text', {
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            fieldName: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        language: {
            type: DataTypes.TEXT,
            allowNull: false,
            fieldName: 'language_code',
            references: {
                model: 'language',
                key: 'code'
            }
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        deletedAt: 'deletedAt',
        paranoid: true
    });

    return SurveyText;
};
