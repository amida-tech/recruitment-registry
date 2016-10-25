'use strict';

module.exports = function (sequelize, DataTypes) {
    const SurveySection = sequelize.define('survey_section', {
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        sectionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'section_id',
            references: {
                model: 'rr_section',
                key: 'id'
            }
        },
        line: {
            type: DataTypes.INTEGER
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
        createdAt: 'createdAt',
        deletedAt: 'deletedAt',
        paranoid: true
    });

    return SurveySection;
};
