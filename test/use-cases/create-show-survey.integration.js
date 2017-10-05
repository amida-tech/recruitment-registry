/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const surveyExamples = require('../fixtures/example/survey');
const comparator = require('../util/comparator');

const config = require('../../config');

const expect = chai.expect;

describe('create-show-survey use case', () => {
    // -------- set up system (syncAndLoadAlzheimer)

    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest);

    before(shared.setUpFn());

    it('login as super user', shared.loginFn(config.superUser));

    it('create registry', shared.createSurveyProfileFn(surveyExamples.alzheimer));

    it('logout as super user', shared.logoutFn());

    // -------- only admin's create surveys

    it('login as super user', shared.loginFn(config.superUser));

    // -------- see only Alzheimers in the survey list

    it('list surveys to see Alzheimers for users profile', function listSurveys() {
        return rrSuperTest.get('/surveys', true, 200)
            .then((res) => {
                const surveys = res.body;
                expect(surveys).to.have.length(1);
                expect(surveys[0].name).to.equal(surveyExamples.alzheimer.name);
            });
    });

    // -------- create another survey

    it('create a new survey', function createNewSurvey() {
        return rrSuperTest.post('/surveys', surveyExamples.example, 201);
    });

    // ------- list surveys and select one to shoe

    it('list surveys to see the new survey', function listSurveys4New() {
        return rrSuperTest.get('/surveys', true, 200)
            .then((res) => {
                const surveys = res.body;
                expect(surveys).to.have.length(2);
                expect(surveys[0].name).to.equal(surveyExamples.alzheimer.name);
                expect(surveys[1].name).to.equal(surveyExamples.example.name);
                rrSuperTest.lastId = surveys[1].id;
            });
    });

    it('show the new survey', function showNew() {
        return rrSuperTest.get(`/surveys/${rrSuperTest.lastId}`, true, 200)
            .then((res) => {
                let expected = surveyExamples.example;
                if (rrSuperTest.userRole === 'admin') {
                    expected = _.cloneDeep(expected);
                    expected.authorId = rrSuperTest.userId;
                }
                comparator.survey(expected, res.body);
            });
    });
});
