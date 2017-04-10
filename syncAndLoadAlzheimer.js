'use strict';

/* eslint no-console: 0 */

const models = require('./models');

const surveyExamples = require('./test/fixtures/example/survey');
const userExamples = require('./test/fixtures/example/user');
const consentSeed = require('./test/util/consent-seed');
const translatedSurveySeed = require('./test/util/translatedSurveySeed');
const consentExample = require('./test/fixtures/example/consent-demo');

const userExample = userExamples.Alzheimer;

const helper = require('./test/util/survey-common');

const qxTranslations = surveyExamples.exampleQxTranslation;

models.sequelize.sync({ force: true })
    .then(() => models.profileSurvey.createProfileSurvey(surveyExamples.alzheimer))
    .then(() => models.profileSurvey.getProfileSurvey())
    .then((profileSurvey) => {
        const alzheimerAnswer = surveyExamples.alzheimerAnswer;
        const answers = helper.formAnswersToPost(profileSurvey.survey, alzheimerAnswer);
        return models.profile.createProfile({
            user: userExample,
            answers,
        });
    })
    .then(() => models.survey.createSurvey(surveyExamples.example))
    .then(id => translatedSurveySeed(id, surveyExamples.exampleTranslation, qxTranslations))
    .then(() => consentSeed(consentExample))
    .then(() => {
        console.log('success');
    })
    .catch((err) => {
        console.log('failure');
        console.log(err);
    });
