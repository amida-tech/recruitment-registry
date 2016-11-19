/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const surveyExamples = require('../fixtures/example/survey');
const comparator = require('../util/client-server-comparator');

const config = require('../../config');

const expect = chai.expect;
const shared = new SharedIntegration();

describe('create-show-survey use case', function () {
    const surveyExample = surveyExamples.Alzheimer.survey;

    // -------- set up system (syncAndLoadAlzheimer)

    const store = new RRSuperTest();

    before(shared.setUpFn(store));

    it('login as super user', shared.loginFn(store, config.superUser));

    it('create registry', shared.createSurveyProfileFn(store, surveyExample));

    it('logout as super user', shared.logoutFn(store));

    // -------- only admin's create surveys

    it('login as super user', shared.loginFn(store, config.superUser));

    // -------- see only Alzheimers in the survey list

    it('list surveys to see Alzheimers for users profile', function (done) {
        store.server
            .get('/api/v1.0/surveys')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                const surveys = res.body;
                expect(surveys).to.have.length(1);
                expect(surveys[0].name).to.equal(surveyExample.name);
            })
            .end(done);
    });

    //-------- create another survey

    it('create a new survey', function (done) {
        store.server
            .post('/api/v1.0/surveys')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .send(surveyExamples.Example.survey)
            .expect(201)
            .end(done);
    });

    //------- list surveys and select one to shoe

    it('list surveys to see the new survey', function (done) {
        store.server
            .get('/api/v1.0/surveys')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                const surveys = res.body;
                expect(surveys).to.have.length(2);
                expect(surveys[0].name).to.equal(surveyExample.name);
                expect(surveys[1].name).to.equal(surveyExamples.Example.survey.name);
                store.lastId = surveys[1].id;
            })
            .end(done);
    });

    it('show the new survey', function (done) {
        store.server
            .get(`/api/v1.0/surveys/${store.lastId}`)
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                comparator.survey(surveyExamples.Example.survey, res.body)
                    .then(done, done);
            });
    });
});
