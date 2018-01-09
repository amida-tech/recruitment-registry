'use strict';

module.exports = function questionText(sequelize, Sequelize, schema) {
    const tableName = 'question_text';
    const modelName = `${schema}_${tableName}`;
    const Op = Sequelize.Op;
    return sequelize.define(modelName, {
        questionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'question_id',
            references: {
                model: {
                    schema,
                    tableName: 'question',
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
        instruction: {
            type: Sequelize.TEXT,
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
            name: 'question_text_lower_text_key',
            fields: [sequelize.fn('lower', sequelize.col('text'))],
            where: { deleted_at: { [Op.eq]: null }, language_code: 'en' },
        }],
    });
};
