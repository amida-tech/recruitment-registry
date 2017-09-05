'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('survey_section_question', {
        surveySectionId: {
            type: DataTypes.INTEGER,
            field: 'survey_section_id',
            allowNull: false,
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'survey_section',
                },
                key: 'id',
            },
        },
        questionId: {
            type: DataTypes.INTEGER,
            field: 'question_id',
            allowNull: false,
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        line: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: false,
        indexes: [{ fields: ['survey_section_id'] }],
    });
};
