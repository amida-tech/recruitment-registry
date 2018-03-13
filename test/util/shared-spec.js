'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const chai = require('chai');
const _ = require('lodash');
const sinon = require('sinon');
const request = require('request');

const models = require('../../models');

const Generator = require('./generator');
const comparator = require('./comparator');
const errHandler = require('./err-handler-spec');

const expect = chai.expect;

class SharedSpec {
    constructor(generator, inputModels) {
        this.models = inputModels || models;
        this.generator = generator || new Generator();
        this.throwingHandler = errHandler.throwingHandler;
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
                    const server = Object.assign({ id }, user);
                    hxUser.push(user, server);
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

    expectedErrorHandler(code, ...params) { // eslint-disable-line class-methods-use-this
        return errHandler.expectedErrorHandlerFn(code, ...params);
    }

    expectedSeqErrorHandler(name, fields) { // eslint-disable-line class-methods-use-this
        return errHandler.expectedSeqErrorHandlerFn(name, fields);
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

    stubRequestPost(error, data) { // eslint-disable-line class-methods-use-this
        return sinon.stub(request, 'post', (opts, callback) => {
            if (typeof opts === 'function') { callback = opts; }
            if (error) {
                return callback(typeof error === 'function' ? error() : error, data);
            }
            return callback(null, typeof data === 'function' ? data() : data);
        });
    }
}

module.exports = SharedSpec;
