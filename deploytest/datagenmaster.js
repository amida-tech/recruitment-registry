// Ran on master to generate the db that is dumped in r003_test_dump.sql

// 'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

// process.env.NODE_ENV = 'test';
// process.env.RECREG_DB_NAME_OVERRIDE = 'recregmigrate';
//
// const fs = require('fs');
// const path = require('path');
// const chai = require('chai');
// const _ = require('lodash');
//
// const models = require('./models');
//
// const History = require('./test/util/history');
// const comparator = require('./test/util/comparator');
//
// const expect = chai.expect;
//
// const consentSeed = require('./test/util/consent-seed');
// const consentExample = require('./test/fixtures/example/consent-demo');
//
// const survey = {
//     name: 'Alzheimer',
//     questions: [{
//         text: 'First Name',
//         required: true,
//         type: 'text',
//     }, {
//         text: 'Last Name',
//         required: true,
//         type: 'text',
//     },
//     {
//         text: 'Zip Code',
//         required: true,
//         type: 'zip',
//     }, {
//         text: 'Year of Birth',
//         required: true,
//         type: 'year',
//     }],
// };
//
// const generate = function (index, questionIdMap) {
//     const user = {
//         email: `email_${index}@example.com`,
//         password: `password_${index}`,
//         role: 'participant',
//     };
//
//     const answers = [{
//         questionId: questionIdMap.get(0),
//         answer: {
//             textValue: `firstname_${index}`,
//         },
//     }, {
//         questionId: questionIdMap.get(1),
//         answer: {
//             textValue: `lastname_${index}`,
//         },
//     }, {
//         questionId: questionIdMap.get(2),
//         answer: {
//             textValue: `2000${index}`,
//         },
//     }, {
//         questionId: questionIdMap.get(3),
//         answer: {
//             textValue: `197${index}`,
//         },
//     }];
//
//     const signatures = [1];
//
//     return { user, answers, signatures };
// };
//
// describe('generate data for migration test', function generateData() {
//     const hxUser = new History();
//     const hxAnswers = [];
//
//     it('sync previous db', function syncPreviousDB() {
//         return models.sequelize.sync({ force: true })
//             .then(() => models.profileSurvey.createProfileSurvey(survey))
//             .then(() => consentSeed(consentExample));
//     });
//
//     const questionIdMap = new Map();
//
//     it('populate question id maps', function populateQuestionIdMap() {
//         return models.question.listQuestions()
//             .then((questions) => {
//                 const qxs = survey.questions;
//                 const indexMap = new Map(qxs.map(({ text }, index) => [text, index]));
//                 questions.forEach(({ id, text }) => {
//                     const index = indexMap.get(text);
//                     questionIdMap.set(index, id);
//                 });
//             });
//     });
//
//     const verifyProfileSurveyFn = function (expected) {
//         return function verifyProfileSurvey() {
//             return models.profileSurvey.getProfileSurvey()
//                 .then((profileSurvey) => {
//                     expect(profileSurvey.exists).to.equal(true);
//                     comparator.survey(expected, profileSurvey.survey);
//                 });
//         };
//     };
//
//     it('verify profile survey before', verifyProfileSurveyFn(survey));
//
//     const userCount = 5;
//
//     const createProfileFn = function (index) {
//         return function createProfile() {
//             const profile = generate(index, questionIdMap);
//             return models.profile.createProfile(profile)
//                 .then(({ id }) => hxUser.push(profile.user, { id }))
//                 .then(() => hxAnswers.push(profile.survey));
//         };
//     };
//
//     const verifyProfileFn = function (userIndex) {
//         return function verifyProfile() {
//             const userId = hxUser.id(userIndex);
//             return models.profile.getProfile({ userId })
//                 .then((result) => {
//                     comparator.user(hxUser.client(userIndex), result.user);
//                 });
//         };
//     };
//
//     _.range(userCount).forEach((index) => {
//         it(`register user ${index}`, createProfileFn(index));
//         it(`verify user ${index} profile`, verifyProfileFn(index));
//     });
// });
//
