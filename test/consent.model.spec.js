/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const History = require('./util/history');
const ConsentCommon = require('./util/consent-common');
const ConsentDocumentHistory = require('./util/consent-document-history');
const models = require('../models');
const translator = require('./util/translator');
const comparator = require('./util/comparator');

const expect = chai.expect;
const generator = new Generator();

const shared = new SharedSpec(generator);

describe('consent unit', () => {
    const userCount = 4;
    const typeCount = 12;

    const history = new ConsentDocumentHistory(userCount);
    const hxConsent = new History();
    const consentCommon = new ConsentCommon(hxConsent, history, generator);

    before(shared.setUpFn());

    _.range(typeCount).forEach((i) => {
        it(`create consent type ${i}`, shared.createConsentTypeFn(history));
        it(`add translated (es) consent type ${i}`, shared.translateConsentTypeFn(i, 'es', history.hxType));
    });

    _.range(userCount).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(history.hxUser));
    });

    const consentSpecs = [
        [0, 1, 2, 3, 4], // consent 0. Sections of types 0, 1, 2, 3, 4
        [8, 5, 10, 11], // consent 1. Sections of types 8, 5, 11, 12
        [2, 3, 6, 7], // consent 2. Sections of types 2, 3, 6, 7
        [8, 11, 9], // consent 3. Sections of types 8, 11, 9
    ];

    consentSpecs.forEach((typeIndices, index) => {
        it(`create consent ${index}`, shared.createConsentFn(hxConsent, history, typeIndices));
        it(`get/verify consent ${index}`, shared.verifyConsentFn(hxConsent, index));
    });

    _.range(consentSpecs.length).forEach((index) => {
        it(`get/verify consent by name ${index}`, () => {
            const name = hxConsent.client(index).name;
            return models.consent.getConsentByName(name)
                .then((consent) => {
                    const expected = hxConsent.server(index);
                    expect(consent).to.deep.equal(expected);
                });
        });
    });

    const listConsentsFn = function () {
        return models.consent.listConsents()
            .then((consents) => {
                const expected = hxConsent.listServers();
                expect(consents).to.deep.equal(expected);
            });
    };

    it('list/verify consents', listConsentsFn);

    it('delete consent 2', () => {
        const id = hxConsent.id(2);
        return models.consent.deleteConsent(id)
            .then(() => {
                hxConsent.remove(2);
            });
    });

    it('list/verify consents', listConsentsFn);

    const getUserConsentDocuments = function (userIndex, index, signatureIndices) {
        const id = hxConsent.id(index);
        const userId = history.userId(userIndex);
        return models.consent.getUserConsentDocuments(userId, id)
            .then((consent) => {
                const typeIndices = consentSpecs[index];
                const signatures = signatureIndices.reduce((r, i) => {
                    if (Array.isArray(i)) {
                        r[i[0]] = i[1];
                    } else {
                        r[i] = 'en';
                    }
                    return r;
                }, {});
                const expected = consentCommon.formExpectedConsent(index, typeIndices, signatures);
                comparator.consent(expected, consent);
            });
    };

    const getTranslatedUserConsentDocuments = function (userIndex, index, signatureIndices, language) {
        const id = hxConsent.id(index);
        const userId = history.userId(userIndex);
        return models.consent.getUserConsentDocuments(userId, id, { language })
            .then((consent) => {
                const typeIndices = consentSpecs[index];
                const signatures = signatureIndices.reduce((r, i) => {
                    if (Array.isArray(i)) {
                        r[i[0]] = i[1];
                    } else {
                        r[i] = 'en';
                    }
                    return r;
                }, {});
                const expected = consentCommon.formTranslatedExpectedConsent(index, typeIndices, signatures, language);
                comparator.consent(expected, consent);
                translator.isConsentDocumentTranslated(consent, language);
            });
    };

    const getUserConsentDocumentsByName = function (userIndex, index, signatureIndices) {
        const name = hxConsent.server(index).name;
        const userId = history.userId(userIndex);
        return models.consent.getUserConsentDocumentsByName(userId, name)
            .then((consent) => {
                const typeIndices = consentSpecs[index];
                const signatures = signatureIndices.reduce((r, i) => {
                    if (Array.isArray(i)) {
                        r[i[0]] = i[1];
                    } else {
                        r[i] = 'en';
                    }
                    return r;
                }, {});
                const expected = consentCommon.formExpectedConsent(index, typeIndices, signatures);
                comparator.consent(expected, consent);
            });
    };

    const getTranslatedUserConsentDocumentsByName = function (userIndex, index, signatureIndices, language) {
        const name = hxConsent.server(index).name;
        const userId = history.userId(userIndex);
        return models.consent.getUserConsentDocumentsByName(userId, name, { language })
            .then((consent) => {
                const typeIndices = consentSpecs[index];
                const signatures = signatureIndices.reduce((r, i) => {
                    if (Array.isArray(i)) {
                        r[i[0]] = i[1];
                    } else {
                        r[i] = 'en';
                    }
                    return r;
                }, {});
                const expected = consentCommon.formTranslatedExpectedConsent(index, typeIndices, signatures, language);
                translator.isConsentDocumentTranslated(consent, language);
                comparator.consent(expected, consent);
            });
    };

    _.range(3).forEach((i) => {
        it(`create/verify consent document of type ${i}`, shared.createConsentDocumentFn(history, i));
        it(`add translated (es) consent document ${i}`, shared.translateConsentDocumentFn(i, 'es', history));
    });

    it('error: get consent 0 documents', () => {
        const id = hxConsent.id(0);
        return models.consent.getConsentDocuments(id)
            .then(shared.throwingHandler, shared.expectedErrorHandler('noSystemConsentDocuments'));
    });

    _.range(3, typeCount).forEach((i) => {
        it(`create/verify consent document of type ${i}`, shared.createConsentDocumentFn(history, i));
        it(`add translated (es) consent document ${i}`, shared.translateConsentDocumentFn(i, 'es', history));
    });

    [0, 1, 3].forEach((consentIndex) => {
        it(`get/verify consent ${consentIndex} documents`, () => {
            const id = hxConsent.id(consentIndex);
            return models.consent.getConsentDocuments(id)
                .then((consent) => {
                    const typeIndices = consentSpecs[consentIndex];
                    const expected = consentCommon.formExpectedConsent(consentIndex, typeIndices);
                    comparator.consent(expected, consent);
                });
        });

        it(`get/verify translated (es) consent ${consentIndex} documents`, () => {
            const id = hxConsent.id(consentIndex);
            return models.consent.getConsentDocuments(id, { language: 'es' })
                .then((consent) => {
                    const typeIndices = consentSpecs[consentIndex];
                    const expected = consentCommon.formTranslatedExpectedConsent(consentIndex, typeIndices, undefined, 'es');
                    comparator.consent(expected, consent);
                    translator.isConsentDocumentTranslated(consent, 'es');
                });
        });

        it(`get/verify consent ${consentIndex} documents by name`, () => {
            const name = hxConsent.server(consentIndex).name;
            return models.consent.getConsentDocumentsByName(name)
                .then((consent) => {
                    const typeIndices = consentSpecs[consentIndex];
                    const expected = consentCommon.formExpectedConsent(consentIndex, typeIndices);
                    comparator.consent(expected, consent);
                });
        });

        it(`get/verify translated (es) consent ${consentIndex} documents by name`, () => {
            const name = hxConsent.server(consentIndex).name;
            return models.consent.getConsentDocumentsByName(name, { language: 'es' })
                .then((consent) => {
                    const typeIndices = consentSpecs[consentIndex];
                    const expected = consentCommon.formTranslatedExpectedConsent(consentIndex, typeIndices, undefined, 'es');
                    comparator.consent(expected, consent);
                    translator.isConsentDocumentTranslated(consent, 'es');
                });
        });

        _.range(userCount).forEach((userIndex) => {
            it(`get/verify user consent ${consentIndex} documents`, () => getUserConsentDocuments(userIndex, consentIndex, []));
            it(`get/verify user consent ${consentIndex} documents by name`, () => getUserConsentDocumentsByName(userIndex, consentIndex, []));
            it(`get/verify translated (es) user consent ${consentIndex} documents`, () => getTranslatedUserConsentDocuments(userIndex, consentIndex, [], 'es'));
            it(`get/verify translated (es) user consent ${consentIndex} documents by name`, () => getTranslatedUserConsentDocumentsByName(userIndex, consentIndex, [], 'es'));
        });
    });

    const signDocumentsFn = function (userIndex, index, newSignatureIndices, expectedSignatureIndices, language) {
        return function signDocuments() {
            const userId = history.userId(userIndex);
            const documentIds = newSignatureIndices.map(i => history.id(i));
            return models.consentSignature.bulkCreateSignatures(documentIds, { userId, language })
                .then(() => getUserConsentDocuments(userIndex, index, expectedSignatureIndices));
        };
    };

    it('user 0 signs consent 0 (1, 2, 3)', signDocumentsFn(0, 0, [1, 2, 3], [
        [1, 'es'],
        [2, 'es'],
        [3, 'es'],
    ], 'es'));
    it('user 1 signs consent 1 (5, 10, 11)', signDocumentsFn(1, 1, [5, 10, 11], [5, 10, 11], 'en'));
    it('user 2 signs consent 3 (8, 9, 10)', signDocumentsFn(2, 3, [8, 9, 10], [8, 9, 10]));
    it('user 3 signs consent 0 (0, 2, 3, 4)', signDocumentsFn(3, 0, [0, 2, 3, 4], [0, 2, 3, 4]));

    [2, 10, 8, 4].forEach((typeIndex) => {
        it(`create/verify consent document of type ${typeIndex}`, shared.createConsentDocumentFn(history, typeIndex));
        it(`add translated (es) consent document ${typeIndex}`, shared.translateConsentDocumentFn(typeIndex, 'es', history));
    });

    it('get/verify user 0 consent 0 documents', () => getUserConsentDocuments(0, 0, [
            [1, 'es'],
            [3, 'es'],
    ]));
    it('get/verify user 0 consent 0 documents by name', () => getUserConsentDocumentsByName(0, 0, [
            [1, 'es'],
            [3, 'es'],
    ]));
    it('get/verify user 1 consent 1 documents', () => getUserConsentDocuments(1, 1, [5, 11]));
    it('get/verify user 2 consent 3 documents', () => getUserConsentDocuments(2, 3, [9]));
    it('get/verify user 3 consent 0 documents', () => getUserConsentDocuments(3, 0, [0, 3]));

    it('get/verify translated (es) user 1 consent 1 documents', () => getTranslatedUserConsentDocuments(1, 1, [5, 11], 'es'));
    it('get/verify translated (es) user 2 consent 3 documents', () => getTranslatedUserConsentDocuments(2, 3, [9], 'es'));
    it('get/verify translated (es) user 3 consent 0 documents', () => getTranslatedUserConsentDocuments(3, 0, [0, 3], 'es'));

    it('user 0 signs consent 0 (0, 2)', signDocumentsFn(0, 0, [0, 2], [0, [1, 'es'], 2, [3, 'es']], 'en'));
    it('user 1 signs consent 1 (8, 10)', signDocumentsFn(1, 1, [8, 10], [5, [8, 'es'],
        [10, 'es'], 11,
    ], 'es'));
    it('user 2 signs consent 3 (8, 11)', signDocumentsFn(2, 3, [8, 11], [8, 9, 11]));
    it('user 3 signs consent 0 (2, 4)', signDocumentsFn(3, 0, [2, 4], [0, 2, 3, 4]));

    [2, 10].forEach((typeIndex) => {
        it(`create/verify consent document of type ${typeIndex}`, shared.createConsentDocumentFn(history, typeIndex));
        it(`add translated (es) consent document ${typeIndex}`, shared.translateConsentDocumentFn(typeIndex, 'es', history));
    });

    it('update history for type 2', () => {
        const typeId = history.typeId(2);
        return models.consentDocument.getUpdateCommentHistory(typeId)
            .then((result) => {
                const servers = history.serversHistory().filter(h => (h.typeId === typeId));
                const comments = _.map(servers, 'updateComment');
                expect(result).to.deep.equal(comments);
            });
    });

    it('translated (es) update history for type 2', () => {
        const typeId = history.typeId(2);
        return models.consentDocument.getUpdateCommentHistory(typeId, 'es')
            .then((result) => {
                const servers = history.translatedServersHistory('es').filter(h => (h.typeId === typeId));
                const comments = _.map(servers, 'updateComment');
                expect(result).to.deep.equal(comments);
            });
    });
});
