'use strict';

const surveyCommon = require('./survey-common');

const generateAnswers = function (generator, survey, hxQuestion, qxIndices) {
    if (qxIndices) {
        return qxIndices.map((questionIndex) => {
            if (questionIndex < 0) {
                const questionId = hxQuestion.id(-questionIndex);
                return { questionId };
            }
            const question = hxQuestion.server(questionIndex);
            return generator.answerQuestion(question);
        });
    }
    const questions = Array.from(surveyCommon.iterQuestions(survey));
    return generator.answerQuestions(questions);
};

module.exports = {
    generateAnswers,
};
