'use strict';

const surveyType = function (queryInterface, Sequelize) {
    return queryInterface.createTable('survey_type', {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
            primaryKey: true,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
    });
};

const feedbackSurvey = function (queryInterface, Sequelize) {
    return queryInterface.createTable('feedback_survey', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        feedbackSurveyId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'feedback_survey_id',
            references: {
                model: {
                    tableName: 'survey',
                },
                key: 'id',
            },
        },
        surveyId: {
            type: Sequelize.INTEGER,
            field: 'survey_id',
            references: {
                model: {
                    tableName: 'survey',
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
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};

const surveyColumnType = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('survey', 'type', {
        type: Sequelize.TEXT,
        allowNull: false,
        references: {
            model: 'survey_type',
            key: 'name',
        },
        defaultValue: 'normal',
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        const Op = Sequelize.Op;
        return surveyType(queryInterface, Sequelize)
            .then(() => surveyColumnType(queryInterface, Sequelize))
            .then(() => feedbackSurvey(queryInterface, Sequelize))
            .then(() => queryInterface.addIndex('feedback_survey', ['survey_id'], {
                indexName: 'feedback_survey_survey_id',
                unique: true,
                where: { deleted_at: { [Op.eq]: null } },
            }));
    },
};
