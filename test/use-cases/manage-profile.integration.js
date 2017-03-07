/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const helper = require('../util/survey-common');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const userExamples = require('../fixtures/example/user');
const surveyExamples = require('../fixtures/example/survey');

const config = require('../../config');

const expect = chai.expect;
const shared = new SharedIntegration();

describe('user set-up and login use-case', () => {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    // -------- set up system (syncAndLoadAlzheimer)

    const store = new RRSuperTest();

    before(shared.setUpFn(store));

    it('login as super user', shared.loginFn(store, config.superUser));

    it('create registry', shared.createSurveyProfileFn(store, surveyExample.survey));

    it('logout as super user', shared.logoutFn(store));

    // --------

    // -------- client initialization

    let survey;

    it('get profile survey', (done) => {
        store.get('/profile-survey', false, 200)
            .expect((res) => {
                survey = res.body.survey;
            })
            .end(done);
    });

    // --------- set up account

    let answers;

    it('fill user profile and submit', (done) => {
        answers = helper.formAnswersToPost(survey, surveyExample.answer);
        const user = userExample;
        store.authPost('/profiles', { user, answers }, 201).end(done);
    });

    // -------- verification

    it('verify user profile', (done) => {
        store.get('/profiles', true, 200)
            .expect((res) => {
                const result = res.body;

                const expectedUser = _.cloneDeep(userExample);
                const user = result.user;
                expectedUser.id = user.id;
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expectedUser.createdAt = user.createdAt;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);
            })
            .end(done);
    });

    // --------

    it('update user profile', (done) => {
        answers = helper.formAnswersToPost(survey, surveyExample.answerUpdate);
        const userUpdates = {
            email: 'updated@example.com',
        };
        const user = userUpdates;
        store.patch('/profiles', { user, answers }, 204)
            .send({
                user: userUpdates,
                answers,
            })
            .end(done);
    });

    it('verify user profile', (done) => {
        store.get('/profiles', true, 200)
            .expect((res) => {
                const result = res.body;

                const expectedUser = _.cloneDeep(userExample);
                expectedUser.email = 'updated@example.com';
                const user = result.user;
                expectedUser.id = user.id;
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expectedUser.createdAt = user.createdAt;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);
            })
            .end(done);
    });
});
