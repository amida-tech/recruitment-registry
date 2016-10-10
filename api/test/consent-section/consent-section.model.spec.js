/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const shared = require('../util/shared-spec');
const models = require('../../models');
const expect = chai.expect;

const User = models.User;
const ConsentSectionType = models.ConsentSectionType;
const ConsentSection = models.ConsentSection;
const ConsentSectionSignature = models.ConsentSectionSignature;

describe('consent section unit', function () {
    const userCount = 4;

    const store = {
        userIds: [],
        consentSectionTypes: [],
        clientConsentSections: [],
        consentSections: [],
        activeConsentSections: [],
        signatures: _.range(userCount).map(() => [])
    };

    before(shared.setUpFn());

    const verifyConsentSectionTypeInListFn = function () {
        return function () {
            return ConsentSectionType.listConsentSectionTypes()
                .then(result => {
                    expect(result).to.deep.equal(store.consentSectionTypes);
                });
        };
    };

    for (let i = 0; i < 2; ++i) {
        it(`create consent section type ${i}`, shared.createConsentSectionTypeFn(store));
        it(`verify consent section type ${i} in the list`, verifyConsentSectionTypeInListFn);
    }

    for (let i = 0; i < userCount; ++i) {
        it(`create user ${i}`, shared.createUser(store));
    }

    it('error: no consent sections of existing types', function () {
        return User.listConsentSections(store.userIds[0])
            .then(shared.throwingHandler, shared.expectedErrorHandler('noSystemConsentSections'));
    });

    const verifyConsentSectionContentFn = function (typeIndex) {
        return function () {
            const doc = store.activeConsentSections[typeIndex];
            return ConsentSection.getContent(doc.id)
                .then(result => {
                    expect(result).to.deep.equal({ content: doc.content });
                });
        };
    };

    for (let i = 0; i < 2; ++i) {
        it(`create/verify consent section of type ${i}`, shared.createConsentSectionFn(store, i));
        it(`verify consent section content of type ${i})`, verifyConsentSectionContentFn(i));
    }

    const verifyConsentSectionsFn = function (userIndex, expectedIndices) {
        return function () {
            return User.listConsentSections(store.userIds[userIndex])
                .then(consentSections => {
                    const rawExpected = expectedIndices.map(index => ({
                        id: store.activeConsentSections[index].id,
                        name: store.consentSectionTypes[index].name,
                        title: store.consentSectionTypes[index].title
                    }));
                    const expected = _.sortBy(rawExpected, 'id');
                    expect(consentSections).to.deep.equal(expected);
                    return expected;
                })
                .then(() => {
                    const docs = expectedIndices.map(index => store.activeConsentSections[index]);
                    return models.sequelize.Promise.all(docs.map(({ id, content }) => {
                        return ConsentSection.getContent(id)
                            .then(text => {
                                expect(text).to.deep.equal({ content });
                            });
                    }));
                });
        };
    };

    for (let i = 0; i < 4; ++i) {
        it(`verify consent sections required for user ${i}`, verifyConsentSectionsFn(i, [0, 1]));
    }

    const signConsentSectionTypeFn = function (userIndex, typeIndex) {
        return function () {
            const consentSectionId = store.activeConsentSections[typeIndex].id;
            const userId = store.userIds[userIndex];
            store.signatures[userIndex].push(consentSectionId);
            return ConsentSectionSignature.createSignature(userId, consentSectionId);
        };
    };

    it('user 0 signs consent section 0', signConsentSectionTypeFn(0, 0));
    it('user 0 signs consent section 1', signConsentSectionTypeFn(0, 1));
    it('user 1 signs consent section 0', signConsentSectionTypeFn(1, 0));
    it('user 1 signs consent section 1', signConsentSectionTypeFn(1, 1));
    it('user 2 signs consent section 0', signConsentSectionTypeFn(2, 0));
    it('user 3 signs consent section 1', signConsentSectionTypeFn(3, 1));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, []));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, []));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [1]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0]));

    it('error: invalid user signs consent section 0', function () {
        const consentSectionId = store.activeConsentSections[0].id;
        return ConsentSectionSignature.createSignature(9999, consentSectionId)
            .then(shared.throwingHandler, err => {
                expect(err).is.instanceof(models.sequelize.ForeignKeyConstraintError);
            });
    });

    it('error: user 0 signs invalid consent section', function () {
        const userId = store.userIds[0];
        return ConsentSectionSignature.createSignature(userId, 9999)
            .then(shared.throwingHandler, err => {
                expect(err).is.instanceof(models.sequelize.ForeignKeyConstraintError);
            });
    });

    it('add a new consent section type', shared.createConsentSectionTypeFn(store));
    it(`verify the new consent section in the list`, verifyConsentSectionTypeInListFn);

    it('error: no consent sections of existing types', function () {
        return User.listConsentSections(store.userIds[2])
            .then(shared.throwingHandler, shared.expectedErrorHandler('noSystemConsentSections'));
    });

    it('create/verify consent section of type 2', shared.createConsentSectionFn(store, 2));
    it(`verify consent section content of type 2)`, verifyConsentSectionContentFn(2));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [2]));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [2]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [1, 2]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 2]));

    it('user 2 signs consent section 2', signConsentSectionTypeFn(2, 2));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [1]));

    it('create/verify consent section of type 1', shared.createConsentSectionFn(store, 1));
    it(`verify consent section content of type 1)`, verifyConsentSectionContentFn(1));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [1, 2]));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [1, 2]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [1]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 1, 2]));

    it('user 1 signs consent section 2', signConsentSectionTypeFn(1, 2));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [1]));

    it('create/verify consent section of type 0', shared.createConsentSectionFn(store, 0));
    it(`verify consent section content of type 0)`, verifyConsentSectionContentFn(0));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [0, 1, 2]));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [0, 1]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [0, 1]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 1, 2]));

    it('user 2 signs consent section 1', signConsentSectionTypeFn(2, 1));
    it('user 3 signs consent section 1', signConsentSectionTypeFn(3, 1));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [0, 1, 2]));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [0, 1]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [0]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 2]));

    it('create/verify consent section of type 1', shared.createConsentSectionFn(store, 1));
    it(`verify consent section content of type 1)`, verifyConsentSectionContentFn(1));

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [0, 1, 2]));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [0, 1]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [0, 1]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 1, 2]));

    it('user 0 signs consent section 1', signConsentSectionTypeFn(0, 1));
    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [0, 2]));
    it('user 0 signs consent section 2', signConsentSectionTypeFn(0, 2));
    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, [0]));
    it('user 0 signs consent section 0', signConsentSectionTypeFn(0, 0));
    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, []));

    it('delete consent section type 1', function () {
        const id = store.consentSectionTypes[1].id;
        return ConsentSectionType.deleteConsentSectionType(id)
            .then(() => {
                return ConsentSectionType.listConsentSectionTypes()
                    .then(result => {
                        const allDocTypes = [0, 2].map(i => store.consentSectionTypes[i]);
                        expect(result).to.deep.equal(allDocTypes);
                    });
            });
    });

    it('verify consent sections required for user 0', verifyConsentSectionsFn(0, []));
    it('verify consent sections required for user 1', verifyConsentSectionsFn(1, [0]));
    it('verify consent sections required for user 2', verifyConsentSectionsFn(2, [0]));
    it('verify consent sections required for user 3', verifyConsentSectionsFn(3, [0, 2]));

    const verifySignatureExistenceFn = function (userIndex) {
        return function () {
            const userId = store.userIds[userIndex];
            return ConsentSectionSignature.findAll({
                    where: { userId },
                    raw: true,
                    attributes: ['consentSectionId', 'createdAt'],
                    order: 'consent_section_id'
                })
                .then(result => {
                    const actual = _.map(result, 'consentSectionId');
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

    it('verify all consent sections still exists', function () {
        const queryParams = { raw: true, attributes: ['id', 'typeId', 'content'], order: ['id'] };
        const queryParamsAll = Object.assign({}, { paranoid: false }, queryParams);
        return ConsentSection.findAll(queryParamsAll)
            .then(consentSections => {
                expect(consentSections).to.deep.equal(store.consentSections);
            })
            .then(() => ConsentSection.findAll(queryParams))
            .then(consentSections => {
                const expected = _.sortBy([store.activeConsentSections[0], store.activeConsentSections[2]], 'id');
                expect(consentSections).to.deep.equal(expected);
            });
    });
});
