'use strict';

const chai = require('chai'); // eslint-disable-line import/no-extraneous-dependencies

const expect = chai.expect;

const firstNameQuery = 'UPDATE registry_user SET firstname=answer.value FROM answer WHERE answer.user_id=registry_user.id AND answer.question_id=:id';
const lastNameQuery = 'UPDATE registry_user SET lastname=answer.value FROM answer WHERE answer.user_id=registry_user.id AND answer.question_id=:id';

const dbUpdate = function (models, info, transaction) {
    return models.sequelize.query(firstNameQuery, {
        transaction,
        replacements: { id: info.firstNameId },
    })
        .then(() => models.sequelize.query(lastNameQuery, {
            transaction,
            replacements: { id: info.lastNameId },
        }))
        .then(() => {
            const SurveyQuestion = models.surveyQuestion.db.SurveyQuestion;
            const Question = models.question.db.Question;
            const Answer = models.answer.db.Answer;
            const ids = [info.firstNameId, info.lastNameId];
            return SurveyQuestion.destroy({ where: { questionId: { $in: ids } }, transaction })
                .then(() => Answer.destroy({ where: { questionId: { $in: ids } }, transaction }))
                .then(() => Question.destroy({ where: { id: { $in: ids } }, transaction }));
        });
};

module.exports = function converter(models) {
    return models.survey.listSurveys()
        .then((surveys) => {
            expect(surveys.length).to.equal(1);
            return models.question.listQuestions();
        })
        .then((questions) => {
            expect(questions.length).to.equal(4);
            return questions.reduce((r, question) => {
                const text = question.text.toLowerCase();
                if (text === 'first name') {
                    r.firstNameId = question.id;
                    return r;
                }
                if (text === 'last name') {
                    r.lastNameId = question.id;
                    return r;
                }
                return r;
            }, {});
        })
        .then((info) => {
            expect(info.firstNameId).to.be.above(0);
            expect(info.lastNameId).to.be.above(0);
            return info;
        })
        .then(info => models.sequelize.transaction(tx => dbUpdate(models, info, tx)));
};
