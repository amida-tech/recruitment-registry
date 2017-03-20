/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const surveyExamples = require('../fixtures/example/survey');
const comparator = require('../util/comparator');

const config = require('../../config');

const expect = chai.expect;

describe('create-show-survey use case', () => {
    const surveyExample = surveyExamples.Alzheimer.survey;

    // -------- set up system (syncAndLoadAlzheimer)

    const rrSuperTest = new RRSuperTest();
    const shared = new SharedIntegration(rrSuperTest);

    before(shared.setUpFn());

    it('login as super user', shared.loginFn(config.superUser));

    it('create registry', shared.createSurveyProfileFn(surveyExample));

    it('logout as super user', shared.logoutFn());

    // -------- only admin's create surveys

    it('login as super user', shared.loginFn(config.superUser));

    // -------- see only Alzheimers in the survey list

    it('list surveys to see Alzheimers for users profile', (done) => {
        rrSuperTest.get('/surveys', true, 200)
            .expect((res) => {
                const surveys = res.body;
                expect(surveys).to.have.length(1);
                expect(surveys[0].name).to.equal(surveyExample.name);
            })
            .end(done);
    });

    // -------- create another survey

    it('create a new survey', (done) => {
        rrSuperTest.post('/surveys', surveyExamples.Example.survey, 201).end(done);
    });

    // ------- list surveys and select one to shoe

    it('list surveys to see the new survey', (done) => {
        rrSuperTest.get('/surveys', true, 200)
            .expect((res) => {
                const surveys = res.body;
                expect(surveys).to.have.length(2);
                expect(surveys[0].name).to.equal(surveyExample.name);
                expect(surveys[1].name).to.equal(surveyExamples.Example.survey.name);
                rrSuperTest.lastId = surveys[1].id;
            })
            .end(done);
    });

    it('show the new survey', (done) => {
        rrSuperTest.get(`/surveys/${rrSuperTest.lastId}`, true, 200)
            .expect((res) => {
                comparator.survey(surveyExamples.Example.survey, res.body);
            })
            .end(done);
    });
});
