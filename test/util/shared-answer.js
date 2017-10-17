'use strict';

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
    return generator.answerQuestions(survey.questions);
};

module.exports = {
    generateAnswers,
};
