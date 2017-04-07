'use strict';

/* eslint no-console: 0 */

const models = require('./models');

const surveyExamples = require('./test/fixtures/example/survey');
const userExamples = require('./test/fixtures/example/user');
const consentSeed = require('./test/util/consent-seed');
const consentExample = require('./test/fixtures/example/consent-demo');

const userExample = userExamples.Alzheimer;
const sample = surveyExamples.Alzheimer;

const helper = require('./test/util/survey-common');

models.sequelize.sync({ force: true })
    .then(() => models.profileSurvey.createProfileSurvey(sample.survey))
    .then(() => models.profileSurvey.getProfileSurvey())
    .then((profileSurvey) => {
        const answers = helper.formAnswersToPost(profileSurvey.survey, sample.answer);
        return models.profile.createProfile({
            user: userExample,
            answers,
        });
    })
    .then(() => models.survey.createSurvey(surveyExamples.Example.survey))
    .then(() => consentSeed(consentExample))
    .then(() => {
        console.log('success');
    })
    .catch((err) => {
        console.log('failure');
        console.log(err);
    });
