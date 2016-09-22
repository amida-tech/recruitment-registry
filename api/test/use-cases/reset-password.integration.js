/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');

const helper = require('../helper/survey-helper');

const shared = require('../shared-integration');
const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');
const registryExamples = require('../fixtures/registry-examples');

const config = require('../../config');
const mailer = require('../../lib/mailer');

const expect = chai.expect;

describe('reset password use-case', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;
    const registryExample = registryExamples[0];

    // -------- set up system (syncAndLoadAlzheimer)

    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    it('login as super user', shared.loginFn(store, config.superUser));

    it('create registry', shared.postRegistryFn(store, registryExample));

    it('logout as super user', shared.logoutFn(store));

    // --------

    // -------- client initialization

    let survey;

    it('get profile survey', function (done) {
        store.server
            .get('/api/v1.0/registries/profile-survey/Alzheimer')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                survey = res.body;
                done();
            });
    });

    // --------- set up account

    let answers;

    it('fill user profile and submit', function (done) {
        answers = helper.formAnswersToPost(survey, surveyExample.answer);

        store.server
            .post('/api/v1.0/registries/user-profile')
            .send({
                user: userExample,
                registryName: survey.name,
                answers
            })
            .expect(201, done);
    });

    // --------- login

    it('verify user can login', shared.loginFn(store, userExample));

    let token;

    it('generate reset tokens', function (done) {
        const stub = sinon.stub(mailer, 'sendEmail', function (spec, callback) {
            const linkPieces = spec.link.split('/');
            token = linkPieces[linkPieces.length - 1];
            callback(null);
        });
        store.server
            .post('/api/v1.0/reset-tokens')
            .send({
                email: userExample.email
            })
            .expect(201)
            .end(function (err) {
                if (err) {
                    return done(err);
                }
                expect(stub.called).to.equal(true);
                mailer.sendEmail.restore();
                expect(!!token).to.equal(true);
                done();
            });
    });

    it('verify user can not login', shared.badLoginFn(store, userExample));

    it('reset password', function (done) {
        store.server
            .post('/api/v1.0/users/password')
            .send({
                token,
                password: 'newPassword'
            })
            .expect(201, done);
    });

    it('verify user can not login with old password', shared.badLoginFn(store, userExample));

    it('verify user can login', shared.loginFn(store, {
        username: userExample.username,
        password: 'newPassword'
    }));
});
