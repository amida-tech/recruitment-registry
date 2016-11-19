/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const SharedIntegration = require('../util/shared-integration');
const Generator = require('../util/entity-generator');
const consentSeed = require('../util/consent-seed');
const consentExample = require('../fixtures/example/consent-demo');

const userExamples = require('../fixtures/example/user');
const surveyExamples = require('../fixtures/example/survey');

const helper = require('../util/survey-common');

const models = require('../../models');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('consent demo simpler', function () {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.Alzheimer;

    const store = {
        server: null,
        auth: null
    };

    //*******
    // Sync and seed the database.  This is part of syncAndLoadAlzheimer.js script.  It creates the consent documents.
    // The document contents themselves are in test/fixtures/example/consent-demo.  Change the content however you wish.
    // This also adds a profile survey.
    //******* START 1

    before(shared.setUpFn(store));

    it('create Terms of Use and Consent Form records', function () {
        return models.profileSurvey.createProfileSurvey(surveyExample.survey);
    });

    it('create Terms of Use and Consent Form records', function () {
        return consentSeed(consentExample);
    });

    let termsOfUse;

    //****** END 1

    //******
    // Get Terms of Use before registration.  The content will be in res.body.content.  Show it to user.
    // If user accepts note res.body.id.  That is what we store as signature for now.  However since
    // user has not been created you can not save to db yet.  That is next.
    //****** START 2

    it('get Terms of Use before registration', function (done) {
        store.server
            .get('/api/v1.0/consent-documents/type-name/terms-of-use')
            .expect(200)
            .expect(function (res) {
                const result = res.body;
                expect(!!result.content).to.equal(true);
                termsOfUse = res.body;
                //console.log(res.body);
            })
            .end(done);

    });

    //****** END 2

    //******
    // Get the profile survey.  This is what needs to be filled by the user for registration.
    // Show it to the user and collect answers.  Togther with the username, password, and email
    // info.  When submitting also submit the signature.
    //****** START 3
    let survey;

    it('get profile survey', function (done) {
        store.server
            .get('/api/v1.0/profile-survey')
            .expect(200)
            .expect(function (res) {
                survey = res.body.survey;
            })
            .end(done);
    });

    let answers;

    it('fill user profile and submit', function (done) {
        answers = helper.formAnswersToPost(survey, surveyExample.answer);

        store.server
            .post('/api/v1.0/profiles')
            .send({
                user: userExample,
                answers,
                signatures: [termsOfUse.id] // HERE IS THE SIGNATURE
            })
            .expect(201)
            .expect(function (res) {
                store.auth = 'Bearer ' + res.body.token;
            })
            .end(done);
    });

    //****** END 3

    //******
    // Later you can always get the Terms of use and check if a new signature is needed.
    // New signature will be needed if a new Terms of Use document is posted.
    //****** START 4

    it('login as user', shared.loginFn(store, userExample));

    it('get the Terms of Use document with signature', function (done) {
        store.server
            .get('/api/v1.0/user-consent-documents/type-name/terms-of-use')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                expect(res.body.content).to.equal(termsOfUse.content);
                expect(res.body.signature).to.equal(true);
                //console.log(res.body);
            })
            .end(done);
    });

    //****** END 4

    let consents;

    //******
    // Get the Consent Form and check if it is signed.  Again the content is in res.body.content
    // Here it has not been signed yet.
    //****** START 5

    it('get the Consents document', function (done) {
        store.server
            .get('/api/v1.0/user-consent-documents/type-name/consent')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                consents = res.body;
                expect(res.body.signature).to.equal(false);
                //console.log(res.body);
            })
            .end(done);
    });

    //****** END 5

    //******
    // If user accepts sign the Consent Form.
    //****** START 6

    it('sign the Consents document', function (done) {
        store.server
            .post(`/api/v1.0/consent-signatures`)
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .send({ consentDocumentId: consents.id })
            .expect(201)
            .expect(function () {})
            .end(done);
    });

    //****** END 6

    //******
    // Get the Consent Form and check if it is signed.\
    // Here it has now been signed yet.
    //****** START 7

    it('get the Consents document', function (done) {
        store.server
            .get(`/api/v1.0/user-consent-documents/type-name/consent`)
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                consents = res.body;
                expect(res.body.signature).to.equal(true);
                //console.log(res.body);
            })
            .end(done);
    });

    //****** END 7

    it('logout as user', shared.logoutFn(store));
});
