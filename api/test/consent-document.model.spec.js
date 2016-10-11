/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const ConsentDocumentHistory = require('./util/consent-document-history');
const models = require('../models');
const expect = chai.expect;

const User = models.User;
const shared = new SharedSpec();
const ConsentType = models.ConsentType;
const ConsentDocument = models.ConsentDocument;
const ConsentSignature = models.ConsentSignature;

describe('consent document/type/signature unit', function () {
    const userCount = 4;

    const history = new ConsentDocumentHistory(userCount);

    before(shared.setUpFn());

    const verifyConsentTypeInListFn = function () {
        return function () {
            return ConsentType.listConsentTypes()
                .then(result => {
                    const types = history.listTypes();
                    expect(result).to.deep.equal(types);
                });
        };
    };

    for (let i = 0; i < 2; ++i) {
        it(`create consent type ${i}`, shared.createConsentTypeFn(history));
        it(`verify consent type list`, verifyConsentTypeInListFn);
    }

    for (let i = 0; i < userCount; ++i) {
        it(`create user ${i}`, shared.createUser(history.hxUser));
    }

    it('error: no consent sections of existing types', function () {
        return User.listConsentDocuments(history.userId(0))
            .then(shared.throwingHandler, shared.expectedErrorHandler('noSystemConsentDocuments'));
    });

    const verifyConsentDocumentFn = function (typeIndex) {
        return function () {
            const cs = history.server(typeIndex);
            return ConsentDocument.getConsentDocument(cs.id)
                .then(result => {
                    expect(result).to.deep.equal(cs);
                });
        };
    };

    for (let i = 0; i < 2; ++i) {
        it(`create/verify consent section of type ${i}`, shared.createConsentDocumentFn(history, i));
        it(`verify consent section content of type ${i}`, verifyConsentDocumentFn(i));
    }

    const verifyConsentDocumentsFn = function (userIndex, expectedIndices) {
        return function () {
            return User.listConsentDocuments(history.userId(userIndex))
                .then(consentDocuments => {
                    const expected = history.serversInList(expectedIndices);
                    expect(consentDocuments).to.deep.equal(expected);
                    return expected;
                })
                .then(() => {
                    const css = expectedIndices.map(index => history.server(index));
                    return models.sequelize.Promise.all(css.map(cs => {
                        return ConsentDocument.getConsentDocument(cs.id)
                            .then(result => {
                                expect(result).to.deep.equal(cs);
                            });
                    }));
                });
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`verify consent sections required for user ${i}`, verifyConsentDocumentsFn(i, [0, 1]));
    }

    const signConsentTypeFn = function (userIndex, typeIndex) {
        return function () {
            const consentDocumentId = history.id(typeIndex);
            const userId = history.userId(userIndex);
            history.sign(typeIndex, userIndex);
            return ConsentSignature.createSignature(userId, consentDocumentId);
        };
    };

    it('user 0 signs consent document 0', signConsentTypeFn(0, 0));
    it('user 0 signs consent document 1', signConsentTypeFn(0, 1));
    it('user 1 signs consent document 0', signConsentTypeFn(1, 0));
    it('user 1 signs consent document 1', signConsentTypeFn(1, 1));
    it('user 2 signs consent document 0', signConsentTypeFn(2, 0));
    it('user 3 signs consent document 1', signConsentTypeFn(3, 1));

    it('verify consent sections required for user 0', verifyConsentDocumentsFn(0, []));
    it('verify consent sections required for user 1', verifyConsentDocumentsFn(1, []));
    it('verify consent sections required for user 2', verifyConsentDocumentsFn(2, [1]));
    it('verify consent sections required for user 3', verifyConsentDocumentsFn(3, [0]));

    it('error: invalid user signs consent document 0', function () {
        const consentDocumentId = history.activeConsentDocuments[0].id;
        return ConsentSignature.createSignature(9999, consentDocumentId)
            .then(shared.throwingHandler, err => {
                expect(err).is.instanceof(models.sequelize.ForeignKeyConstraintError);
            });
    });

    it('error: user 0 signs invalid consent section', function () {
        const userId = history.userId(0);
        return ConsentSignature.createSignature(userId, 9999)
            .then(shared.throwingHandler, err => {
                expect(err).is.instanceof(models.sequelize.ForeignKeyConstraintError);
            });
    });

    it('add a new consent type', shared.createConsentTypeFn(history));
    it(`verify the new consent section in the list`, verifyConsentTypeInListFn);

    it('error: no consent sections of existing types', function () {
        return User.listConsentDocuments(history.userId(2))
            .then(shared.throwingHandler, shared.expectedErrorHandler('noSystemConsentDocuments'));
    });

    it('create/verify consent section of type 2', shared.createConsentDocumentFn(history, 2));
    it(`verify consent section content of type 2)`, verifyConsentDocumentFn(2));

    it('verify consent sections required for user 0', verifyConsentDocumentsFn(0, [2]));
    it('verify consent sections required for user 1', verifyConsentDocumentsFn(1, [2]));
    it('verify consent sections required for user 2', verifyConsentDocumentsFn(2, [1, 2]));
    it('verify consent sections required for user 3', verifyConsentDocumentsFn(3, [0, 2]));

    it('user 2 signs consent document 2', signConsentTypeFn(2, 2));
    it('verify consent sections required for user 2', verifyConsentDocumentsFn(2, [1]));

    it('create/verify consent section of type 1', shared.createConsentDocumentFn(history, 1));
    it(`verify consent section content of type 1)`, verifyConsentDocumentFn(1));

    it('verify consent sections required for user 0', verifyConsentDocumentsFn(0, [1, 2]));
    it('verify consent sections required for user 1', verifyConsentDocumentsFn(1, [1, 2]));
    it('verify consent sections required for user 2', verifyConsentDocumentsFn(2, [1]));
    it('verify consent sections required for user 3', verifyConsentDocumentsFn(3, [0, 1, 2]));

    it('user 1 signs consent document 2', signConsentTypeFn(1, 2));
    it('verify consent sections required for user 1', verifyConsentDocumentsFn(1, [1]));

    it('create/verify consent section of type 0', shared.createConsentDocumentFn(history, 0));
    it(`verify consent section content of type 0)`, verifyConsentDocumentFn(0));

    it('verify consent sections required for user 0', verifyConsentDocumentsFn(0, [0, 1, 2]));
    it('verify consent sections required for user 1', verifyConsentDocumentsFn(1, [0, 1]));
    it('verify consent sections required for user 2', verifyConsentDocumentsFn(2, [0, 1]));
    it('verify consent sections required for user 3', verifyConsentDocumentsFn(3, [0, 1, 2]));

    it('user 2 signs consent document 1', signConsentTypeFn(2, 1));
    it('user 3 signs consent document 1', signConsentTypeFn(3, 1));

    it('verify consent sections required for user 0', verifyConsentDocumentsFn(0, [0, 1, 2]));
    it('verify consent sections required for user 1', verifyConsentDocumentsFn(1, [0, 1]));
    it('verify consent sections required for user 2', verifyConsentDocumentsFn(2, [0]));
    it('verify consent sections required for user 3', verifyConsentDocumentsFn(3, [0, 2]));

    it('create/verify consent section of type 1', shared.createConsentDocumentFn(history, 1));
    it(`verify consent section content of type 1)`, verifyConsentDocumentFn(1));

    it('verify consent sections required for user 0', verifyConsentDocumentsFn(0, [0, 1, 2]));
    it('verify consent sections required for user 1', verifyConsentDocumentsFn(1, [0, 1]));
    it('verify consent sections required for user 2', verifyConsentDocumentsFn(2, [0, 1]));
    it('verify consent sections required for user 3', verifyConsentDocumentsFn(3, [0, 1, 2]));

    it('user 0 signs consent document 1', signConsentTypeFn(0, 1));
    it('verify consent sections required for user 0', verifyConsentDocumentsFn(0, [0, 2]));
    it('user 0 signs consent document 2', signConsentTypeFn(0, 2));
    it('verify consent sections required for user 0', verifyConsentDocumentsFn(0, [0]));
    it('user 0 signs consent document 0', signConsentTypeFn(0, 0));
    it('verify consent sections required for user 0', verifyConsentDocumentsFn(0, []));

    it('delete consent type 1', function () {
        const id = history.typeId(1);
        return ConsentType.deleteConsentType(id)
            .then(() => {
                history.deleteType(1);
                return ConsentType.listConsentTypes()
                    .then(result => {
                        const types = history.listTypes();
                        expect(result).to.deep.equal(types);
                    });
            });
    });

    it('verify consent sections required for user 0', verifyConsentDocumentsFn(0, []));
    it('verify consent sections required for user 1', verifyConsentDocumentsFn(1, [0]));
    it('verify consent sections required for user 2', verifyConsentDocumentsFn(2, [0]));
    it('verify consent sections required for user 3', verifyConsentDocumentsFn(3, [0, 1]));

    const verifySignatureExistenceFn = function (userIndex) {
        return function () {
            const userId = history.userId(userIndex);
            return ConsentSignature.findAll({
                    where: { userId },
                    raw: true,
                    attributes: ['consentDocumentId', 'createdAt'],
                    order: 'consent_document_id'
                })
                .then(result => {
                    const actual = _.map(result, 'consentDocumentId');
                    const expected = _.sortBy(history.signatures[userIndex]);
                    expect(actual).to.deep.equal(expected);
                    const allExists = _.map(result, 'createdAt').map(r => !!r);
                    expect(allExists).to.deep.equal(Array(expected.length).fill(true));
                });
        };
    };

    for (let i = 0; i < userCount; ++i) {
        it(`verify all signings still exists for user ${i}`, verifySignatureExistenceFn(i));
    }

    it('verify all consent sections still exists', function () {
        const queryParams = { raw: true, attributes: ['id', 'typeId', 'content', 'updateComment'], order: ['id'] };
        const queryParamsAll = Object.assign({}, { paranoid: false }, queryParams);
        return ConsentDocument.findAll(queryParamsAll)
            .then(consentDocuments => {
                expect(consentDocuments).to.deep.equal(history.consentDocuments);
            })
            .then(() => ConsentDocument.findAll(queryParams))
            .then(consentDocuments => {
                const expected = _.sortBy([history.server(0), history.server(1)], 'id');
                expect(consentDocuments).to.deep.equal(expected);
            });
    });
});
