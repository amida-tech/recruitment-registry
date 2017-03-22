'use strict';

module.exports = function userSurvey(sequelize, Sequelize, schema) {
    const tableName = 'user_survey';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: {
                    schema,
                    tableName: 'registry_user',
                },
                key: 'id',
            },
        },
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
        status: {
            type: Sequelize.ENUM('new', 'in-progress', 'completed'),
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
