/* global describe,before,it */

'use strict';

/* eslint max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');
const moment = require('moment');

const Generator = require('../util/generator');
const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const exampleSurveys = require('../fixtures/example/survey');
const config = require('../../config');

const surveyCommon = require('../util/survey-common');
const SurveyHistory = require('../util/survey-history');

const expect = chai.expect;

// TODO: eventually assign these to the key of answerValueType?
// NOTE: see `/models/dao/demographics.dao.js` ._castAnswerValueByType()
const getAnswerValue = (question) => {
    if (question.type === 'text') {
        return question.answer.textValue;
    } else if (question.type === 'integer') {
        return parseInt(question.answer.integerValue, 10);
    } else if (question.type === 'zip') {
        return question.answer.textValue;
    } else if (question.type === 'year') {
        return question.answer.yearValue;
    } else if (question.type === 'bool') {
        return question.answer.boolValue;
    } else if (question.type === 'date') {
        return question.answer.dateValue;
    }
    // // FIXME: only returns a true value... need to join with questionChoice
    // else if(question.type === 'choice') {
    //     return question.answer.choice;
    // }
    // // // FIXME will always be null... need to join with questionChoice
    // else if(question.type === 'choices') {
    //     return question.answer.choices;
    // }

    return question.answer.textValue;
};

describe('demographics', function ageCohort() {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest);

    const hxSurvey = new SurveyHistory();
    const tests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);

    let expectedDemographics = [];

    before(shared.setUpFn());

    it('login as super user', shared.loginFn(config.superUser));

    it('create a survey', tests.createSurveyFn());

    it('create profile survey', shared.createSurveyProfileFn(exampleSurveys.variousQuestionTypes));

    it('logout as super user', shared.logoutFn());

    let questionIds;

    it('get profile survey', function getProfileSurvey() {
        return rrSuperTest.get('/profile-survey', false, 200)
            .then((res) => {
                const profileSurvey = res.body.survey;
                questionIds = _.map(profileSurvey.questions, 'id');
            });
    });

    _.range(5).forEach((index) => {
        it(`register clinician ${index}`, function registerUser() {
            const user = {
                username: `clinician_${index}`,
                email: `clinician${index}@email.com`,
                password: `pAsS${index}${index + 1}${index + 3}${index + 4}`,
                firstname: `Clinician-First-${index}`,
                lastname: `Clinician-Last-${index}`,
                role: 'clinician',
            };
            const boolValue = Math.random() >= 0.5;
            const textValue = `sampleString${index}`;
            const integerValue = index;
            const zipAnswer = `${20850 + index}`;
            const birthYear = (2020 - 90) + (index * 2);

            const answers = [
                {
                    questionId: questionIds[0],
                    answer: { boolValue },
                },
                {
                    questionId: questionIds[1],
                    answer: { textValue },
                },
                {
                    questionId: questionIds[2],
                    answer: { integerValue },
                },
                {
                    questionId: questionIds[3],
                    answer: { textValue: zipAnswer },
                },
                {
                    questionId: questionIds[4],
                    answer: { yearValue: `${birthYear}` },
                },
                {
                    questionId: questionIds[5],
                    answer: { dateValue: `${birthYear}-12-31` },
                },
                // {
                //     questionId: questionIds[6],
                //     answer: { choice: 3 },
                // },
                // {
                //     questionId: questionIds[7],
                //     answer: { choices: [{ id: 2 }, { id: 3 }, { id: 4 }] },
                // },
            ];
            return rrSuperTest.authPost('/profiles', { user, answers }, 201);
        });
        it(`logout as user ${index}`, shared.logoutFn());
    });

    _.range(20).forEach((index) => {
        it(`register participant ${index}`, function registerUser() {
            const user = generator.newUser();

            const boolValue = Math.random() >= 0.5;
            const textValue = `sampleString${index}`;
            const integerValue = index;
            const zipAnswer = `${20850 + index}`;
            const birthYear = (2020 - 90) + (index * 2);

            const answers = [
                {
                    questionId: questionIds[0],
                    answer: { boolValue },
                },
                {
                    questionId: questionIds[1],
                    answer: { textValue },
                },
                {
                    questionId: questionIds[2],
                    answer: { integerValue },
                },
                {
                    questionId: questionIds[3],
                    answer: { textValue: zipAnswer },
                },
                {
                    questionId: questionIds[4],
                    answer: { yearValue: `${birthYear}` },
                },
                {
                    questionId: questionIds[5],
                    answer: { dateValue: `${birthYear}-12-31` },
                },
                // {
                //     questionId: questionIds[6],
                //     answer: { choice: 3 },
                // },
                // {
                //     questionId: questionIds[7],
                //     answer: { choices: [{ id: 2 }, { id: 3 }, { id: 4 }] },
                // },
            ];

            return rrSuperTest.authPost('/profiles', { user, answers }, 201)
                .then(() => rrSuperTest.get('/profiles', false, 200)
                        .then((res) => {
                            const userInfo = res.body.user;
                            const surveyInfo = res.body.survey;
                            const rawDemographics = surveyInfo.questions.map((question) => {
                                const key = question.text;
                                const value = getAnswerValue(question);
                                return {
                                    user: userInfo.id,
                                    [key]: value,
                                };
                            });
                            _.chain(rawDemographics)
                                .groupBy('userId')
                                .forEach((userRecordSet) => {
                                    let unifiedRecord = {};
                                    userRecordSet.forEach((record) => {
                                        unifiedRecord = Object.assign(unifiedRecord, record);
                                    });
                                    delete unifiedRecord.user;
                                    unifiedRecord.registrationDate = moment(userInfo.createdAt, 'YYYY-MM-DD').format('YYYY-MM-DD');
                                    expectedDemographics.push(unifiedRecord);
                                })
                                .flattenDeep()
                                .value();
                        }));
        });
        it(`logout as user ${index}`, shared.logoutFn());
    });

    it('login as super user', shared.loginFn(config.superUser));

    it('get demographics', function getDemographics() {
        return rrSuperTest.get('/demographics', false, 200)
            .then((res) => {
                const demographics = res.body;
                expect(demographics).to.deep.equal(expectedDemographics);
            });
    });

    it('create profile survey', shared.createSurveyProfileFn(exampleSurveys.zipYOBProfileSurvey));

    it('logout as super user', shared.logoutFn());

    /* GAP Survey */

    it('get profile survey', function getProfileSurvey() {
        expectedDemographics = [];
        return rrSuperTest.get('/profile-survey', false, 200)
            .then((res) => {
                const profileSurvey = res.body.survey;
                questionIds = _.map(profileSurvey.questions, 'id');
            });
    });

    _.range(5).forEach((index) => {
        const newIndex = index + 5;
        it(`register clinician ${newIndex}`, function registerUser() {
            const user = {
                username: `clinician_${newIndex}`,
                email: `clinician${newIndex}@email.com`,
                password: `pAsS${newIndex}${newIndex + 1}${newIndex + 3}${newIndex + 4}`,
                firstname: `Clinician-First-${newIndex}`,
                lastname: `Clinician-Last-${newIndex}`,
                role: 'clinician',
            };
            const birthYear = (2020 - 90) + (newIndex * 2);
            const zipAnswer = `${20850 + newIndex}`;
            const answers = [{
                questionId: questionIds[0],
                answer: { yearValue: `${birthYear}` },
            }, {
                questionId: questionIds[1],
                answer: { textValue: zipAnswer },
            }];
            return rrSuperTest.authPost('/profiles', { user, answers }, 201);
        });
        it(`logout as user ${newIndex}`, shared.logoutFn());
    });

    _.range(20).forEach((index) => {
        const newIndex = index + 20;
        it(`register user ${newIndex}`, function registerUser() {
            const user = generator.newUser();
            const birthYear = (2020 - 90) + (newIndex * 2);
            const zipAnswer = `${20850 + newIndex}`;
            const answers = [{
                questionId: questionIds[0],
                answer: { yearValue: `${birthYear}` },
            }, {
                questionId: questionIds[1],
                answer: { textValue: zipAnswer },
            }];

            return rrSuperTest.authPost('/profiles', { user, answers }, 201)
                .then(() => rrSuperTest.get('/profiles', false, 200)
                        .then((res) => {
                            const userInfo = res.body.user;
                            const surveyInfo = res.body.survey;
                            const rawDemographics = surveyInfo.questions.map((question) => {
                                const key = question.text;
                                const value = getAnswerValue(question);
                                return {
                                    user: userInfo.id,
                                    [key]: value,
                                };
                            });
                            _.chain(rawDemographics)
                                .groupBy('userId')
                                .forEach((userRecordSet) => {
                                    let unifiedRecord = {};
                                    userRecordSet.forEach((record) => {
                                        unifiedRecord = Object.assign(unifiedRecord, record);
                                    });
                                    delete unifiedRecord.user;
                                    unifiedRecord.registrationDate = moment(userInfo.createdAt, 'YYYY-MM-DD').format('YYYY-MM-DD');
                                    expectedDemographics.push(unifiedRecord);
                                })
                                .flattenDeep()
                                .value();
                        }));
        });
        it(`logout as user ${newIndex}`, shared.logoutFn());
    });

    it('login as super user', shared.loginFn(config.superUser));

    it('get demographics', function getDemographics() {
        return rrSuperTest.get('/demographics', false, 200)
            .then((res) => {
                const demographics = res.body;
                expect(demographics).to.deep.equal(expectedDemographics);
            });
    });

    it('logout as super user', shared.logoutFn());
});
