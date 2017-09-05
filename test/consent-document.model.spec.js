/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SPromise = require('../lib/promise');
const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const History = require('./util/history');
const ConsentDocumentHistory = require('./util/consent-document-history');
const models = require('../models');
const comparator = require('./util/comparator');

const expect = chai.expect;

const generator = new Generator();
const shared = new SharedSpec(generator);

describe('consent document/type/signature unit', () => {
    const userCount = 4;

    const history = new ConsentDocumentHistory(userCount);
    const hxConsent = new History();

    before(shared.setUpFn());

    const verifyConsentTypeInListFn = function () {
        return function verifyConsentTypeInList() {
            return models.consentType.listConsentTypes()
                .then((result) => {
                    const types = history.listTypes();
                    expect(result).to.deep.equal(types);
                });
        };
    };

    _.range(2).forEach((i) => {
        it(`create consent type ${i}`, shared.createConsentTypeFn(history));
        it('verify consent type list', verifyConsentTypeInListFn);
        it(`add translated (es) consent type ${i}`, shared.translateConsentTypeFn(i, 'es', history.hxType));
    });

    _.range(userCount).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(history.hxUser));
    });

    it('error: no consent documents of existing types', () => models.userConsentDocument.listUserConsentDocuments(history.userId(0))
            .then(shared.throwingHandler, shared.expectedErrorHandler('noSystemConsentDocuments')));

    const verifyConsentDocumentFn = function (typeIndex) {
        return function verifyConsentDocument() {
            const cs = history.server(typeIndex);
            return models.consentDocument.getConsentDocument(cs.id)
                .then((result) => {
                    expect(result).to.deep.equal(cs);
                });
        };
    };

    const verifyConsentDocumentByTypeIdFn = function (typeIndex) {
        return function verifyConsentDocumentByTypeName() {
            const cs = history.server(typeIndex);
            const typeId = history.type(typeIndex).id;
            return models.consentDocument.getConsentDocumentByTypeId(typeId)
                .then((result) => {
                    expect(result).to.deep.equal(cs);
                });
        };
    };

    const verifyTranslatedConsentDocumentFn = function (index, language) {
        return function verifyTranslatedConsentDocument() {
            const id = history.id(index);
            return models.consentDocument.getConsentDocument(id, { language })
                .then((result) => {
                    const expected = history.hxDocument.translatedServer(index, language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    _.range(2).forEach((i) => {
        it(`create consent document of type ${i}`, shared.createConsentDocumentFn(history, i));
        it(`verify consent document of type ${i}`, verifyConsentDocumentFn(i));
        it(`verify consent document of type ${i} (type name)`, verifyConsentDocumentByTypeIdFn(i));
        it(`add translated (es) consent document ${i}`, shared.translateConsentDocumentFn(i, 'es', history));
        it(`verify translated (es) consent document of type ${i}`, verifyTranslatedConsentDocumentFn(i, 'es'));
    });

    it('error: no consent documents with type name', () => models.consentDocument.getConsentDocumentByTypeId(99999)
            .then(shared.throwingHandler, shared.expectedErrorHandler('consentTypeNotFound')));

    const verifyConsentDocuments = function (userIndex, expectedIndices) {
        it(`verify consent document list (required) for user ${userIndex}`, () => models.userConsentDocument.listUserConsentDocuments(history.userId(userIndex))
                .then((consentDocuments) => {
                    const expected = history.serversInList(expectedIndices);
                    comparator.consentDocuments(expected, consentDocuments);
                    return expected;
                }));
        it(`verify consent documents (required) for user ${userIndex}`, () => {
            const css = expectedIndices.map(index => history.server(index));
            return SPromise.all(css.map(cs => models.consentDocument.getConsentDocument(cs.id)
                    .then((result) => {
                        expect(result).to.deep.equal(cs);
                    })));
        });
        it(`verify consent document list (all) for user ${userIndex}`, () => models.userConsentDocument.listUserConsentDocuments(history.userId(userIndex), { includeSigned: true })
                .then((consentDocuments) => {
                    const expected = history.serversInListWithSigned(userIndex);
                    comparator.consentDocuments(expected, consentDocuments);
                    return expected;
                }));
    };

    const verifyTranslatedConsentDocuments = function (userIndex, expectedIndices, language) {
        it(`verify translated consent document list (required) for user ${userIndex}`, () => models.userConsentDocument.listUserConsentDocuments(history.userId(userIndex), { language })
                .then((consentDocuments) => {
                    const expected = history.translatedServersInList(expectedIndices, language);
                    comparator.consentDocuments(expected, consentDocuments);
                    return expected;
                }));
        it(`verify translated consent documents (required) for user ${userIndex}`, () => {
            const css = expectedIndices.map(index => history.hxDocument.translatedServer(index, language));
            return SPromise.all(css.map(cs => models.consentDocument.getConsentDocument(cs.id, { language })
                    .then((result) => {
                        expect(result).to.deep.equal(cs);
                    })));
        });
    };

    _.range(4).forEach((i) => {
        verifyConsentDocuments(i, [0, 1]);
        verifyTranslatedConsentDocuments(i, [0, 1], 'es');
    });

    const signConsentTypeFn = function (userIndex, typeIndex, language) {
        return function signConsentType() {
            const consentDocumentId = history.id(typeIndex);
            const userId = history.userId(userIndex);
            history.sign(typeIndex, userIndex, language);
            if (language) {
                return models.consentSignature.createSignature({ userId, consentDocumentId, language });
            }
            return models.consentSignature.createSignature({ userId, consentDocumentId });
        };
    };

    it('user 0 signs consent document of type 0', signConsentTypeFn(0, 0));
    it('user 0 signs consent document of type 1', signConsentTypeFn(0, 1));
    it('user 1 signs consent document of type 0', signConsentTypeFn(1, 0, 'en'));
    it('user 1 signs consent document of type 1', signConsentTypeFn(1, 1, 'es'));
    it('user 2 signs consent document of type 0', signConsentTypeFn(2, 0));
    it('user 3 signs consent document of type 1', signConsentTypeFn(3, 1));

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, []);
    verifyConsentDocuments(2, [1]);
    verifyConsentDocuments(3, [0]);

    it('error: invalid user signs already signed consent document of type 0 ', () => {
        const consentDocumentId = history.activeConsentDocuments[0].id;
        return models.consentSignature.createSignature({ userId: 999, consentDocumentId })
            .then(shared.throwingHandler, (err) => {
                expect(err).is.instanceof(models.sequelize.ForeignKeyConstraintError);
            });
    });

    it('error: user 0 signs invalid consent document', () => {
        const userId = history.userId(0);
        return models.consentSignature.createSignature({ userId, consentDocumentId: 999 })
            .then(shared.throwingHandler, (err) => {
                expect(err).is.instanceof(models.sequelize.ForeignKeyConstraintError);
            });
    });

    it('add consent type 2', shared.createConsentTypeFn(history));
    it('verify the new consent type in the list', verifyConsentTypeInListFn);

    it('error: no consent document of existing types', () => models.consentDocument.listConsentDocuments(history.userId(2))
            .then(shared.throwingHandler, shared.expectedErrorHandler('noSystemConsentDocuments')));

    it('create consent document of type 2', shared.createConsentDocumentFn(history, 2));
    it('verify consent document of type 2)', verifyConsentDocumentFn(2));

    verifyConsentDocuments(0, [2]);
    verifyConsentDocuments(1, [2]);
    verifyConsentDocuments(2, [1, 2]);
    verifyConsentDocuments(3, [0, 2]);

    it('user 2 signs consent document of type 2', signConsentTypeFn(2, 2, 'en'));
    verifyConsentDocuments(2, [1]);

    it('create consent document of type 1', shared.createConsentDocumentFn(history, 1));
    it('verify consent document of type 1', verifyConsentDocumentFn(1));

    verifyConsentDocuments(0, [1, 2]);
    verifyConsentDocuments(1, [1, 2]);
    verifyConsentDocuments(2, [1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    it('user 1 signs consent document of type 2', signConsentTypeFn(1, 2, 'es'));
    verifyConsentDocuments(1, [1]);

    it('create consent document of type 0', shared.createConsentDocumentFn(history, 0));
    it('verify consent document of type 0)', verifyConsentDocumentFn(0));

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0, 1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    it('user 2 signs consent document of type 1', signConsentTypeFn(2, 1));
    it('user 3 signs consent document of type 1', signConsentTypeFn(3, 1));

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0]);
    verifyConsentDocuments(3, [0, 2]);

    it('create consent document of type 1', shared.createConsentDocumentFn(history, 1));
    it('verify consent document of type 1)', verifyConsentDocumentFn(1));

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0, 1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    it('user 0 signs consent document of type 1', signConsentTypeFn(0, 1));
    verifyConsentDocuments(0, [0, 2]);
    it('user 0 signs consent document of type 2', signConsentTypeFn(0, 2, 'en'));
    verifyConsentDocuments(0, [0]);
    it('user 0 signs consent document of type 0', signConsentTypeFn(0, 0, 'es'));
    verifyConsentDocuments(0, []);

    it('create consent from types 0, 1, 2', () => {
        const sections = [0, 1, 2].map(typeIndex => history.typeId(typeIndex));
        const clientConsent = generator.newConsent({ sections });
        return models.consent.createConsent(clientConsent)
            .then(result => hxConsent.pushWithId(clientConsent, result.id));
    });

    it('error: delete consent type when on a consent', () => {
        const id = history.typeId(1);
        return models.consentType.deleteConsentType(id)
            .then(shared.throwingHandler, shared.expectedErrorHandler('consentTypeDeleteOnConsent'))
            .then(() => {
                const consentId = hxConsent.id(0);
                return models.consent.deleteConsent(consentId);
            });
    });

    it('delete consent type 1', () => {
        const id = history.typeId(1);
        return models.consentType.deleteConsentType(id)
            .then(() => {
                history.deleteType(1);
                return models.consentType.listConsentTypes()
                    .then((result) => {
                        const types = history.listTypes();
                        expect(result).to.deep.equal(types);
                    });
            });
    });

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [0]);
    verifyConsentDocuments(2, [0]);
    verifyConsentDocuments(3, [0, 2]);

    const verifySignatureExistenceFn = function (userIndex) {
        return function verifySignatureExistence() {
            const userId = history.userId(userIndex);
            return models.consentSignature.getSignatureHistory(userId)
                .then((result) => {
                    const expected = _.sortBy(history.signatures[userIndex], 'id');
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    _.range(userCount).forEach((i) => {
        it(`verify all signings still exists for user ${i}`, verifySignatureExistenceFn(i));
    });

    it('verify all consent documents still exists', () => models.consentDocument.listConsentDocuments({ noTypeExpand: true, paranoid: false })
            .then((consentDocuments) => {
                comparator.consentDocuments(history.serversHistory(), consentDocuments);
            })
            .then(() => models.consentDocument.listConsentDocuments({ noTypeExpand: true }))
            .then((consentDocuments) => {
                const expected = _.sortBy([history.server(0), history.server(2)], 'id');
                comparator.consentDocuments(expected, consentDocuments);
            }));
});
