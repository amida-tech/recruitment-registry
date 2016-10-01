/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const shared = require('../shared-spec');
const models = require('../../models');
const expect = chai.expect;

const User = models.User;
const DocumentType = models.DocumentType;
const Document = models.Document;
const DocumentSignature = models.DocumentSignature;

describe('document unit', function () {
    const userCount = 4;

    const store = {
        userIds: [],
        documentTypes: [],
        clientDocuments: [],
        documents: [],
        activeDocuments: [],
        signatures: _.range(userCount).map(() => [])
    };

    before(shared.setUpFn());

    const createDocumentTypeFn = (function () {
        let index = -1;

        return function () {
            ++index;
            const docType = {
                name: `type_${index}`,
                description: 'description_${index}'
            };
            return DocumentType.createDocumentType(docType)
                .then(({ id }) => {
                    const newDocType = Object.assign({}, docType, { id });
                    store.documentTypes.push(newDocType);
                    store.activeDocuments.push(null);
                })
                .then(() => {
                    return DocumentType.getDocumentTypes()
                        .then(result => {
                            expect(result).to.deep.equal(store.documentTypes);
                        });
                });
        };
    })();

    for (let i = 0; i < 2; ++i) {
        it(`create document type ${i}`, createDocumentTypeFn);
    }

    for (let i = 0; i < userCount; ++i) {
        it(`create user ${i}`, shared.createUser(store));
    }

    it('error: no documents of existing types', function () {
        return User.getRequiredDocuments(store.userIds[0])
            .then(shared.throwingHandler, shared.expectedErrorHandler('documentNoSystemDocuments'));
    });

    const createDocumentFn = (function () {
        let index = -1;

        return function (typeIndex) {
            return function () {
                ++index;
                const typeId = store.documentTypes[typeIndex].id;
                const doc = {
                    typeId,
                    content: `Sample document content ${index}`
                };
                store.clientDocuments.push(doc);
                return Document.createDocument(doc)
                    .then(({ id }) => {
                        return Document.getDocumentText(id)
                            .then(result => {
                                expect(result).to.equal(doc.content);
                                const docToStore = Object.assign({}, doc, { id });
                                store.documents.push(docToStore);
                                store.activeDocuments[typeIndex] = docToStore;
                            });
                    });
            };
        };
    })();

    for (let i = 0; i < 2; ++i) {
        it(`create/verify document of type ${i}`, createDocumentFn(i));
    }

    const verifyDocumentsFn = function (userIndex, expectedIndices) {
        return function () {
            return User.getRequiredDocuments(store.userIds[userIndex])
                .then(documents => {
                    const rawExpected = expectedIndices.map(index => ({
                        id: store.activeDocuments[index].id,
                        description: store.documentTypes[index].description
                    }));
                    const expected = _.sortBy(rawExpected, 'id');
                    expect(documents).to.deep.equal(expected);
                    return expected;
                })
                .then(() => {
                    const docs = expectedIndices.map(index => store.activeDocuments[index]);
                    return models.sequelize.Promise.all(docs.map(({ id, content }) => {
                        return Document.getDocumentText(id)
                            .then(text => {
                                expect(text).to.equal(content);
                            });
                    }));
                });
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`verify documents required for user ${i}`, verifyDocumentsFn(i, [0, 1]));
    }

    const signDocumentTypeFn = function (userIndex, typeIndex) {
        return function () {
            const documentId = store.activeDocuments[typeIndex].id;
            const userId = store.userIds[userIndex];
            store.signatures[userIndex].push(documentId);
            return DocumentSignature.createSignature(userId, documentId);
        };
    };

    it('user 0 signs document 0', signDocumentTypeFn(0, 0));
    it('user 0 signs document 1', signDocumentTypeFn(0, 1));
    it('user 1 signs document 0', signDocumentTypeFn(1, 0));
    it('user 1 signs document 1', signDocumentTypeFn(1, 1));
    it('user 2 signs document 0', signDocumentTypeFn(2, 0));
    it('user 3 signs document 1', signDocumentTypeFn(3, 1));

    it('verify documents required for user 0', verifyDocumentsFn(0, []));
    it('verify documents required for user 1', verifyDocumentsFn(1, []));
    it('verify documents required for user 2', verifyDocumentsFn(2, [1]));
    it('verify documents required for user 3', verifyDocumentsFn(3, [0]));

    it('error: invalid user signs document 0', function () {
        const documentId = store.activeDocuments[0].id;
        return DocumentSignature.createSignature(9999, documentId)
            .then(shared.throwingHandler, err => {
                expect(err).is.instanceof(models.sequelize.ForeignKeyConstraintError);
            });
    });

    it('error: user 0 signs invalid document', function () {
        const userId = store.userIds[0];
        return DocumentSignature.createSignature(userId, 9999)
            .then(shared.throwingHandler, err => {
                console.log(err);
                expect(err).is.instanceof(models.sequelize.ForeignKeyConstraintError);
            });
    });

    it('add a new document type', createDocumentTypeFn);

    it('error: no documents of existing types', function () {
        return User.getRequiredDocuments(store.userIds[2])
            .then(shared.throwingHandler, shared.expectedErrorHandler('documentNoSystemDocuments'));
    });

    it('create/verify document of type 2', createDocumentFn(2));

    it('verify documents required for user 0', verifyDocumentsFn(0, [2]));
    it('verify documents required for user 1', verifyDocumentsFn(1, [2]));
    it('verify documents required for user 2', verifyDocumentsFn(2, [1, 2]));
    it('verify documents required for user 3', verifyDocumentsFn(3, [0, 2]));

    it('user 2 signs document 2', signDocumentTypeFn(2, 2));
    it('verify documents required for user 2', verifyDocumentsFn(2, [1]));

    it('create/verify document of type 1', createDocumentFn(1));

    it('verify documents required for user 0', verifyDocumentsFn(0, [1, 2]));
    it('verify documents required for user 1', verifyDocumentsFn(1, [1, 2]));
    it('verify documents required for user 2', verifyDocumentsFn(2, [1]));
    it('verify documents required for user 3', verifyDocumentsFn(3, [0, 1, 2]));

    it('user 1 signs document 2', signDocumentTypeFn(1, 2));
    it('verify documents required for user 1', verifyDocumentsFn(1, [1]));

    it('create/verify document of type 0', createDocumentFn(0));

    it('verify documents required for user 0', verifyDocumentsFn(0, [0, 1, 2]));
    it('verify documents required for user 1', verifyDocumentsFn(1, [0, 1]));
    it('verify documents required for user 2', verifyDocumentsFn(2, [0, 1]));
    it('verify documents required for user 3', verifyDocumentsFn(3, [0, 1, 2]));

    it('user 2 signs document 1', signDocumentTypeFn(2, 1));
    it('user 3 signs document 1', signDocumentTypeFn(3, 1));

    it('verify documents required for user 0', verifyDocumentsFn(0, [0, 1, 2]));
    it('verify documents required for user 1', verifyDocumentsFn(1, [0, 1]));
    it('verify documents required for user 2', verifyDocumentsFn(2, [0]));
    it('verify documents required for user 3', verifyDocumentsFn(3, [0, 2]));

    it('create/verify document of type 1', createDocumentFn(1));

    it('verify documents required for user 0', verifyDocumentsFn(0, [0, 1, 2]));
    it('verify documents required for user 1', verifyDocumentsFn(1, [0, 1]));
    it('verify documents required for user 2', verifyDocumentsFn(2, [0, 1]));
    it('verify documents required for user 3', verifyDocumentsFn(3, [0, 1, 2]));

    it('user 0 signs document 1', signDocumentTypeFn(0, 1));
    it('verify documents required for user 0', verifyDocumentsFn(0, [0, 2]));
    it('user 0 signs document 2', signDocumentTypeFn(0, 2));
    it('verify documents required for user 0', verifyDocumentsFn(0, [0]));
    it('user 0 signs document 0', signDocumentTypeFn(0, 0));
    it('verify documents required for user 0', verifyDocumentsFn(0, []));

    it('delete document type 1', function () {
        const id = store.documentTypes[1].id;
        return DocumentType.deleteDocumentType(id)
            .then(() => {
                return DocumentType.getDocumentTypes()
                    .then(result => {
                        const allDocTypes = [0, 2].map(i => store.documentTypes[i]);
                        expect(result).to.deep.equal(allDocTypes);
                    });
            });
    });

    it('verify documents required for user 0', verifyDocumentsFn(0, []));
    it('verify documents required for user 1', verifyDocumentsFn(1, [0]));
    it('verify documents required for user 2', verifyDocumentsFn(2, [0]));
    it('verify documents required for user 3', verifyDocumentsFn(3, [0, 2]));

    const verifySignatureExistenceFn = function (userIndex) {
        return function () {
            const userId = store.userIds[userIndex];
            return DocumentSignature.findAll({
                    where: { userId },
                    raw: true,
                    attributes: ['documentId', 'createdAt'],
                    order: 'document_id'
                })
                .then(result => {
                    const actual = _.map(result, 'documentId');
                    const expected = _.sortBy(store.signatures[userIndex]);
                    expect(actual).to.deep.equal(expected);
                    const allExists = _.map(result, 'createdAt').map(r => !!r);
                    expect(allExists).to.deep.equal(Array(expected.length).fill(true));
                });
        };
    };

    for (let i = 0; i < userCount; ++i) {
        it(`verify all signings still exists for user ${i}`, verifySignatureExistenceFn(i));
    }

    it('verify all documents still exists', function () {
        const queryParams = { raw: true, attributes: ['id', 'typeId', 'content'], order: ['id'] };
        const queryParamsAll = Object.assign({}, { paranoid: false }, queryParams);
        return Document.findAll(queryParamsAll)
            .then(documents => {
                expect(documents).to.deep.equal(store.documents);
            })
            .then(() => Document.findAll(queryParams))
            .then(documents => {
                const expected = _.sortBy([store.activeDocuments[0], store.activeDocuments[2]], 'id');
                expect(documents).to.deep.equal(expected);
            });
    });
});
