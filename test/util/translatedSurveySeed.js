'use strict';

const _ = require('lodash');

const models = require('../../models');
const SPromise = require('../../lib/promise');

module.exports = function translatedSurveySeed(id, surveyTranslation, qxTranslations) {
    const translationRecord = Object.assign({ id }, surveyTranslation);
    return models.survey.patchSurveyText(translationRecord, 'es')
        .then(() => models.survey.getSurvey(id))
        .then(survey => survey.questions)
        .then((questions) => {
            let px = SPromise.resolve();
            questions.forEach((question, qxIndex) => {
                const qxTranslation = qxTranslations[qxIndex];
                const t = _.cloneDeep(qxTranslation);
                t.id = question.id;
                if (qxTranslation.choices) {
                    t.choices = qxTranslation.choices.map(({ text }, index) => ({
                        id: question.choices[index].id,
                        text,
                    }));
                }
                px = px.then(() => models.question.updateQuestionText(t, 'es'));
            });
            return px;
        });
};
