'use strict';

module.exports = function (sequelize, DataTypes) {
    const Answer = sequelize.define('answer', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'user',
                key: 'id'
            }
        },
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        questionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'question_id',
            references: {
                model: 'question',
                key: 'id'
            }
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        classMethods: {
            post: function(input) {
                const userId = input.userId;
                const surveyId = input.surveyId;
                const answers = input.answers.reduce(function(r, answer) {
                    let allAnswers = answer.answer;
                    if (! Array.isArray(allAnswers)) {
                        allAnswers = [allAnswers];
                    }
                    const questionId = answer.questionId;
                    allAnswers.forEach(function(value) {
                        r.push({
                            userId,
                            surveyId,
                            questionId,
                            value
                        })
                    });
                    return r;
                }, []);
                return sequelize.Promise.all(answers.map(function(answer) {
                    return Answer.create(answer);
                }));
            }
        }
    });

    return Answer;
};
