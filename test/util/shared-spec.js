'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const chai = require('chai');
const _ = require('lodash');
const sinon = require('sinon');
const request = require('request');

const models = require('../../models');

const RRError = require('../../lib/rr-error');
const Generator = require('./generator');
const translator = require('./translator');
const comparator = require('./comparator');

const expect = chai.expect;

class SharedSpec {
    constructor(generator, inputModels) {
        this.models = inputModels || models;
        this.generator = generator || new Generator();
    }

    setUpFn(force = true) {
        const m = this.models;
        return function setUp() {
            return m.sequelize.sync({ force });
        };
    }

    createUserFn(hxUser, override) {
        const m = this.models;
        const generator = this.generator;
        return function createUser() {
            const user = generator.newUser(override);
            return m.user.createUser(user)
                .then(({ id }) => {
                    hxUser.push(user, { id });
                });
        };
    }

    authenticateUserFn(hxUser, index) {
        const m = this.models;
        return function authenticateUser() {
            const client = hxUser.client(index);
            const username = client.username || client.email;
            return m.auth.authenticateUser(username, client.password);
        };
    }

    createProfileSurveyFn(hxSurvey) {
        const m = this.models;
        const generator = this.generator;
        return function createProfileSurvey() {
            const survey = generator.newSurvey();
            return m.profileSurvey.createProfileSurvey(survey)
                .then(({ id }) => hxSurvey.push(survey, { id }));
        };
    }

    verifyProfileSurveyFn(hxSurvey, index) {
        const m = this.models;
        return function verifyProfileSurvey() {
            return m.profileSurvey.getProfileSurvey()
                .then((profileSurvey) => {
                    expect(profileSurvey.exists).to.equal(true);
                    const survey = profileSurvey.survey;
                    const id = hxSurvey.id(index);
                    expect(survey.id).to.equal(id);
                    hxSurvey.updateServer(index, survey);
                    comparator.survey(hxSurvey.client(index), survey);
                });
        };
    }

    createConsentTypeFn(history) {
        const m = this.models;
        const generator = this.generator;
        return function createConsentType() {
            const cst = generator.newConsentType();
            return m.consentType.createConsentType(cst)
                .then(server => history.pushType(cst, server));
        };
    }

    translateConsentTypeFn(index, language, hxType) {
        const m = this.models;
        return function translateConsentType() {
            const server = hxType.server(index);
            const translation = translator.translateConsentType(server, language);
            return m.consentType.updateConsentTypeText(translation, language)
                .then(() => {
                    hxType.translate(index, language, translation);
                });
        };
    }

    translateConsentDocumentFn(index, language, history) {
        const m = this.models;
        return function translateConsentDocument() {
            const server = history.server(index);
            const translation = translator.translateConsentDocument(server, language);
            return m.consentDocument.updateConsentDocumentText(translation, language)
                .then(() => {
                    history.hxDocument.translateWithServer(server, language, translation);
                });
        };
    }

    createConsentDocumentFn(history, typeIndex) {
        const m = this.models;
        const generator = this.generator;
        return function createConsentDocument() {
            const typeId = history.typeId(typeIndex);
            const cs = generator.newConsentDocument({ typeId });
            return m.consentDocument.createConsentDocument(cs)
                .then(server => history.push(typeIndex, cs, server));
        };
    }

    createConsentFn(hxConsent, hxConsentDocument, typeIndices) {
        const m = this.models;
        const generator = this.generator;
        return function createConsent() {
            const sections = typeIndices.map(typeIndex => hxConsentDocument.typeId(typeIndex));
            const clientConsent = generator.newConsent({ sections });
            return m.consent.createConsent(clientConsent)
                .then(result => hxConsent.pushWithId(clientConsent, result.id));
        };
    }

    verifyConsentFn(hxConsent, index) {
        const m = this.models;
        return function verifyConsent() {
            const id = hxConsent.id(index);
            return m.consent.getConsent(id)
                .then((consent) => {
                    const expected = hxConsent.server(index);
                    expect(consent).to.deep.equal(expected);
                });
        };
    }

    signConsentTypeFn(history, userIndex, typeIndex) {
        const m = this.models;
        return function signConsentType() {
            const consentDocumentId = history.id(typeIndex);
            const userId = history.userId(userIndex);
            history.sign(typeIndex, userIndex);
            return m.consentSignature.createSignature({ userId, consentDocumentId });
        };
    }

    bulkSignConsentTypeFn(history, userIndex, typeIndices) {
        const m = this.models;
        return function bulkSignConsentType() {
            const consentDocumentIds = typeIndices.map(typeIndex => history.id(typeIndex));
            const userId = history.userId(userIndex);
            typeIndices.forEach(typeIndex => history.sign(typeIndex, userIndex));
            return m.consentSignature.bulkCreateSignatures(consentDocumentIds, { userId });
        };
    }

    throwingHandler() { // eslint-disable-line class-methods-use-this
        throw new Error('Unexpected no error.');
    }

    expectedErrorHandler(code, ...params) { // eslint-disable-line class-methods-use-this
        return function expectedErrorHandler(err) {
            if (!(err instanceof RRError)) {
                console.log(err); // eslint-disable-line no-console
            }
            expect(err).to.be.instanceof(RRError);
            expect(err.code).to.equal(code);
            expect(err.params).to.deep.equal(params);
            return err;
        };
    }

    expectedSeqErrorHandler(name, fields) { // eslint-disable-line class-methods-use-this
        return function expectedSeqErrorHandler(err) {
            expect(err.name).to.equal(name);
            expect(err.fields).to.deep.equal(fields);
            return err;
        };
    }

    sanityEnoughUserTested(hxUser) { // eslint-disable-line class-methods-use-this
        return function sanityEnoughUserTested() {
            const userCount = hxUser.length();
            const counts = _.range(userCount).reduce((r, index) => {
                if (hxUser.client(index).username) {
                    r.username += 1;
                } else {
                    r.email += 1;
                }
                return r;
            }, { username: 0, email: 0 });
            expect(counts.username).to.be.above(0);
            expect(counts.email).to.be.above(0);
        };
    }

    stubRequestGet(error, data) { // eslint-disable-line class-methods-use-this
        return sinon.stub(request, 'get', (opts, callback) => {
            if (typeof opts === 'function') { callback = opts; }
            if (error) {
                return callback(typeof error === 'function' ? error() : error, data);
            }
            return callback(null, typeof data === 'function' ? data() : data);
        });
    }
}

module.exports = SharedSpec;
