'use strict';

module.exports = function (sequelize, DataTypes) {
    const QuestionText = sequelize.define('question_text', {
        questionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            fieldName: 'questionId',
            references: {
                model: 'question',
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
        text: {
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
        paranoid: true,
        classMethods: {
            createQuestionTextTx({ questionId, text, language = 'en' }, tx) {
                return QuestionText.destroy({ where: { questionId, language } }, { transaction: tx })
                    .then(() => {
                        return QuestionText.create({ questionId, text, language }, { transaction: tx })
                            .then(() => {});
                    });
            },
            createQuestionText(input) {
                return sequelize.transaction(function (tx) {
                    return QuestionText.createQuestionTextTx(input, tx);
                });
            },
            getQuestionText(questionId, language = 'en') {
                return QuestionText.findOne({
                        where: { questionId, language },
                        raw: true,
                        attributes: ['text']
                    })
                    .then(result => {
                        if (language === 'en') {
                            return result && result.text;
                        }
                        if (result && result.text) {
                            return result.text;
                        }
                        return QuestionText.findOne({
                                where: { questionId, language: 'en' },
                                raw: true,
                                attributes: ['text']
                            })
                            .then(result => result && result.text);
                    });
            }
        }
    });

    return QuestionText;
};
