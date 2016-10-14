'use strict';

const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
    const QuestionChoiceText = sequelize.define('question_choice_text', {
        questionChoiceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            fieldName: 'question_choice_text',
            references: {
                model: 'question_choice',
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
        updatedAt: 'updatedAt',
        classMethods: {
            createQuestionChoiceTextTx({ questionChoiceId, text, language = 'en' }, tx) {
                return QuestionChoiceText.destroy({ where: { questionChoiceId, language } }, { transaction: tx })
                    .then(() => {
                        return QuestionChoiceText.create({ questionChoiceId, text, language }, { transaction: tx })
                            .then(() => {});
                    });
            },
            createQuestionChoiceText(input) {
                return sequelize.transaction(function (tx) {
                    return QuestionChoiceText.createQuestionTextTx(input, tx);
                });
            },
            getQuestionChoiceText(questionChoiceId, language = 'en') {
                return QuestionChoiceText.findOne({
                        where: { questionChoiceId, language },
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
                        return QuestionChoiceText.findOne({
                                where: { questionChoiceId, language: 'en' },
                                raw: true,
                                attributes: ['text']
                            })
                            .then(result => result && result.text);
                    });
            },
            getAllQuestionChoiceTexts(questionChoiceIds, language = 'en') {
                const options = {
                    raw: true,
                    language,
                    attributes: ['questionChoiceId', 'text']
                };
                if (questionChoiceIds) {
                    options.where = { questionChoiceId: { in: questionChoiceIds } };
                }
                return QuestionChoiceText.findAll(options)
                    .then(records => {
                        if (language === 'en') {
                            return records;
                        } else {
                            const nullOnes = records.filter(record => !record.text);
                            if (nullOnes.length) {
                                const ids = nullOnes.map(nullOne => nullOne.questionChoiceId);
                                options.where = { questionId: { in: ids } };
                                options.language = 'en';
                                return sequelize.models.question_text.findAll(options)
                                    .then(addlQxTexts => {
                                        const map = _.keyBy(addlQxTexts, 'questionId');
                                        nullOnes.forEach(nullOne => {
                                            const record = map[nullOne.questionId];
                                            const text = (record && record.text) || '';
                                            nullOne.text = text;
                                        });
                                    });
                            } else {
                                return records;
                            }
                        }
                    });

            }
        }
    });

    return QuestionChoiceText;
};
