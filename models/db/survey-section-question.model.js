'use strict';

module.exports = function surveySectionQuestion(sequelize, Sequelize, schema) {
    const tableName = 'survey_section_question';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        surveySectionId: {
            type: Sequelize.INTEGER,
            field: 'survey_section_id',
            allowNull: false,
            references: {
                model: {
                    schema,
                    tableName: 'survey_section',
                },
                key: 'id',
            },
        },
        questionId: {
            type: Sequelize.INTEGER,
            field: 'question_id',
            allowNull: false,
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
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        indexes: [{ fields: ['survey_section_id'] }],
    });
};
