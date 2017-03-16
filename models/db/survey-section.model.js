'use strict';

module.exports = function surveySection(sequelize, Sequelize, schema) {
    return sequelize.define('survey_section', {
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
        sectionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'section_id',
            references: {
                model: {
                    schema,
                    tableName: 'section',
                },
                key: 'id',
            },
        },
        parentId: {
            type: Sequelize.INTEGER,
            field: 'parent_id',
            references: {
                model: {
                    schema,
                    tableName: 'survey_section',
                },
                key: 'id',
            },
        },
        parentQuestionId: {
            type: Sequelize.INTEGER,
            field: 'parent_question_id',
            references: {
                model: {
                    schema,
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        line: {
            type: Sequelize.INTEGER,
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
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        indexes: [{ fields: ['survey_id'], where: { deleted_at: { $eq: null } } }],
        paranoid: true,
    });
};
