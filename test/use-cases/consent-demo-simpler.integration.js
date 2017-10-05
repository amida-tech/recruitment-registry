/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');

const SharedIntegration = require('../util/shared-integration');
const RRSuperTest = require('../util/rr-super-test');
const Generator = require('../util/generator');
const consentSeed = require('../util/consent-seed');
const consentExample = require('../fixtures/example/consent-demo');

const userExamples = require('../fixtures/example/user');
const surveyExamples = require('../fixtures/example/survey');

const helper = require('../util/survey-common');

const models = require('../../models');

const expect = chai.expect;

describe('consent demo simpler', () => {
    const userExample = userExamples.Alzheimer;
    const surveyExample = surveyExamples.alzheimer;

    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);

    //* ******
    // Sync and seed the database.  This is part of syncAndLoadAlzheimer.js script.
    // It creates the consent documents.
    // The document contents themselves are in test/fixtures/example/consent-demo.
    // Change the content however you wish.
    // This also adds a profile survey.
    //* ****** START 1

    before(shared.setUpFn());

    it('create profile survey', function createProfile() {
        return models.profileSurvey.createProfileSurvey(surveyExample);
    });

    it('create consent Forms', function fnConsentSeed() {
        return consentSeed(consentExample);
    });

    let termsOfUse;

    //* ***** END 1

    //* *****
    // Get Terms of Use before registration.  The content will be in res.body.content.
    // Show it to user.
    // If user accepts note res.body.id.  That is what we rrSuperTest as signature for now.
    // However since user has not been created you can not save to db yet.  That is next.
    //* ***** START 2

    it('get Terms of Use before registration', (done) => {
        rrSuperTest.get('/consent-documents/type/1', false, 200)
            .expect((res) => {
                const result = res.body;
                expect(!!result.content).to.equal(true);
                termsOfUse = res.body;
                // console.log(res.body);
            })
            .end(done);
    });

    //* ***** END 2

    //* *****
    // Get the profile survey.  This is what needs to be filled by the user for registration.
    // Show it to the user and collect answers.  Togther with the username, password, and email
    // info.  When submitting also submit the signature.
    //* ***** START 3
    let survey;

    it('get profile survey', (done) => {
        rrSuperTest.get('/profile-survey', false, 200)
            .expect((res) => {
                survey = res.body.survey;
            })
            .end(done);
    });

    let answers;

    it('fill user profile and submit', (done) => {
        answers = helper.formAnswersToPost(survey, surveyExamples.alzheimerAnswer);
        const input = {
            user: userExample,
            answers,
            signatures: [termsOfUse.id], // HERE IS THE SIGNATURE
        };
        rrSuperTest.post('/profiles', input, 201).end(done);
    });

    //* ***** END 3

    //* *****
    // Later you can always get the Terms of use and check if a new signature is needed.
    // New signature will be needed if a new Terms of Use document is posted.
    //* ***** START 4

    it('login as user', shared.loginFn(userExample));

    it('get the Terms of Use document with signature', (done) => {
        rrSuperTest.get('/user-consent-documents/type/1', true, 200)
            .expect((res) => {
                expect(res.body.content).to.equal(termsOfUse.content);
                expect(res.body.signature).to.equal(true);
                // console.log(res.body);
            })
            .end(done);
    });

    //* ***** END 4

    let consents;

    //* *****
    // Get the Consent Form and check if it is signed.  Again the content is in res.body.content
    // Here it has not been signed yet.
    //* ***** START 5

    it('get the Consents document', (done) => {
        rrSuperTest.get('/user-consent-documents/type/2', true, 200)
            .expect((res) => {
                consents = res.body;
                expect(res.body.signature).to.equal(false);
                // console.log(res.body);
            })
            .end(done);
    });

    //* ***** END 5

    //* *****
    // If user accepts sign the Consent Form.
    //* ***** START 6

    it('sign the Consents document', (done) => {
        rrSuperTest.post('/consent-signatures', { consentDocumentId: consents.id }, 201).end(done);
    });

    //* ***** END 6

    //* *****
    // Get the Consent Form and check if it is signed.\
    // Here it has now been signed yet.
    //* ***** START 7

    it('get the Consents document', (done) => {
        rrSuperTest.get('/user-consent-documents/type/2', true, 200)
            .expect((res) => {
                consents = res.body;
                expect(res.body.signature).to.equal(true);
                // console.log(res.body);
            })
            .end(done);
    });

    //* ***** END 7

    it('logout as user', shared.logoutFn());
});
