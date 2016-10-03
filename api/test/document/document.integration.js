/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const shared = require('../shared-integration');
const entityGen = require('../shared-spec');
const config = require('../../config');
const RRError = require('../../lib/rr-error');

const expect = chai.expect;

describe('document integration', function () {
    const userCount = 4;

    const store = {
        users: [],
        documentTypes: [],
        clientDocuments: [],
        documents: [],
        activeDocuments: [],
        signatures: _.range(userCount).map(() => [])
    };

    before(shared.setUpFn(store));

    const createDocumentTypeFn = function (index) {
        const docType = {
            name: `type_${index}`,
            description: `description_${index}`
        };
        return function (done) {
            store.server
                .post('/api/v1.0/document-types')
                .set('Authorization', store.auth)
                .send(docType)
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const id = res.body.id;
                    const newDocType = Object.assign({}, docType, { id });
                    store.documentTypes.push(newDocType);
                    store.activeDocuments.push(null);
                    done();
                });
        };
    };

    const listDocumentTypesFn = function () {
        return function (done) {
            store.server
                .get('/api/v1.0/document-types')
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body).to.deep.equal(store.documentTypes);
                    done();
                });
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));

    for (let i = 0; i < 2; ++i) {
        it(`create document type ${i}`, createDocumentTypeFn(i));
        it('get/verify document types', listDocumentTypesFn());
    }

    for (let i = 0; i < userCount; ++i) {
        it(`create user ${i}`, shared.createUserFn(store, entityGen.genNewUser()));
    }

    it('logout as super', shared.logoutFn(store));

    it('login as user 0', shared.loginFn(store, 0));
    it('error: no documents of existing types', function (done) {
        store.server
            .get(`/api/v1.0/users/documents`)
            .set('Authorization', store.auth)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.message).to.equal(RRError.message('documentNoSystemDocuments'));
                done();
            });
    });
    it('logout as user 0', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));

    const createDocumentFn = (function () {
        let index = -1;

        return function (typeIndex) {
            return function (done) {
                ++index;
                const typeId = store.documentTypes[typeIndex].id;
                const content = `Sample document content ${index}`;
                store.clientDocuments.push(content);
                store.server
                    .post(`/api/v1.0/documents/type/${typeId}`)
                    .set('Authorization', store.auth)
                    .send({ content })
                    .expect(201)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }
                        const id = res.body.id;
                        const docToStore = { id, typeId, content };
                        store.documents.push(docToStore);
                        store.activeDocuments[typeIndex] = docToStore;
                        done();
                    });
            };
        };
    })();

    const getDocumentFn = function (typeIndex) {
        return function (done) {
            const id = store.activeDocuments[typeIndex].id;
            store.server
                .get(`/api/v1.0/documents/${id}`)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const expected = store.activeDocuments[typeIndex].content;
                    expect(res.body.content).to.equal(expected);
                    done();
                });
        };
    };

    for (let i = 0; i < 2; ++i) {
        it(`create document of type ${i}`, createDocumentFn(i));
        it(`get/verify document content of type ${i}`, getDocumentFn(i));
    }

    const getUserDocumentsFn = function (expectedIndices) {
        return function (done) {
            store.server
                .get('/api/v1.0/users/documents')
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const rawExpected = expectedIndices.map(index => ({
                        id: store.activeDocuments[index].id,
                        description: store.documentTypes[index].description
                    }));
                    const expected = _.sortBy(rawExpected, 'id');
                    expect(res.body).to.deep.equal(expected);
                    done();
                });
        };
    };

    const getContentFn = function (expectedIndex) {
        return function (done) {
            const doc = store.activeDocuments[expectedIndex];
            store.server
                .get(`/api/v1.0/documents/${doc.id}`)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    expect(res.body).to.deep.equal({ content: doc.content });
                    done();
                });
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`login as user ${i}`, shared.loginFn(store, store.users[i]));
        it(`verify documents required for user ${i}`, getUserDocumentsFn([0, 1]));
        it(`user ${i} get document 0`, getContentFn(0));
        it(`user ${i} get document 1`, getContentFn(1));
        it(`logout as user ${i}`, shared.logoutFn(store));
    }

    const signDocumentTypeFn = function (typeIndex) {
        return function (done) {
            const documentId = store.activeDocuments[typeIndex].id;
            store.server
                .post(`/api/v1.0/document-signatures`)
                .set('Authorization', store.auth)
                .send({ documentId })
                .expect(201, done);
        };
    };

    const signDocumentTypeAgainFn = function (typeIndex) {
        return function (done) {
            const documentId = store.activeDocuments[typeIndex].id;
            store.server
                .post(`/api/v1.0/document-signatures`)
                .set('Authorization', store.auth)
                .send({ documentId })
                .expect(400, done);
        };
    };

    it(`login as user 0`, shared.loginFn(store, 0));
    it('user 0 signs document 0', signDocumentTypeFn(0));
    it('user 0 signs document 1', signDocumentTypeFn(1));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 0`, shared.loginFn(store, 0));
    it('user 0 signs document again 0', signDocumentTypeAgainFn(0));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginFn(store, 1));
    it('user 1 signs document 0', signDocumentTypeFn(0));
    it('user 1 signs document 1', signDocumentTypeFn(1));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginFn(store, 2));
    it('user 2 signs document 1', signDocumentTypeFn(0));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginFn(store, 3));
    it('user 3 signs document 0', signDocumentTypeFn(1));
    it('logout as user 3', shared.logoutFn(store));

    it(`login as user 0`, shared.loginFn(store, 0));
    it(`verify documents required for user 0`, getUserDocumentsFn([]));
    it('logout as user 0', shared.logoutFn(store));

    it(`login as user 1`, shared.loginFn(store, 1));
    it(`verify documents required for user 1`, getUserDocumentsFn([]));
    it('logout as user 1', shared.logoutFn(store));

    it(`login as user 2`, shared.loginFn(store, 2));
    it(`verify documents required for user 2`, getUserDocumentsFn([1]));
    it(`user 2 get document 1`, getContentFn(1));
    it('logout as user 2', shared.logoutFn(store));

    it(`login as user 3`, shared.loginFn(store, 3));
    it(`verify documents required for user 3`, getUserDocumentsFn([0]));
    it(`user 3 get document 0`, getContentFn(0));
    it('logout as user 3', shared.logoutFn(store));

    it('login as super', shared.loginFn(store, config.superUser));
    it('add a new document type', createDocumentTypeFn(2));
    it('create/verify document of type 2', createDocumentFn(2));
    it('logout as super', shared.logoutFn(store));

    const signDocumentType = ((userIndex, documentIndex) => {
        it(`login as user ${userIndex}`, shared.loginFn(store, userIndex));
        it(`user ${userIndex} signs document ${documentIndex}`, signDocumentTypeFn(documentIndex));
        it(`logout as user ${userIndex}`, shared.logoutFn(store));
    });

    const verifyDocuments = ((userIndex, documentIndices) => {
        it(`login as user ${userIndex}`, shared.loginFn(store, userIndex));
        it(`verify documents required for user ${userIndex}`, getUserDocumentsFn(documentIndices));
        for (let i = 0; i < documentIndices.length; ++i) {
            it(`user ${userIndex} get document ${i}`, getContentFn(i));
        }
        it(`logout as user ${userIndex}`, shared.logoutFn(store));
    });

    verifyDocuments(0, [2]);
    verifyDocuments(1, [2]);
    verifyDocuments(2, [1, 2]);
    verifyDocuments(3, [0, 2]);

    signDocumentType(2, 2);

    verifyDocuments(2, [1]);

    it('login as super', shared.loginFn(store, config.superUser));
    it('create/verify document of type 1', createDocumentFn(1));
    it('logout as super', shared.logoutFn(store));

    verifyDocuments(0, [1, 2]);
    verifyDocuments(1, [1, 2]);
    verifyDocuments(2, [1]);
    verifyDocuments(3, [0, 1, 2]);

    signDocumentType(1, 2);
    verifyDocuments(1, [1]);

    it('login as super', shared.loginFn(store, config.superUser));
    it('create/verify document of type 0', createDocumentFn(0));
    it('logout as super', shared.logoutFn(store));

    verifyDocuments(0, [0, 1, 2]);
    verifyDocuments(1, [0, 1]);
    verifyDocuments(2, [0, 1]);
    verifyDocuments(3, [0, 1, 2]);

    signDocumentType(2, 1);
    signDocumentType(3, 1);

    verifyDocuments(0, [0, 1, 2]);
    verifyDocuments(1, [0, 1]);
    verifyDocuments(2, [0]);
    verifyDocuments(3, [0, 2]);

    it('login as super', shared.loginFn(store, config.superUser));
    it('create/verify document of type 1', createDocumentFn(1));
    it('logout as super', shared.logoutFn(store));

    verifyDocuments(0, [0, 1, 2]);
    verifyDocuments(1, [0, 1]);
    verifyDocuments(2, [0, 1]);
    verifyDocuments(3, [0, 1, 2]);

    signDocumentType(0, 1);
    verifyDocuments(0, [0, 2]);
    signDocumentType(0, 2);
    verifyDocuments(0, [0]);
    signDocumentType(0, 0);
    verifyDocuments(0, []);

    const deleteDocumentTypeFn = function (index) {
        return function (done) {
            const id = store.documentTypes[index].id;
            store.server
                .delete(`/api/v1.0/document-types/${id}`)
                .set('Authorization', store.auth)
                .expect(204)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    store.documentTypes.splice(index, 1);
                    store.activeDocuments.splice(index, 1);
                    done();
                });
        };
    };

    it('login as super', shared.loginFn(store, config.superUser));
    it('delete document type 1', deleteDocumentTypeFn(1));
    it('get/verify document types', listDocumentTypesFn());
    it('logout as super', shared.logoutFn(store));

    verifyDocuments(0, []);
    verifyDocuments(1, [0]);
    verifyDocuments(2, [0]);
    verifyDocuments(3, [0, 1]);
});
