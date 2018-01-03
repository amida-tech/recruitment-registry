'use strict';

module.exports = function questionChoiceText(sequelize, Sequelize, schema) {
    const tableName = 'question_choice_text';
    const modelName = `${schema}_${tableName}`;
    const Op = Sequelize.Op;
    return sequelize.define(modelName, {
        questionChoiceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'question_choice_id',
            references: {
                model: {
                    schema,
                    tableName: 'question_choice',
                },
                key: 'id',
            },
        },
        language: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: {
                    schema,
                    tableName: 'language',
                },
                key: 'code',
            },
        },
        text: {
            type: Sequelize.TEXT,
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
        indexes: [{
            name: 'question_choice_text_lower_text_key',
            fields: [sequelize.fn('lower', sequelize.col('text'))],
            where: { deleted_at: { [Op.eq]: null }, language_code: 'en' },
        }],
    });
};
