/* global xdescribe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/entity-generator');
const History = require('./util/entity-history');
const ConsentDocumentHistory = require('./util/consent-document-history');
const models = require('../models');

const expect = chai.expect;
const generator = new Generator();

const shared = new SharedSpec(generator);
const Consent = models.Consent;
const ConsentSignature = models.ConsentSignature;

xdescribe('consent unit', function () {
    const userCount = 4;
    const typeCount = 12;

    const history = new ConsentDocumentHistory(userCount);
    const hxConsent = new History();

    before(shared.setUpFn());

    for (let i = 0; i < typeCount; ++i) {
        it(`create consent type ${i}`, shared.createConsentTypeFn(history));
    }

    for (let i = 0; i < userCount; ++i) {
        it(`create user ${i}`, shared.createUser(history.hxUser));
    }

    for (let i = 0; i < typeCount; ++i) {
        it(`create/verify consent document of type ${i}`, shared.createConsentDocumentFn(history, i));
    }

    const consentSpecs = [
        [0, 1, 2, 3, 4], // consent 0. Sections of types 0, 1, 2, 3, 4
        [8, 5, 10, 11], // consent 1. Sections of types 8, 5, 11, 12
        [2, 3, 6, 7], // consent 2. Sections of types 2, 3, 6, 7
        [8, 11, 9] // consent 3. Sections of types 8, 11, 9
    ];

    consentSpecs.forEach((typeIndices, index) => {
        it(`create consent ${index}`, function () {
            const typeIds = typeIndices.map(typeIndex => history.typeId(typeIndex));
            const clientConsent = generator.newConsent({ typeIds });
            return Consent.createConsent(clientConsent)
                .then(result => hxConsent.push(clientConsent, result));
        });
    });

    _.range(consentSpecs.length).forEach(index => {
        it(`get/verify consent ${index})`, function () {
            const id = hxConsent.id(index);
            return Consent.getConsent(id)
                .then(consent => {
                    const expected = hxConsent.server(index);
                    expect(consent).to.deep.equal(expected);
                });
        });
    });

    _.range(consentSpecs.length).forEach(index => {
        it(`get/verify consent by name ${index})`, function () {
            const name = hxConsent.client(index).name;
            return Consent.getConsentByName(name)
                .then(consent => {
                    const expected = hxConsent.server(index);
                    expect(consent).to.deep.equal(expected);
                });
        });
    });

    const listConsentsFn = function () {
        return Consent.listConsents()
            .then(consents => {
                const expected = hxConsent.serversInList();
                expect(consents).to.deep.equal(expected);
            });
    };

    it('list/verify consents', listConsentsFn);

    it('delete consent 2', function () {
        const id = hxConsent.id(2);
        return Consent.deleteConsent(id)
            .then(() => {
                hxConsent.remove(2);
            });
    });

    it('list/verify consents', listConsentsFn);

    const formExpectedConsent = function (index, typeIndices, signatures) {
        const serverConsent = hxConsent.serverConsent(index);
        const expectedSections = typeIndices.map(typeIndex => {
            const consentDocument = history.server(typeIndex);
            const typeDetail = history.type(typeIndex);
            const section = Object.assign({}, typeDetail, consentDocument);
            if (signatures) {
                section.signature = Boolean(signatures[typeIndex]);
            }
            return signatures;
        });
        let result = _.omit(serverConsent, 'typeIds');
        result.sections = expectedSections;
        return result;
    };

    const getUserConsentDocuments = function (userIndex, index, signatureIndices) {
        const id = hxConsent.id(index);
        const userId = history.userId(userIndex);
        return Consent.getUserConsentDocuments(userId, id)
            .then(consent => {
                const typeIndices = consentSpecs[index];
                const signatures = signatureIndices.reduce((r, i) => (r[i] = true, r), {});
                const expected = formExpectedConsent(index, typeIndices, signatures);
                expect(consent).to.deep.equal(expected);
            });
    };

    [0, 1, 3].forEach(consentIndex => {
        it(`get/verify consent ${consentIndex} documents`, function () {
            const id = hxConsent.id(consentIndex);
            return Consent.getConsentDocuments(id)
                .then(consent => {
                    const typeIndices = consentSpecs[consentIndex];
                    const expected = formExpectedConsent(consentIndex, typeIndices);
                    expect(consent).to.deep.equal(expected);
                });
        });

        _.range(userCount).forEach(userIndex => {
            it(`get/verify user consent ${consentIndex} documents`, function () {
                return getUserConsentDocuments(userIndex, consentIndex, []);
            });
        });
    });

    const signDocumentsFn = function (userIndex, index, newSignatureIndices, expectedSignatureIndices) {
        return function () {
            const userId = history.userId(userIndex);
            const documentIds = newSignatureIndices.map(i => history.id(i));
            return ConsentSignature.bulkCreateSignatures(userId, documentIds)
                .then(() => getUserConsentDocuments(userIndex, index, expectedSignatureIndices));
        };
    };

    it('user 0 signs consent 0 (1, 2, 3)', signDocumentsFn(0, 0, [1, 2, 3], [1, 2, 3]));
    it('user 1 signs consent 1 (5, 10, 11)', signDocumentsFn(0, 0, [5, 10, 11], [5, 10, 11]));
    it('user 2 signs consent 3 (8, 9, 10)', signDocumentsFn(0, 0, [8, 9, 10], [8, 9, 10]));
    it('user 3 signs consent 0 (0, 2, 3, 4)', signDocumentsFn(0, 0, [0, 2, 3, 4], [0, 2, 3, 4]));

    [2, 10, 8, 4].forEach(typeIndex => {
        it(`create/verify consent document of type ${typeIndex}`, shared.createConsentDocumentFn(history, typeIndex));
    });

    it(`get/verify user 0 consent 0 documents`, function () {
        return getUserConsentDocuments(0, 0, [1, 3]);
    });
    it(`get/verify user 1 consent 1 documents`, function () {
        return getUserConsentDocuments(1, 1, [5, 11]);
    });
    it(`get/verify user 2 consent 3 documents`, function () {
        return getUserConsentDocuments(2, 3, [9]);
    });
    it(`get/verify user 3 consent 0 documents`, function () {
        return getUserConsentDocuments(3, 0, [0, 3]);
    });

    it('user 0 signs consent 0 (0, 2)', signDocumentsFn(0, 0, [0, 2], [0, 1, 2, 3]));
    it('user 1 signs consent 1 (8, 10)', signDocumentsFn(0, 0, [8, 10, 11], [5, 8, 10, 11]));
    it('user 2 signs consent 3 (8, 11)', signDocumentsFn(0, 0, [8, 11], [8, 9, 11]));
    it('user 3 signs consent 0 (2, 4)', signDocumentsFn(0, 0, [2, 4], [0, 2, 3, 4]));
});
